import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const MAX_COMPARE_ITEMS = 4;

@Injectable()
export class CompareService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.compareItem.findMany({
      where: { userId },
      include: {
        property: {
          include: {
            media: { take: 1, orderBy: { sortOrder: 'asc' } },
            amenities: { include: { amenity: true } },
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async add(userId: string, propertyId: string) {
    const count = await this.prisma.compareItem.count({ where: { userId } });
    const existing = await this.prisma.compareItem.findUnique({
      where: { userId_propertyId: { userId, propertyId } },
    });

    if (!existing && count >= MAX_COMPARE_ITEMS) {
      throw new BadRequestException(
        `You can compare up to ${MAX_COMPARE_ITEMS} properties at a time`,
      );
    }

    return this.prisma.compareItem.upsert({
      where: { userId_propertyId: { userId, propertyId } },
      create: { userId, propertyId },
      update: {},
    });
  }

  async remove(userId: string, propertyId: string) {
    await this.prisma.compareItem.deleteMany({ where: { userId, propertyId } });
    return { removed: true };
  }

  async clear(userId: string) {
    await this.prisma.compareItem.deleteMany({ where: { userId } });
    return { cleared: true };
  }
}
