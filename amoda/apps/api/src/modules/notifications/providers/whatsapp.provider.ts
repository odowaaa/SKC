import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * WhatsApp Business Cloud API adapter. Set WHATSAPP_PHONE_NUMBER_ID and
 * WHATSAPP_ACCESS_TOKEN to enable outbound messaging via Graph API.
 */
@Injectable()
export class WhatsappProvider {
  private readonly logger = new Logger(WhatsappProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(to: string, body: string): Promise<void> {
    const phoneNumberId = this.config.get<string>('whatsapp.phoneNumberId');
    const accessToken = this.config.get<string>('whatsapp.accessToken');

    if (!phoneNumberId || !accessToken) {
      this.logger.debug(`[WHATSAPP:dev-mode] to=${to} body=${body}`);
      return;
    }

    await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        to,
        type: 'text',
        text: { body },
      }),
    }).catch((error) =>
      this.logger.error(`WhatsApp send failed: ${(error as Error).message}`),
    );
  }
}
