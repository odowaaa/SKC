import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class FavoritesService {
  constructor(private readonly prisma: PrismaService) {}

  async list(userId: string) {
    return this.prisma.favorite.findMany({
      where: { userId },
      include: {
        property: {
          include: { media: { take: 1, orderBy: { sortOrder: 'asc' } } },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async add(userId: string, propertyId: string) {
    return this.prisma.favorite.upsert({
      where: { userId_propertyId: { userId, propertyId } },
      create: { userId, propertyId },
      update: {},
    });
  }

  async remove(userId: string, propertyId: string) {
    await this.prisma.favorite.deleteMany({ where: { userId, propertyId } });
    return { removed: true };
  }
}
