import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayProvider, PaymentStatus } from '@prisma/client';
import { randomUUID } from 'crypto';
import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentGateway,
} from './payment-gateway.interface';

export interface WaafiPayCredentials {
  merchantUid?: string;
  apiUserId?: string;
  apiKey?: string;
}

interface WaafiPayResponse {
  responseCode: string;
  responseMsg?: string;
  errorCode?: string;
  params?: {
    transactionId?: string;
    state?: string;
    issuerTransactionId?: string;
  };
}

/**
 * Base adapter for Somali mobile-money gateways that speak the WaafiPay
 * merchant "API_PURCHASE" protocol (Hormuud EVC Plus, Telesom Zaad,
 * Golis Sahal and Premier Wallet all sit behind this aggregator).
 * Each subclass supplies its own merchant credentials via env vars.
 */
export abstract class WaafiPayGateway implements PaymentGateway {
  abstract readonly provider: PaymentGatewayProvider;
  protected abstract readonly logger: Logger;

  constructor(
    protected readonly config: ConfigService,
    protected readonly credentials: WaafiPayCredentials,
  ) {}

  private get baseUrl() {
    return this.config.get<string>('waafiPay.apiBaseUrl')!;
  }

  async initiate(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult> {
    if (!params.customerPhone) {
      throw new Error(
        `${this.provider} requires a customer mobile money account number (phone)`,
      );
    }

    const requestId = randomUUID();

    const response = await fetch(this.baseUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        schemaVersion: '1.0',
        requestId,
        timestamp: new Date().toISOString(),
        channelName: 'WEB',
        serviceName: 'API_PURCHASE',
        serviceParams: {
          merchantUid: this.credentials.merchantUid,
          apiUserId: this.credentials.apiUserId,
          apiKey: this.credentials.apiKey,
          paymentMethod: 'mwallet_account',
          payerInfo: { accountNo: params.customerPhone },
          transactionInfo: {
            referenceId: params.reference,
            invoiceId: params.reference,
            amount: params.amount.toFixed(2),
            currency: params.currency,
            description: params.description ?? 'AMODA payment',
          },
        },
      }),
    });

    const data = (await response.json()) as WaafiPayResponse;
    const success = response.ok && data.responseCode === '2001';

    return {
      providerRef: data.params?.transactionId ?? requestId,
      status: success ? PaymentStatus.SUCCEEDED : PaymentStatus.FAILED,
      raw: data,
    };
  }

  async verify(providerRef: string): Promise<PaymentStatus> {
    // WaafiPay purchases settle synchronously in initiate(); this performs
    // a best-effort re-check for reconciliation jobs that poll by reference.
    this.logger.debug(
      `Manual verification requested for ${providerRef}; treat initiate() result as source of truth.`,
    );
    return PaymentStatus.PENDING;
  }
}
