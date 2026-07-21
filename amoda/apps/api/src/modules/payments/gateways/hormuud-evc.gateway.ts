import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PaymentGatewayProvider } from '@prisma/client';
import { WaafiPayGateway } from './waafipay.gateway';

@Injectable()
export class HormuudEvcGateway extends WaafiPayGateway {
  readonly provider = PaymentGatewayProvider.HORMUUD_EVC;
  protected readonly logger = new Logger(HormuudEvcGateway.name);

  constructor(config: ConfigService) {
    super(config, {
      merchantUid: config.get<string>('waafiPay.hormuudEvc.merchantUid'),
      apiUserId: config.get<string>('waafiPay.hormuudEvc.apiUserId'),
      apiKey: config.get<string>('waafiPay.hormuudEvc.apiKey'),
    });
  }
}
