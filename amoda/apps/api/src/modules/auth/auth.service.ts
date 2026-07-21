import {
  BadRequestException,
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { AuthProvider, Role, User } from '@prisma/client';
import * as argon2 from 'argon2';
import { randomBytes, randomInt } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../notifications/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { TwoFactorService } from './two-factor.service';

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface OAuthProfile {
  providerId: string;
  email?: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
}

const OTP_PURPOSE_VERIFY_EMAIL = 'VERIFY_EMAIL';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly mail: MailService,
    private readonly twoFactor: TwoFactorService,
  ) {}

  private sanitize(user: User) {
    const {
      passwordHash: _passwordHash,
      twoFactorSecret: _twoFactorSecret,
      ...safe
    } = user;
    return safe;
  }

  async register(dto: RegisterDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (existing) {
      throw new ConflictException('An account with this email already exists');
    }

    const passwordHash = await argon2.hash(dto.password);

    const user = await this.prisma.user.create({
      data: {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        role: Role.CUSTOMER,
        provider: AuthProvider.EMAIL,
      },
    });

    await this.issueAndSendOtp(user.id, user.email, OTP_PURPOSE_VERIFY_EMAIL);

    return { user: this.sanitize(user) };
  }

  async issueAndSendOtp(userId: string, email: string, purpose: string) {
    const code = randomInt(0, 1_000_000).toString().padStart(6, '0');
    const codeHash = await argon2.hash(code);

    await this.prisma.otpCode.create({
      data: {
        userId,
        codeHash,
        purpose,
        expiresAt: new Date(Date.now() + 10 * 60 * 1000),
      },
    });

    await this.mail.sendOtpEmail(email, code);
  }

  async verifyOtp(email: string, code: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid verification code');
    }

    const otp = await this.prisma.otpCode.findFirst({
      where: {
        userId: user.id,
        purpose: OTP_PURPOSE_VERIFY_EMAIL,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (!otp || !(await argon2.verify(otp.codeHash, code))) {
      throw new BadRequestException('Invalid or expired verification code');
    }

    await this.prisma.$transaction([
      this.prisma.otpCode.update({
        where: { id: otp.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.user.update({
        where: { id: user.id },
        data: { isEmailVerified: true },
      }),
    ]);

    return { verified: true };
  }

  async resendOtp(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { sent: true };
    }
    if (!user.isEmailVerified) {
      await this.issueAndSendOtp(user.id, user.email, OTP_PURPOSE_VERIFY_EMAIL);
    }
    return { sent: true };
  }

  async login(dto: LoginDto, meta: { ipAddress?: string; userAgent?: string }) {
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (
      !user ||
      !user.passwordHash ||
      !(await argon2.verify(user.passwordHash, dto.password))
    ) {
      await this.recordLoginEvent(user?.id, meta, false);
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isActive || user.isSuspended) {
      throw new UnauthorizedException('Account is inactive or suspended');
    }

    if (user.isTwoFactorOn) {
      return { twoFactorRequired: true as const, email: user.email };
    }

    const tokens = await this.issueTokenPair(user, meta);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: meta.ipAddress },
    });
    await this.recordLoginEvent(user.id, meta, true);

    return { user: this.sanitize(user), ...tokens };
  }

  async verifyTwoFactorLogin(
    email: string,
    token: string,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    const user = await this.prisma.user.findUnique({ where: { email } });

    if (!user || !user.isTwoFactorOn || !user.twoFactorSecret) {
      throw new UnauthorizedException(
        'Two-factor authentication is not enabled for this account',
      );
    }

    if (!(await this.twoFactor.verify(token, user.twoFactorSecret))) {
      await this.recordLoginEvent(user.id, meta, false);
      throw new UnauthorizedException('Invalid authentication code');
    }

    const tokens = await this.issueTokenPair(user, meta);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date(), lastLoginIp: meta.ipAddress },
    });
    await this.recordLoginEvent(user.id, meta, true);

    return { user: this.sanitize(user), ...tokens };
  }

  async setupTwoFactor(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new BadRequestException('User not found');

    const { secret, otpauthUrl } = this.twoFactor.generateSecret(user.email);
    await this.prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    const qrCodeDataUrl = await this.twoFactor.toDataUrl(otpauthUrl);
    return { secret, qrCodeDataUrl };
  }

  async enableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.twoFactorSecret) {
      throw new BadRequestException(
        'Call the setup endpoint before enabling two-factor authentication',
      );
    }

    if (!(await this.twoFactor.verify(token, user.twoFactorSecret))) {
      throw new BadRequestException('Invalid authentication code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorOn: true },
    });
    return { enabled: true };
  }

  async disableTwoFactor(userId: string, token: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.isTwoFactorOn || !user.twoFactorSecret) {
      throw new BadRequestException('Two-factor authentication is not enabled');
    }

    if (!(await this.twoFactor.verify(token, user.twoFactorSecret))) {
      throw new BadRequestException('Invalid authentication code');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: { isTwoFactorOn: false, twoFactorSecret: null },
    });
    return { disabled: true };
  }

  async loginOrRegisterWithOAuth(
    provider: AuthProvider,
    profile: OAuthProfile,
  ) {
    if (!profile.email) {
      throw new BadRequestException(
        'OAuth provider did not return an email address',
      );
    }

    let user = await this.prisma.user.findUnique({
      where: { email: profile.email },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: profile.email,
          firstName: profile.firstName,
          lastName: profile.lastName,
          avatarUrl: profile.avatarUrl,
          provider,
          providerId: profile.providerId,
          isEmailVerified: true,
          role: Role.CUSTOMER,
        },
      });
    }

    const tokens = await this.issueTokenPair(user, {});
    return { user: this.sanitize(user), ...tokens };
  }

  async issueTokenPair(
    user: User,
    meta: { ipAddress?: string; userAgent?: string },
  ): Promise<TokenPair> {
    const accessToken = await this.jwt.signAsync(
      { sub: user.id, email: user.email, role: user.role },
      {
        secret: this.config.get<string>('jwt.accessSecret'),
        expiresIn: this.config.get<string>('jwt.accessExpiresIn'),
      },
    );

    const refreshTokenValue = randomBytes(48).toString('hex');
    const tokenHash = await argon2.hash(refreshTokenValue);

    await this.prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    const refreshToken = await this.jwt.signAsync(
      { sub: user.id, tokenValue: refreshTokenValue },
      {
        secret: this.config.get<string>('jwt.refreshSecret'),
        expiresIn: this.config.get<string>('jwt.refreshExpiresIn'),
      },
    );

    return { accessToken, refreshToken };
  }

  async refreshTokens(
    refreshToken: string,
    meta: { ipAddress?: string; userAgent?: string },
  ) {
    let payload: { sub: string; tokenValue: string };
    try {
      payload = await this.jwt.verifyAsync(refreshToken, {
        secret: this.config.get<string>('jwt.refreshSecret'),
      });
    } catch {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const candidates = await this.prisma.refreshToken.findMany({
      where: {
        userId: payload.sub,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
    });

    let matched = null;
    for (const candidate of candidates) {
      if (await argon2.verify(candidate.tokenHash, payload.tokenValue)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      throw new UnauthorizedException(
        'Refresh token has been revoked or is invalid',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
    });
    if (!user || !user.isActive || user.isSuspended) {
      throw new UnauthorizedException('Account is inactive or suspended');
    }

    await this.prisma.refreshToken.update({
      where: { id: matched.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokenPair(user, meta);
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      try {
        const payload = await this.jwt.verifyAsync<{
          sub: string;
          tokenValue: string;
        }>(refreshToken, {
          secret: this.config.get<string>('jwt.refreshSecret'),
        });
        const candidates = await this.prisma.refreshToken.findMany({
          where: { userId: payload.sub, revokedAt: null },
        });
        for (const candidate of candidates) {
          if (await argon2.verify(candidate.tokenHash, payload.tokenValue)) {
            await this.prisma.refreshToken.update({
              where: { id: candidate.id },
              data: { revokedAt: new Date() },
            });
            break;
          }
        }
        return { loggedOut: true };
      } catch {
        // fall through to revoke-all below
      }
    }

    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
    return { loggedOut: true };
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      return { sent: true };
    }

    const tokenValue = randomBytes(32).toString('hex');
    const tokenHash = await argon2.hash(tokenValue);

    await this.prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 60 * 60 * 1000),
      },
    });

    const resetUrl = `${this.config.get<string>('clientUrl')}/reset-password?token=${tokenValue}&email=${encodeURIComponent(email)}`;
    await this.mail.sendPasswordResetEmail(email, resetUrl);

    return { sent: true };
  }

  async resetPassword(email: string, token: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const candidates = await this.prisma.passwordResetToken.findMany({
      where: {
        userId: user.id,
        consumedAt: null,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: 'desc' },
    });

    let matched = null;
    for (const candidate of candidates) {
      if (await argon2.verify(candidate.tokenHash, token)) {
        matched = candidate;
        break;
      }
    }

    if (!matched) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    const passwordHash = await argon2.hash(newPassword);

    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: user.id },
        data: { passwordHash },
      }),
      this.prisma.passwordResetToken.update({
        where: { id: matched.id },
        data: { consumedAt: new Date() },
      }),
      this.prisma.refreshToken.updateMany({
        where: { userId: user.id, revokedAt: null },
        data: { revokedAt: new Date() },
      }),
    ]);

    return { reset: true };
  }

  private async recordLoginEvent(
    userId: string | undefined,
    meta: { ipAddress?: string; userAgent?: string },
    success: boolean,
  ) {
    if (!userId) return;
    await this.prisma.loginEvent.create({
      data: {
        userId,
        ipAddress: meta.ipAddress,
        userAgent: meta.userAgent,
        success,
      },
    });
  }
}

export { OTP_PURPOSE_VERIFY_EMAIL };
