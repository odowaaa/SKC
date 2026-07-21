import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateSavedSearchDto } from './dto/create-saved-search.dto';

@Injectable()
export class SavedSearchesService {
  constructor(private readonly prisma: PrismaService) {}

  list(userId: string) {
    return this.prisma.savedSearch.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  create(userId: string, dto: CreateSavedSearchDto) {
    return this.prisma.savedSearch.create({
      data: {
        userId,
        name: dto.name,
        filters: dto.filters as never,
        alertsOn: dto.alertsOn ?? true,
      },
    });
  }

  async remove(userId: string, id: string) {
    const search = await this.prisma.savedSearch.findUnique({ where: { id } });
    if (!search) throw new NotFoundException('Saved search not found');
    if (search.userId !== userId)
      throw new ForbiddenException('You do not own this saved search');

    await this.prisma.savedSearch.delete({ where: { id } });
    return { deleted: true };
  }
}
