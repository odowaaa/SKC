import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';

@Injectable()
export class ReviewsService {
  constructor(private readonly prisma: PrismaService) {}

  async listForProperty(propertyId: string) {
    return this.prisma.review.findMany({
      where: { propertyId, isApproved: true },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, propertyId: string, dto: CreateReviewDto) {
    return this.prisma.review.upsert({
      where: { userId_propertyId: { userId, propertyId } },
      create: { userId, propertyId, rating: dto.rating, comment: dto.comment },
      update: { rating: dto.rating, comment: dto.comment, isApproved: false },
    });
  }

  async approve(id: string) {
    return this.prisma.review.update({
      where: { id },
      data: { isApproved: true },
    });
  }

  async remove(id: string) {
    return this.prisma.review.delete({ where: { id } });
  }
}
