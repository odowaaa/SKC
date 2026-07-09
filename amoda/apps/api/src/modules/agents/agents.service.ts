import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

const PUBLIC_SELECT = {
  id: true,
  agencyName: true,
  bio: true,
  yearsExperience: true,
  specialties: true,
  serviceAreas: true,
  rating: true,
  isVerified: true,
  user: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      phone: true,
      email: true,
    },
  },
  _count: { select: { properties: true } },
} as const;

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  findAll() {
    return this.prisma.agent.findMany({
      where: { isVerified: true },
      select: PUBLIC_SELECT,
      orderBy: { rating: 'desc' },
    });
  }

  async findOne(id: string) {
    const agent = await this.prisma.agent.findUnique({
      where: { id },
      select: PUBLIC_SELECT,
    });
    if (!agent) throw new NotFoundException('Agent not found');
    return agent;
  }
}
