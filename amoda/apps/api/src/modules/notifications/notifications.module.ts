import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SmsProvider } from './providers/sms.provider';
import { PushProvider } from './providers/push.provider';
import { WhatsappProvider } from './providers/whatsapp.provider';

@Module({
  controllers: [NotificationsController],
  providers: [
    MailService,
    NotificationsService,
    SmsProvider,
    PushProvider,
    WhatsappProvider,
  ],
  exports: [MailService, NotificationsService],
})
export class NotificationsModule {}
