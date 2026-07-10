import { Injectable, NotFoundException } from '@nestjs/common';
import { BlogPostStatus } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

@Injectable()
export class BlogService {
  constructor(private readonly prisma: PrismaService) {}

  async listPublished(page = 1, limit = 10) {
    const where = { status: BlogPostStatus.PUBLISHED };
    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blogPost.count({ where }),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async listAll(page = 1, limit = 20) {
    const [data, total] = await Promise.all([
      this.prisma.blogPost.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.blogPost.count(),
    ]);
    return {
      data,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findBySlug(slug: string) {
    const post = await this.prisma.blogPost.findFirst({
      where: { slug, status: BlogPostStatus.PUBLISHED },
      include: {
        author: {
          select: { firstName: true, lastName: true, avatarUrl: true },
        },
        seo: true,
      },
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async create(authorId: string, dto: CreatePostDto) {
    return this.prisma.blogPost.create({
      data: {
        ...dto,
        authorId,
        slug: `${slugify(dto.title)}-${nanoid(6)}`,
      },
    });
  }

  async publish(id: string) {
    return this.prisma.blogPost.update({
      where: { id },
      data: { status: BlogPostStatus.PUBLISHED, publishedAt: new Date() },
    });
  }

  async remove(id: string) {
    return this.prisma.blogPost.delete({ where: { id } });
  }
}
