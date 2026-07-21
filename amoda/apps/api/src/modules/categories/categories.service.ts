import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.category.findMany({
      where: { parentId: null },
      include: { children: true },
      orderBy: { name: 'asc' },
    });
  }

  create(name: string, parentId?: string) {
    return this.prisma.category.create({
      data: { name, slug: slugify(name), parentId },
    });
  }

  remove(id: string) {
    return this.prisma.category.delete({ where: { id } });
  }
}
