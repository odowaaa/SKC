import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, PropertyStatus, Role } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreatePropertyDto } from './dto/create-property.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { SearchPropertyDto } from './dto/search-property.dto';

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
}

const STAFF_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.REGIONAL_MANAGER,
  Role.BRANCH_MANAGER,
  Role.PROPERTY_MANAGER,
  Role.MODERATOR,
];

@Injectable()
export class PropertiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthenticatedUser, dto: CreatePropertyDto) {
    const { amenityIds, categoryIds, ...data } = dto;
    const slugBase = slugify(dto.title);
    const referenceCode = `AMD-${nanoid(8).toUpperCase()}`;

    const property = await this.prisma.property.create({
      data: {
        ...data,
        slug: `${slugBase}-${nanoid(6)}`,
        referenceCode,
        createdById: user.id,
        agentId:
          user.role === Role.AGENT ? await this.agentIdFor(user.id) : undefined,
        ownerId:
          user.role === Role.OWNER ? await this.ownerIdFor(user.id) : undefined,
        status: STAFF_ROLES.includes(user.role)
          ? PropertyStatus.PUBLISHED
          : PropertyStatus.PENDING_REVIEW,
        publishedAt: STAFF_ROLES.includes(user.role) ? new Date() : null,
        amenities: amenityIds
          ? { create: amenityIds.map((amenityId) => ({ amenityId })) }
          : undefined,
        categories: categoryIds
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: this.detailInclude(),
    });

    return property;
  }

  private async agentIdFor(userId: string) {
    const agent = await this.prisma.agent.findUnique({ where: { userId } });
    return agent?.id;
  }

  private async ownerIdFor(userId: string) {
    const owner = await this.prisma.owner.findUnique({ where: { userId } });
    return owner?.id;
  }

  private detailInclude() {
    return {
      media: { orderBy: { sortOrder: Prisma.SortOrder.asc } },
      amenities: { include: { amenity: true } },
      categories: { include: { category: true } },
      nearbyPlaces: true,
      seo: true,
      agent: {
        include: {
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
        },
      },
      owner: {
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
      },
      _count: { select: { favorites: true, reviews: true, bookings: true } },
    } satisfies Prisma.PropertyInclude;
  }

