import { Injectable } from '@nestjs/common';
import { generateSecret, generateURI, verify } from 'otplib';
import * as QRCode from 'qrcode';

const ISSUER = 'AMODA';

@Injectable()
export class TwoFactorService {
  generateSecret(email: string) {
    const secret = generateSecret();
    const otpauthUrl = generateURI({ issuer: ISSUER, label: email, secret });
    return { secret, otpauthUrl };
  }

  async toDataUrl(otpauthUrl: string) {
    return QRCode.toDataURL(otpauthUrl);
  }

  async verify(token: string, secret: string) {
    try {
      const result = await verify({ token, secret });
      return result.valid;
    } catch {
      return false;
    }
  }
}
