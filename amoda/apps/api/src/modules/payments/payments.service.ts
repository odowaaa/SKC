import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PaymentGatewayFactory } from './gateways/payment-gateway.factory';
import { CreatePaymentDto } from './dto/create-payment.dto';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateways: PaymentGatewayFactory,
  ) {}

  async initiate(user: AuthenticatedUser, dto: CreatePaymentDto) {
    const gateway = this.gateways.get(dto.provider);
    const currency = dto.currency ?? 'USD';

    const payment = await this.prisma.payment.create({
      data: {
        userId: user.id,
        invoiceId: dto.invoiceId,
        provider: dto.provider,
        amount: dto.amount,
        currency,
        status: PaymentStatus.PENDING,
      },
    });

    try {
      const result = await gateway.initiate({
        amount: dto.amount,
        currency,
        reference: payment.id,
        description: dto.description,
        customerEmail: user.email,
        customerPhone: dto.customerPhone,
        returnUrl: dto.returnUrl,
      });

      const updated = await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          providerRef: result.providerRef,
          status: result.status,
          metadata: result.raw as never,
        },
      });

      if (result.status === PaymentStatus.SUCCEEDED && dto.invoiceId) {
        await this.markInvoicePaid(dto.invoiceId);
      }

      return { payment: updated, redirectUrl: result.redirectUrl };
    } catch (error) {
      await this.prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: PaymentStatus.FAILED,
          failureReason: (error as Error).message,
        },
      });
      throw error;
    }
  }

  async markInvoicePaid(invoiceId: string) {
    await this.prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'PAID', paidAt: new Date() },
    });
  }

  async listMine(userId: string) {
    return this.prisma.payment.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateStatusByProviderRef(providerRef: string, status: PaymentStatus) {
    const payment = await this.prisma.payment.findFirst({
      where: { providerRef },
    });
    if (!payment) return null;

    const updated = await this.prisma.payment.update({
      where: { id: payment.id },
      data: { status },
    });

    if (status === PaymentStatus.SUCCEEDED && updated.invoiceId) {
      await this.markInvoicePaid(updated.invoiceId);
    }

    return updated;
  }
}
