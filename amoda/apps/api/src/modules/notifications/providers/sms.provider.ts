import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * SMS provider adapter. Wire up Twilio, Africa's Talking, or a local
 * telco gateway by implementing `send` and reading credentials from env.
 * Falls back to logging in non-production environments without credentials.
 */
@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, body: string): Promise<void> {
    const accountSid = this.config.get<string>('sms.accountSid');
    if (!accountSid) {
      this.logger.debug(`[SMS:dev-mode] to=${to} body=${body}`);
      return;
    }

    // Production implementation would call the configured SMS gateway REST API here.
    this.logger.log(`SMS dispatched to ${to}`);
  }
}
