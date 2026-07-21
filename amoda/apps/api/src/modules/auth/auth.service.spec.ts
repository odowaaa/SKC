import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthProvider, Role } from '@prisma/client';
import * as argon2 from 'argon2';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../notifications/mail.service';
import { AuthService } from './auth.service';
import { TwoFactorService } from './two-factor.service';

// otplib ships ESM-only crypto deps that Jest's CJS transform can't parse;
// the real implementation isn't under test here, so stub the module entirely.
jest.mock('./two-factor.service', () => ({
  TwoFactorService: jest.fn().mockImplementation(() => ({
    generateSecret: jest.fn(),
    toDataUrl: jest.fn(),
    verify: jest.fn(),
  })),
}));

describe('AuthService', () => {
  let service: AuthService;

  const prismaMock = {
    user: { findUnique: jest.fn(), create: jest.fn(), update: jest.fn() },
    otpCode: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    refreshToken: {
      create: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
    loginEvent: { create: jest.fn() },
    $transaction: jest.fn((ops: unknown[]) =>
      Promise.all(ops as Promise<unknown>[]),
    ),
  };

  const mailMock = {
    sendOtpEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
  };

  const twoFactorMock = {
    generateSecret: jest.fn(),
    toDataUrl: jest.fn(),
    verify: jest.fn(),
  };

  const configValues: Record<string, string> = {
    'jwt.accessSecret': 'test-access-secret',
    'jwt.accessExpiresIn': '15m',
    'jwt.refreshSecret': 'test-refresh-secret',
    'jwt.refreshExpiresIn': '30d',
    clientUrl: 'http://localhost:3000',
  };
  const configMock = { get: jest.fn((key: string) => configValues[key]) };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: MailService, useValue: mailMock },
        { provide: TwoFactorService, useValue: twoFactorMock },
        JwtService,
        { provide: ConfigService, useValue: configMock },
      ],
    }).compile();

    service = moduleRef.get(AuthService);
  });

  describe('register', () => {
    it('rejects duplicate emails', async () => {
      prismaMock.user.findUnique.mockResolvedValue({ id: 'existing' });

      await expect(
        service.register({
          firstName: 'A',
          lastName: 'B',
          email: 'taken@amoda.app',
          password: 'StrongPass1',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('creates a new customer and sends an OTP email', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.user.create.mockResolvedValue({
        id: 'user_1',
        email: 'new@amoda.app',
        role: Role.CUSTOMER,
        provider: AuthProvider.EMAIL,
      });
      prismaMock.otpCode.create.mockResolvedValue({});

      const result = await service.register({
        firstName: 'A',
        lastName: 'B',
        email: 'new@amoda.app',
        password: 'StrongPass1',
      });

      expect(result.user.email).toBe('new@amoda.app');
      expect(mailMock.sendOtpEmail).toHaveBeenCalledWith(
        'new@amoda.app',
        expect.any(String),
      );
    });
  });

  describe('login', () => {
    it('rejects invalid credentials', async () => {
      prismaMock.user.findUnique.mockResolvedValue(null);
      prismaMock.loginEvent.create.mockResolvedValue({});

      await expect(
        service.login({ email: 'nobody@amoda.app', password: 'wrong' }, {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues tokens for valid credentials', async () => {
      const passwordHash = await argon2.hash('StrongPass1');
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user_1',
        email: 'user@amoda.app',
        passwordHash,
        isActive: true,
        isSuspended: false,
        role: Role.CUSTOMER,
      });
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.refreshToken.create.mockResolvedValue({});
      prismaMock.loginEvent.create.mockResolvedValue({});

      const result = await service.login(
        { email: 'user@amoda.app', password: 'StrongPass1' },
        {},
      );

      if (!('accessToken' in result))
        throw new Error('expected tokens, got 2FA challenge');
      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });

    it('requires two-factor verification instead of issuing tokens when enabled', async () => {
      const passwordHash = await argon2.hash('StrongPass1');
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user_2',
        email: '2fa@amoda.app',
        passwordHash,
        isActive: true,
        isSuspended: false,
        isTwoFactorOn: true,
        role: Role.CUSTOMER,
      });

      const result = await service.login(
        { email: '2fa@amoda.app', password: 'StrongPass1' },
        {},
      );

      expect(result).toEqual({
        twoFactorRequired: true,
        email: '2fa@amoda.app',
      });
    });
  });

  describe('verifyTwoFactorLogin', () => {
    it('rejects an invalid authentication code', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user_2',
        email: '2fa@amoda.app',
        isTwoFactorOn: true,
        twoFactorSecret: 'SECRET',
      });
      twoFactorMock.verify.mockResolvedValue(false);
      prismaMock.loginEvent.create.mockResolvedValue({});

      await expect(
        service.verifyTwoFactorLogin('2fa@amoda.app', '000000', {}),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('issues tokens for a valid authentication code', async () => {
      prismaMock.user.findUnique.mockResolvedValue({
        id: 'user_2',
        email: '2fa@amoda.app',
        isActive: true,
        isSuspended: false,
        isTwoFactorOn: true,
        twoFactorSecret: 'SECRET',
        role: Role.CUSTOMER,
      });
      twoFactorMock.verify.mockResolvedValue(true);
      prismaMock.user.update.mockResolvedValue({});
      prismaMock.refreshToken.create.mockResolvedValue({});
      prismaMock.loginEvent.create.mockResolvedValue({});

      const result = await service.verifyTwoFactorLogin(
        '2fa@amoda.app',
        '123456',
        {},
      );

      expect(result.accessToken).toBeDefined();
      expect(result.refreshToken).toBeDefined();
    });
  });
});
