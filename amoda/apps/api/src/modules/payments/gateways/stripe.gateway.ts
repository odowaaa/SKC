import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayProvider, PaymentStatus } from '@prisma/client';
import Stripe from 'stripe';
import type {
  InitiatePaymentParams,
  InitiatePaymentResult,
  PaymentGateway,
} from './payment-gateway.interface';

@Injectable()
export class StripeGateway implements PaymentGateway {
  readonly provider = PaymentGatewayProvider.STRIPE;
  private readonly stripe: Stripe;

  constructor(private readonly config: ConfigService) {
    this.stripe = new Stripe(
      this.config.get<string>('stripe.secretKey') ?? 'sk_test_placeholder',
      {
        apiVersion: '2025-02-24.acacia',
      },
    );
  }

  async initiate(
    params: InitiatePaymentParams,
  ): Promise<InitiatePaymentResult> {
    const intent = await this.stripe.paymentIntents.create({
      amount: Math.round(params.amount * 100),
      currency: params.currency.toLowerCase(),
      description: params.description,
      receipt_email: params.customerEmail,
      metadata: { reference: params.reference },
      automatic_payment_methods: { enabled: true },
    });

    return {
      providerRef: intent.id,
      status: PaymentStatus.PENDING,
      raw: { clientSecret: intent.client_secret },
    };
  }

  async verify(providerRef: string): Promise<PaymentStatus> {
    const intent = await this.stripe.paymentIntents.retrieve(providerRef);
    return this.mapStatus(intent.status);
  }

  constructEvent(payload: Buffer, signature: string): Stripe.Event {
    return this.stripe.webhooks.constructEvent(
      payload,
      signature,
      this.config.get<string>('stripe.webhookSecret')!,
    );
  }

  private mapStatus(status: Stripe.PaymentIntent.Status): PaymentStatus {
    switch (status) {
      case 'succeeded':
        return PaymentStatus.SUCCEEDED;
      case 'processing':
        return PaymentStatus.PROCESSING;
      case 'canceled':
        return PaymentStatus.CANCELLED;
      case 'requires_payment_method':
      case 'requires_confirmation':
      case 'requires_action':
      case 'requires_capture':
        return PaymentStatus.PENDING;
      default:
        return PaymentStatus.FAILED;
    }
  }
}
