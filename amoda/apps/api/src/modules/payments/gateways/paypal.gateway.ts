import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayProvider, PaymentStatus } from '@prisma/client';
import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentGateway,
} from './payment-gateway.interface';

interface PayPalAccessToken {
  token: string;
  expiresAt: number;
}

@Injectable()
export class PaypalGateway implements PaymentGateway {
  readonly provider = PaymentGatewayProvider.PAYPAL;
  private readonly logger = new Logger(PaypalGateway.name);
  private cachedToken: PayPalAccessToken | null = null;

  constructor(private readonly config: ConfigService) {}

  private get baseUrl() {
    return this.config.get<string>('paypal.apiBaseUrl')!;
  }

  private async getAccessToken(): Promise<string> {
    if (this.cachedToken && this.cachedToken.expiresAt > Date.now()) {
      return this.cachedToken.token;
    }

    const clientId = this.config.get<string>('paypal.clientId');
    const clientSecret = this.config.get<string>('paypal.clientSecret');
    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString(
      'base64',
    );

    const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basicAuth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });

    if (!response.ok) {
      throw new Error(
        `PayPal OAuth failed: ${response.status} ${await response.text()}`,
      );
    }

    const data = (await response.json()) as {
      access_token: string;
      expires_in: number;
    };
    this.cachedToken = {
      token: data.access_token,
      expiresAt: Date.now() + (data.expires_in - 60) * 1000,
    };
    return this.cachedToken.token;
  }

  async initiate(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult> {
    const token = await this.getAccessToken();

    const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.reference,
            description: params.description,
            amount: {
              currency_code: params.currency,
              value: params.amount.toFixed(2),
            },
          },
        ],
        application_context: {
          return_url: params.returnUrl,
          cancel_url: params.returnUrl,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(
        `PayPal order creation failed: ${response.status} ${await response.text()}`,
      );
    }

    const order = (await response.json()) as {
      id: string;
      links: { rel: string; href: string }[];
    };
    const approveLink = order.links.find(
      (link) => link.rel === 'approve',
    )?.href;

    return {
      providerRef: order.id,
      status: PaymentStatus.PENDING,
      redirectUrl: approveLink,
      raw: order,
    };
  }

  async verify(providerRef: string): Promise<PaymentStatus> {
    const token = await this.getAccessToken();
    const response = await fetch(
      `${this.baseUrl}/v2/checkout/orders/${providerRef}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );

    if (!response.ok) {
      this.logger.warn(
        `PayPal order lookup failed for ${providerRef}: ${response.status}`,
      );
      return PaymentStatus.FAILED;
    }

    const order = (await response.json()) as { status: string };
    switch (order.status) {
      case 'COMPLETED':
        return PaymentStatus.SUCCEEDED;
      case 'VOIDED':
        return PaymentStatus.CANCELLED;
      case 'APPROVED':
      case 'SAVED':
      case 'CREATED':
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.FAILED;
    }
  }
}
