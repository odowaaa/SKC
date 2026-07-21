import { Injectable, NotFoundException } from '@nestjs/common';
import { Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const SAFE_FIELDS = {
  id: true,
  email: true,
  phone: true,
  firstName: true,
  lastName: true,
  avatarUrl: true,
  role: true,
  provider: true,
  isEmailVerified: true,
  isPhoneVerified: true,
  isActive: true,
  isSuspended: true,
  locale: true,
  currency: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: SAFE_FIELDS,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async updateProfile(id: string, dto: UpdateProfileDto) {
    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: SAFE_FIELDS,
    });
  }

  async list(params: { page: number; limit: number; role?: Role }) {
    const { page, limit, role } = params;
    const where = role ? { role } : {};
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: SAFE_FIELDS,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
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

  async updateRole(id: string, role: Role) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: SAFE_FIELDS,
    });
  }

  async setSuspended(id: string, isSuspended: boolean) {
    await this.findById(id);
    return this.prisma.user.update({
      where: { id },
      data: { isSuspended },
      select: SAFE_FIELDS,
    });
  }
}
