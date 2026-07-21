import { Injectable, Logger } from '@nestjs/common';
import { NotificationChannel, NotificationStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from './mail.service';
import { SmsProvider } from './providers/sms.provider';
import { PushProvider } from './providers/push.provider';
import { WhatsappProvider } from './providers/whatsapp.provider';

interface NotifyParams {
  userId: string;
  title: string;
  body: string;
  channel?: NotificationChannel;
  data?: Record<string, unknown>;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
    private readonly sms: SmsProvider,
    private readonly push: PushProvider,
    private readonly whatsapp: WhatsappProvider,
  ) {}

  async notify(params: NotifyParams) {
    const channel = params.channel ?? NotificationChannel.IN_APP;

    const notification = await this.prisma.notification.create({
      data: {
        userId: params.userId,
        channel,
        title: params.title,
        body: params.body,
        data: params.data as never,
        status: NotificationStatus.PENDING,
      },
    });

    try {
      const user = await this.prisma.user.findUnique({
        where: { id: params.userId },
      });
      if (user) {
        switch (channel) {
          case NotificationChannel.EMAIL:
            await this.mail.sendGenericNotification(
              user.email,
              params.title,
              params.body,
            );
            break;
          case NotificationChannel.SMS:
            if (user.phone) await this.sms.send(user.phone, params.body);
            break;
          case NotificationChannel.PUSH:
            await this.push.send(user.id, params.title, params.body);
            break;
          case NotificationChannel.WHATSAPP:
            if (user.phone) await this.whatsapp.send(user.phone, params.body);
            break;
          default:
            break;
        }
      }
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.SENT, sentAt: new Date() },
      });
    } catch (error) {
      this.logger.error(
        `Failed to dispatch notification ${notification.id}: ${(error as Error).message}`,
      );
      await this.prisma.notification.update({
        where: { id: notification.id },
        data: { status: NotificationStatus.FAILED },
      });
    }

    return notification;
  }

  async listForUser(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async markRead(userId: string, id: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { readAt: new Date(), status: NotificationStatus.READ },
    });
  }
}