  async search(query: SearchPropertyDto) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      status: PropertyStatus.PUBLISHED,
    };

    if (query.q) {
      where.OR = [
        { title: { contains: query.q, mode: 'insensitive' } },
        { description: { contains: query.q, mode: 'insensitive' } },
        { referenceCode: { contains: query.q, mode: 'insensitive' } },
      ];
    }
    if (query.country)
      where.country = { equals: query.country, mode: 'insensitive' };
    if (query.city) where.city = { equals: query.city, mode: 'insensitive' };
    if (query.district)
      where.district = { equals: query.district, mode: 'insensitive' };
    if (query.neighborhood)
      where.neighborhood = { equals: query.neighborhood, mode: 'insensitive' };
    if (query.type) where.type = query.type;
    if (query.listingType) where.listingType = query.listingType;
    if (query.furnishing) where.furnishing = query.furnishing;
    if (query.featured !== undefined) where.isFeatured = query.featured;
    if (query.luxury !== undefined) where.isLuxury = query.luxury;

    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      where.price = {
        ...(query.minPrice !== undefined ? { gte: query.minPrice } : {}),
        ...(query.maxPrice !== undefined ? { lte: query.maxPrice } : {}),
      };
    }
    if (query.minBedrooms !== undefined)
      where.bedrooms = { gte: query.minBedrooms };
    if (query.minBathrooms !== undefined)
      where.bathrooms = { gte: query.minBathrooms };
    if (query.minArea !== undefined || query.maxArea !== undefined) {
      where.areaSqm = {
        ...(query.minArea !== undefined ? { gte: query.minArea } : {}),
        ...(query.maxArea !== undefined ? { lte: query.maxArea } : {}),
      };
    }

    if (query.parking) where.parkingSpaces = { gt: 0 };
    if (query.swimmingPool) where.hasSwimmingPool = true;
    if (query.garden) where.hasGarden = true;
    if (query.petsAllowed) where.petsAllowed = true;
    if (query.airConditioning) where.hasAirConditioning = true;
    if (query.gym) where.hasGym = true;
    if (query.security) where.hasSecurity = true;

    if (
      query.north !== undefined &&
      query.south !== undefined &&
      query.east !== undefined &&
      query.west !== undefined
    ) {
      where.latitude = { gte: query.south, lte: query.north };
      where.longitude = { gte: query.west, lte: query.east };
    }

    const orderBy: Prisma.PropertyOrderByWithRelationInput = (() => {
      switch (query.sortBy) {
        case 'price_asc':
          return { price: 'asc' };
        case 'price_desc':
          return { price: 'desc' };
        case 'area_asc':
          return { areaSqm: 'asc' };
        case 'area_desc':
          return { areaSqm: 'desc' };
        default:
          return { publishedAt: 'desc' };
      }
    })();

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          media: { take: 1, orderBy: { sortOrder: 'asc' } },
          _count: { select: { favorites: true, reviews: true } },
        },
      }),
      this.prisma.property.count({ where }),
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

  async listMine(user: AuthenticatedUser) {
    const where: Prisma.PropertyWhereInput = { deletedAt: null };

    if (!STAFF_ROLES.includes(user.role)) {
      const [agent, owner] = await Promise.all([
        this.prisma.agent.findUnique({ where: { userId: user.id } }),
        this.prisma.owner.findUnique({ where: { userId: user.id } }),
      ]);
      where.OR = [
        { createdById: user.id },
        ...(agent ? [{ agentId: agent.id }] : []),
        ...(owner ? [{ ownerId: owner.id }] : []),
      ];
    }

    return this.prisma.property.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        media: { take: 1, orderBy: { sortOrder: 'asc' } },
        _count: { select: { bookings: true, favorites: true } },
      },
    });
  }

  async listAll(params: {
    page: number;
    limit: number;
    status?: PropertyStatus;
  }) {
    const { page, limit, status } = params;
    const where: Prisma.PropertyWhereInput = {
      deletedAt: null,
      ...(status ? { status } : {}),
    };

    const [data, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: { media: { take: 1, orderBy: { sortOrder: 'asc' } } },
      }),
      this.prisma.property.count({ where }),
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
    const property = await this.prisma.property.findFirst({
      where: { slug, deletedAt: null },
      include: this.detailInclude(),
    });
    if (!property) throw new NotFoundException('Property not found');

    await this.prisma.property.update({
      where: { id: property.id },
      data: { viewsCount: { increment: 1 } },
    });

    return property;
  }

  async findById(id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: this.detailInclude(),
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  async similar(id: string, limit = 6) {
    const property = await this.findById(id);
    return this.prisma.property.findMany({
      where: {
        id: { not: id },
        deletedAt: null,
        status: PropertyStatus.PUBLISHED,
        type: property.type,
        city: property.city,
      },
      take: limit,
      include: { media: { take: 1, orderBy: { sortOrder: 'asc' } } },
    });
  }

  private async assertCanModify(user: AuthenticatedUser, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) throw new NotFoundException('Property not found');

    if (STAFF_ROLES.includes(user.role)) return property;
    if (property.createdById === user.id) return property;

    throw new ForbiddenException(
      'You do not have permission to modify this property',
    );
  }

  async update(user: AuthenticatedUser, id: string, dto: UpdatePropertyDto) {
    await this.assertCanModify(user, id);
    const { amenityIds, categoryIds, status, ...data } = dto;

    // Only staff may move a listing between moderation states directly;
    // non-staff edits to a published listing send it back for re-review.
    const isStaff = STAFF_ROLES.includes(user.role);
    const resolvedStatus = isStaff ? status : PropertyStatus.PENDING_REVIEW;

    if (amenityIds) {
      await this.prisma.propertyAmenity.deleteMany({
        where: { propertyId: id },
      });
    }
    if (categoryIds) {
      await this.prisma.propertyCategory.deleteMany({
        where: { propertyId: id },
      });
    }

    return this.prisma.property.update({
      where: { id },
      data: {
        ...data,
        status: resolvedStatus,
        publishedAt:
          resolvedStatus === PropertyStatus.PUBLISHED ? new Date() : undefined,
        amenities: amenityIds
          ? { create: amenityIds.map((amenityId) => ({ amenityId })) }
          : undefined,
        categories: categoryIds
          ? { create: categoryIds.map((categoryId) => ({ categoryId })) }
          : undefined,
      },
      include: this.detailInclude(),
    });
  }

  async remove(user: AuthenticatedUser, id: string) {
    await this.assertCanModify(user, id);
    await this.prisma.property.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
    return { deleted: true };
  }

  async setFeatured(id: string, isFeatured: boolean) {
    await this.findById(id);
    return this.prisma.property.update({ where: { id }, data: { isFeatured } });
  }

  async attachMedia(
    user: AuthenticatedUser,
    propertyId: string,
    media: {
      url: string;
      kind: Prisma.PropertyMediaCreateManyInput['kind'];
      thumbnailUrl?: string;
      caption?: string;
    }[],
  ) {
    await this.assertCanModify(user, propertyId);
    await this.prisma.propertyMedia.createMany({
      data: media.map((item, index) => ({
        propertyId,
        ...item,
        sortOrder: index,
      })),
    });
    return this.findById(propertyId);
  }
}
