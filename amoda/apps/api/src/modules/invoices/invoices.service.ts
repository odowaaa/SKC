import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';

const STAFF_ROLES: Role[] = [Role.SUPER_ADMIN, Role.ADMIN, Role.ACCOUNTANT];

@Injectable()
export class InvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async listMine(userId: string) {
    return this.prisma.invoice.findMany({
      where: { userId },
      include: { lineItems: true, payments: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(user: AuthenticatedUser, id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: { lineItems: true, payments: true, lease: true },
    });
    if (!invoice) throw new NotFoundException('Invoice not found');
    if (invoice.userId !== user.id && !STAFF_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        'You do not have permission to view this invoice',
      );
    }
    return invoice;
  }

  async create(params: {
    userId: string;
    leaseId?: string;
    dueDate: Date;
    lineItems: { description: string; quantity: number; unitPrice: number }[];
    taxAmount?: number;
  }) {
    const amount = params.lineItems.reduce(
      (sum, item) => sum + item.quantity * item.unitPrice,
      0,
    );

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${nanoid(10).toUpperCase()}`,
        userId: params.userId,
        leaseId: params.leaseId,
        amount,
        taxAmount: params.taxAmount ?? 0,
        dueDate: params.dueDate,
        lineItems: { create: params.lineItems },
      },
      include: { lineItems: true },
    });
  }
}
