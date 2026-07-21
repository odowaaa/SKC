import { PaymentGatewayProvider, PaymentStatus } from '@prisma/client';

export interface InitiatePaymentParams {
  amount: number;
  currency: string;
  reference: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  returnUrl?: string;
}

export interface InitiatePaymentResult {
  providerRef: string;
  status: PaymentStatus;
  redirectUrl?: string;
  raw?: unknown;
}

export interface PaymentGateway {
  readonly provider: PaymentGatewayProvider;
  initiate(params: InitiatePaymentParams): Promise<InitiatePaymentResult>;
  verify(providerRef: string): Promise<PaymentStatus>;
}
