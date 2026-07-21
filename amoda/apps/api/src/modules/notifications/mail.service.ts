import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly transporter: nodemailer.Transporter;
  private readonly from: string;

  constructor(private readonly config: ConfigService) {
    this.from = this.config.get<string>('mail.from')!;
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('mail.host'),
      port: this.config.get<number>('mail.port'),
      secure: this.config.get<number>('mail.port') === 465,
      auth: this.config.get<string>('mail.user')
        ? {
            user: this.config.get<string>('mail.user'),
            pass: this.config.get<string>('mail.pass'),
          }
        : undefined,
    });
  }

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({ from: this.from, to, subject, html });
    } catch (error) {
      this.logger.error(
        `Failed to send email to ${to}: ${(error as Error).message}`,
      );
    }
  }

  async sendOtpEmail(to: string, code: string) {
    await this.send(
      to,
      'Verify your AMODA account',
      `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#0F172A;">Welcome to AMODA</h2>
        <p>Your verification code is:</p>
        <p style="font-size:32px;font-weight:700;letter-spacing:4px;color:#2563EB;">${code}</p>
        <p>This code expires in 10 minutes.</p>
      </div>`,
    );
  }

  async sendPasswordResetEmail(to: string, resetUrl: string) {
    await this.send(
      to,
      'Reset your AMODA password',
      `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#0F172A;">Password reset requested</h2>
        <p>Click the link below to reset your password. This link expires in 1 hour.</p>
        <p><a href="${resetUrl}" style="background:#2563EB;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Reset password</a></p>
        <p>If you did not request this, you can safely ignore this email.</p>
      </div>`,
    );
  }

  async sendBookingConfirmation(
    to: string,
    propertyTitle: string,
    scheduledAt: Date,
  ) {
    await this.send(
      to,
      'Your viewing has been scheduled — AMODA',
      `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;">
        <h2 style="color:#0F172A;">Viewing scheduled</h2>
        <p>Your viewing for <strong>${propertyTitle}</strong> is scheduled for ${scheduledAt.toLocaleString()}.</p>
      </div>`,
    );
  }

  async sendGenericNotification(to: string, subject: string, body: string) {
    await this.send(
      to,
      subject,
      `<div style="font-family:Inter,Arial,sans-serif;max-width:480px;margin:0 auto;"><p>${body}</p></div>`,
    );
  }
}
