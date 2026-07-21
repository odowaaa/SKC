import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayProvider } from '@prisma/client';
import { WaafiPayGateway } from './waafipay.gateway';

@Injectable()
export class PremierWalletGateway extends WaafiPayGateway {
  readonly provider = PaymentGatewayProvider.PREMIER_WALLET;
  protected readonly logger = new Logger(PremierWalletGateway.name);

  constructor(config: ConfigService) {
    super(config, {
      merchantUid: config.get<string>('waafiPay.premierWallet.merchantUid'),
      apiUserId: config.get<string>('waafiPay.premierWallet.apiUserId'),
      apiKey: config.get<string>('waafiPay.premierWallet.apiKey'),
    });
  }
}
