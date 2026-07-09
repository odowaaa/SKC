import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayProvider } from '@prisma/client';
import { WaafiPayGateway } from './waafipay.gateway';

@Injectable()
export class SahalGateway extends WaafiPayGateway {
  readonly provider = PaymentGatewayProvider.SAHAL;
  protected readonly logger = new Logger(SahalGateway.name);

  constructor(config: ConfigService) {
    super(config, {
      merchantUid: config.get<string>('waafiPay.sahal.merchantUid'),
      apiUserId: config.get<string>('waafiPay.sahal.apiUserId'),
      apiKey: config.get<string>('waafiPay.sahal.apiKey'),
    });
  }
}
