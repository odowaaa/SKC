import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { OfferStatus, PropertyStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateOfferDto } from './dto/create-offer.dto';

const STAFF_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.BRANCH_MANAGER,
  Role.ACCOUNTANT,
];

const OFFER_INCLUDE = {
  property: {
    select: { id: true, title: true, slug: true, price: true, currency: true },
  },
  agent: {
    include: {
      user: { select: { firstName: true, lastName: true, email: true } },
    },
  },
} as const;

@Injectable()
export class OffersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(propertyId: string, dto: CreateOfferDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) throw new NotFoundException('Property not found');

    return this.prisma.offer.create({
      data: {
        propertyId,
        agentId: property.agentId,
        buyerName: dto.buyerName,
        buyerEmail: dto.buyerEmail,
        buyerPhone: dto.buyerPhone,
        amount: dto.amount,
        currency: dto.currency ?? property.currency,
        note: dto.note,
      },
      include: OFFER_INCLUDE,
    });
  }

  async list(user: AuthenticatedUser) {
    if (STAFF_ROLES.includes(user.role)) {
      return this.prisma.offer.findMany({
        orderBy: { createdAt: 'desc' },
        include: OFFER_INCLUDE,
      });
    }

    const agent = await this.prisma.agent.findUnique({
      where: { userId: user.id },
    });
    if (!agent) return [];

    return this.prisma.offer.findMany({
      where: { agentId: agent.id },
      orderBy: { createdAt: 'desc' },
      include: OFFER_INCLUDE,
    });
  }

  private async assertCanManage(user: AuthenticatedUser, offerId: string) {
    const offer = await this.prisma.offer.findUnique({
      where: { id: offerId },
      include: { agent: true },
    });
    if (!offer) throw new NotFoundException('Offer not found');

    if (STAFF_ROLES.includes(user.role)) return offer;
    if (offer.agent?.userId === user.id) return offer;

    throw new ForbiddenException(
      'You do not have permission to manage this offer',
    );
  }

  async updateStatus(user: AuthenticatedUser, id: string, status: OfferStatus) {
    const offer = await this.assertCanManage(user, id);

    const updated = await this.prisma.offer.update({
      where: { id },
      data: { status },
      include: OFFER_INCLUDE,
    });

    if (status === OfferStatus.ACCEPTED) {
      await this.prisma.property.update({
        where: { id: offer.propertyId },
        data: { status: PropertyStatus.UNDER_OFFER },
      });

      if (offer.agentId) {
        const agent = await this.prisma.agent.findUnique({
          where: { id: offer.agentId },
        });
        if (agent && Number(agent.commissionRate) > 0) {
          await this.prisma.commission.create({
            data: {
              agentId: agent.id,
              offerId: offer.id,
              amount:
                (Number(offer.amount) * Number(agent.commissionRate)) / 100,
              currency: offer.currency,
            },
          });
        }
      }
    }

    return updated;
  }
}
