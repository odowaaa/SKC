import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { BookingStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../notifications/mail.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import {
  CreateBookingDto,
  RescheduleBookingDto,
} from './dto/create-booking.dto';

const STAFF_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.BRANCH_MANAGER,
  Role.PROPERTY_MANAGER,
];

@Injectable()
export class BookingsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async create(
    user: AuthenticatedUser,
    propertyId: string,
    dto: CreateBookingDto,
  ) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) throw new NotFoundException('Property not found');

    const booking = await this.prisma.booking.create({
      data: {
        propertyId,
        customerId: user.id,
        agentId: property.agentId,
        scheduledAt: new Date(dto.scheduledAt),
        note: dto.note,
      },
      include: { property: true, customer: true },
    });

    await this.mail.sendBookingConfirmation(
      booking.customer.email,
      booking.property.title,
      booking.scheduledAt,
    );

    return booking;
  }

  async listMine(userId: string) {
    return this.prisma.booking.findMany({
      where: { customerId: userId },
      include: { property: { include: { media: { take: 1 } } } },
      orderBy: { scheduledAt: 'desc' },
    });
  }

  async listForAgent(agentId: string) {
    return this.prisma.booking.findMany({
      where: { agentId },
      include: {
        property: true,
        customer: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  private async assertCanManage(user: AuthenticatedUser, bookingId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: { agent: true },
    });
    if (!booking) throw new NotFoundException('Booking not found');

    const isOwnerCustomer = booking.customerId === user.id;
    const isAssignedAgent = booking.agent?.userId === user.id;
    const isStaff = STAFF_ROLES.includes(user.role);

    if (!isOwnerCustomer && !isAssignedAgent && !isStaff) {
      throw new ForbiddenException(
        'You do not have permission to manage this booking',
      );
    }
    return booking;
  }

  async confirm(user: AuthenticatedUser, id: string) {
    await this.assertCanManage(user, id);
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CONFIRMED },
    });
  }

  async cancel(user: AuthenticatedUser, id: string, reason?: string) {
    await this.assertCanManage(user, id);
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.CANCELLED, cancelReason: reason },
    });
  }

  async reschedule(
    user: AuthenticatedUser,
    id: string,
    dto: RescheduleBookingDto,
  ) {
    await this.assertCanManage(user, id);
    return this.prisma.booking.update({
      where: { id },
      data: {
        status: BookingStatus.RESCHEDULED,
        scheduledAt: new Date(dto.scheduledAt),
      },
    });
  }

  async complete(user: AuthenticatedUser, id: string) {
    await this.assertCanManage(user, id);
    return this.prisma.booking.update({
      where: { id },
      data: { status: BookingStatus.COMPLETED },
    });
  }
}
