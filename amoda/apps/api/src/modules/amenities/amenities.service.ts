import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AmenitiesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.amenity.findMany({ orderBy: { name: 'asc' } });
  }

  create(name: string, icon?: string) {
    return this.prisma.amenity.create({ data: { name, icon } });
  }

  remove(id: string) {
    return this.prisma.amenity.delete({ where: { id } });
  }
}
