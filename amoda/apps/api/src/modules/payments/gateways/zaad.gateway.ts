import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayProvider } from '@prisma/client';
import { WaafiPayGateway } from './waafipay.gateway';

@Injectable()
export class ZaadGateway extends WaafiPayGateway {
  readonly provider = PaymentGatewayProvider.ZAAD;
  protected readonly logger = new Logger(ZaadGateway.name);

  constructor(config: ConfigService) {
    super(config, {
      merchantUid: config.get<string>('waafiPay.zaad.merchantUid'),
      apiUserId: config.get<string>('waafiPay.zaad.apiUserId'),
      apiKey: config.get<string>('waafiPay.zaad.apiKey'),
    });
  }
}
