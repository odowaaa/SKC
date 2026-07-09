import { Injectable } from '@nestjs/common';
import { PaymentGatewayProvider } from '@prisma/client';
import { StripeGateway } from './stripe.gateway';
import { PaypalGateway } from './paypal.gateway';
import { HormuudEvcGateway } from './hormuud-evc.gateway';
import { ZaadGateway } from './zaad.gateway';
import { SahalGateway } from './sahal.gateway';
import { PremierWalletGateway } from './premier-wallet.gateway';
import type { PaymentGateway } from './payment-gateway.interface';

@Injectable()
export class PaymentGatewayFactory {
  constructor(
    private readonly stripe: StripeGateway,
    private readonly paypal: PaypalGateway,
    private readonly hormuudEvc: HormuudEvcGateway,
    private readonly zaad: ZaadGateway,
    private readonly sahal: SahalGateway,
    private readonly premierWallet: PremierWalletGateway,
  ) {}

  get(provider: PaymentGatewayProvider): PaymentGateway {
    switch (provider) {
      case PaymentGatewayProvider.STRIPE:
        return this.stripe;
      case PaymentGatewayProvider.PAYPAL:
        return this.paypal;
      case PaymentGatewayProvider.HORMUUD_EVC:
        return this.hormuudEvc;
      case PaymentGatewayProvider.ZAAD:
        return this.zaad;
      case PaymentGatewayProvider.SAHAL:
        return this.sahal;
      case PaymentGatewayProvider.PREMIER_WALLET:
        return this.premierWallet;
      default:
        throw new Error(`Unsupported payment gateway: ${provider}`);
    }
  }
}
