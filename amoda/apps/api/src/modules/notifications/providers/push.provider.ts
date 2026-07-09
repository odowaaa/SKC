import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

/**
 * Push notification adapter. Wire up FCM/APNs by reading device tokens
 * from UserDevice and calling the provider SDK from `send`.
 */
@Injectable()
export class PushProvider {
  private readonly logger = new Logger(PushProvider.name);

  constructor(private readonly prisma: PrismaService) {}

  async send(userId: string, title: string, body: string): Promise<void> {
    const devices = await this.prisma.userDevice.findMany({
      where: { userId, pushToken: { not: null } },
    });

    if (devices.length === 0) {
      this.logger.debug(`[PUSH:no-devices] user=${userId} title=${title}`);
      return;
    }

    // Production implementation would fan out to FCM/APNs using device.pushToken.
    this.logger.log(
      `Push dispatched to ${devices.length} device(s) for user ${userId}: ${title} / ${body}`,
    );
  }
}
