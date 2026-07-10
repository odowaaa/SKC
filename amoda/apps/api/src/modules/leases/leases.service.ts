import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeaseStatus, MaintenanceStatus, Role } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateLeaseDto } from './dto/create-lease.dto';
import { CreateMaintenanceRequestDto } from './dto/maintenance-request.dto';

const STAFF_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.PROPERTY_MANAGER,
  Role.ACCOUNTANT,
];

const LEASE_INCLUDE = {
  property: { select: { id: true, title: true, slug: true, city: true } },
  tenant: {
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
        },
      },
    },
  },
  owner: {
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, email: true },
      },
    },
  },
} as const;

@Injectable()
export class LeasesService {
  constructor(private readonly prisma: PrismaService) {}

  private async resolveOwnerId(user: AuthenticatedUser, propertyId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) throw new NotFoundException('Property not found');

    if (user.role === Role.OWNER) {
      const owner = await this.prisma.owner.findUnique({
        where: { userId: user.id },
      });
      if (!owner)
        throw new BadRequestException(
          'No owner profile found for this account',
        );
      return owner.id;
    }

    if (STAFF_ROLES.includes(user.role)) {
      if (!property.ownerId)
        throw new BadRequestException('This property has no owner on record');
      return property.ownerId;
    }

    throw new ForbiddenException(
      'Only property owners or staff can create a lease',
    );
  }

  private async resolveTenantId(dto: CreateLeaseDto) {
    const user = await this.prisma.user.upsert({
      where: { email: dto.tenantEmail },
      update: {},
      create: {
        email: dto.tenantEmail,
        firstName: dto.tenantFirstName ?? 'Tenant',
        lastName: dto.tenantLastName ?? 'Account',
        role: Role.TENANT,
      },
    });

    const tenant = await this.prisma.tenant.upsert({
      where: { userId: user.id },
      update: {},
      create: { userId: user.id },
    });

    return tenant.id;
  }

  async create(user: AuthenticatedUser, dto: CreateLeaseDto) {
    const [ownerId, tenantId] = await Promise.all([
      this.resolveOwnerId(user, dto.propertyId),
      this.resolveTenantId(dto),
    ]);

    return this.prisma.lease.create({
      data: {
        propertyId: dto.propertyId,
        ownerId,
        tenantId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        rentAmount: dto.rentAmount,
        currency: dto.currency ?? 'USD',
        billingCycle: dto.billingCycle ?? 'MONTHLY',
        depositAmount: dto.depositAmount,
      },
      include: LEASE_INCLUDE,
    });
  }

  async list(user: AuthenticatedUser) {
    if (STAFF_ROLES.includes(user.role)) {
      return this.prisma.lease.findMany({
        orderBy: { createdAt: 'desc' },
        include: LEASE_INCLUDE,
      });
    }

    const [owner, tenant] = await Promise.all([
      this.prisma.owner.findUnique({ where: { userId: user.id } }),
      this.prisma.tenant.findUnique({ where: { userId: user.id } }),
    ]);

    return this.prisma.lease.findMany({
      where: {
        OR: [
          ...(owner ? [{ ownerId: owner.id }] : []),
          ...(tenant ? [{ tenantId: tenant.id }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: LEASE_INCLUDE,
    });
  }

  private async assertCanAccess(user: AuthenticatedUser, leaseId: string) {
    const lease = await this.prisma.lease.findUnique({
      where: { id: leaseId },
      include: { owner: true, tenant: true },
    });
    if (!lease) throw new NotFoundException('Lease not found');

    if (STAFF_ROLES.includes(user.role)) return lease;
    if (lease.owner.userId === user.id) return lease;
    if (lease.tenant.userId === user.id) return lease;

    throw new ForbiddenException(
      'You do not have permission to access this lease',
    );
  }

  async findOne(user: AuthenticatedUser, id: string) {
    await this.assertCanAccess(user, id);
    return this.prisma.lease.findUnique({
      where: { id },
      include: {
        ...LEASE_INCLUDE,
        invoices: { orderBy: { dueDate: 'desc' } },
        maintenanceRequests: { orderBy: { createdAt: 'desc' } },
      },
    });
  }

  async generateInvoice(
    user: AuthenticatedUser,
    leaseId: string,
    dueDate: string,
  ) {
    const lease = await this.assertCanAccess(user, leaseId);
    if (!STAFF_ROLES.includes(user.role) && lease.owner.userId !== user.id) {
      throw new ForbiddenException(
        'Only the owner or staff can generate a rent invoice',
      );
    }

    return this.prisma.invoice.create({
      data: {
        invoiceNumber: `INV-${nanoid(10).toUpperCase()}`,
        userId: lease.tenant.userId,
        leaseId: lease.id,
        amount: lease.rentAmount,
        currency: lease.currency,
        dueDate: new Date(dueDate),
        lineItems: {
          create: [
            {
              description: `Rent — ${lease.billingCycle.toLowerCase()}`,
              quantity: 1,
              unitPrice: lease.rentAmount,
            },
          ],
        },
      },
      include: { lineItems: true },
    });
  }

  async terminate(user: AuthenticatedUser, leaseId: string) {
    await this.assertCanAccess(user, leaseId);
    return this.prisma.lease.update({
      where: { id: leaseId },
      data: { status: LeaseStatus.TERMINATED },
    });
  }

  // --- Maintenance requests -------------------------------------------------

  async createMaintenanceRequest(
    user: AuthenticatedUser,
    leaseId: string,
    dto: CreateMaintenanceRequestDto,
  ) {
    const lease = await this.assertCanAccess(user, leaseId);
    if (lease.tenant.userId !== user.id && !STAFF_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        'Only the tenant on this lease can file a maintenance request',
      );
    }

    return this.prisma.maintenanceRequest.create({
      data: {
        leaseId,
        tenantId: lease.tenantId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
      },
    });
  }

  async listMaintenanceRequests(user: AuthenticatedUser, leaseId: string) {
    await this.assertCanAccess(user, leaseId);
    return this.prisma.maintenanceRequest.findMany({
      where: { leaseId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateMaintenanceStatus(
    user: AuthenticatedUser,
    requestId: string,
    status: MaintenanceStatus,
  ) {
    const request = await this.prisma.maintenanceRequest.findUnique({
      where: { id: requestId },
    });
    if (!request) throw new NotFoundException('Maintenance request not found');

    const lease = await this.assertCanAccess(user, request.leaseId);
    if (lease.owner.userId !== user.id && !STAFF_ROLES.includes(user.role)) {
      throw new ForbiddenException(
        'Only the owner or staff can update a maintenance request',
      );
    }

    return this.prisma.maintenanceRequest.update({
      where: { id: requestId },
      data: {
        status,
        resolvedAt:
          status === MaintenanceStatus.RESOLVED ? new Date() : undefined,
      },
    });
  }
}
