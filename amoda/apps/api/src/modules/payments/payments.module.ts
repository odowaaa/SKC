import { Module } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { PaymentGatewayFactory } from './gateways/payment-gateway.factory';
import { StripeGateway } from './gateways/stripe.gateway';
import { PaypalGateway } from './gateways/paypal.gateway';
import { HormuudEvcGateway } from './gateways/hormuud-evc.gateway';
import { ZaadGateway } from './gateways/zaad.gateway';
import { SahalGateway } from './gateways/sahal.gateway';
import { PremierWalletGateway } from './gateways/premier-wallet.gateway';

@Module({
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    PaymentGatewayFactory,
    StripeGateway,
    PaypalGateway,
    HormuudEvcGateway,
    ZaadGateway,
    SahalGateway,
    PremierWalletGateway,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
