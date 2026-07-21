import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { LeadStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user';
import { CreateLeadDto } from './dto/create-lead.dto';
import { CreateNoteDto, CreateTaskDto } from './dto/lead-activity.dto';

const STAFF_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.REGIONAL_MANAGER,
  Role.BRANCH_MANAGER,
  Role.MARKETING_MANAGER,
];

const DETAIL_INCLUDE = {
  property: { select: { id: true, title: true, slug: true } },
  assignee: {
    select: { id: true, firstName: true, lastName: true, email: true },
  },
  createdBy: {
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
    },
  },
  notes: {
    orderBy: { createdAt: 'desc' as const },
    include: { author: { select: { firstName: true, lastName: true } } },
  },
  tasks: { orderBy: { dueAt: 'asc' as const } },
} as const;

@Injectable()
export class LeadsService {
  constructor(private readonly prisma: PrismaService) {}

  async captureFromProperty(propertyId: string, dto: CreateLeadDto) {
    const property = await this.prisma.property.findFirst({
      where: { id: propertyId, deletedAt: null },
    });
    if (!property) throw new NotFoundException('Property not found');

    let createdById: string | undefined;
    if (dto.email) {
      const [firstName, ...rest] = dto.fullName.trim().split(/\s+/);
      const guest = await this.prisma.user.upsert({
        where: { email: dto.email },
        update: {},
        create: {
          email: dto.email,
          phone: dto.phone,
          firstName: firstName || 'Guest',
          lastName: rest.join(' ') || 'Lead',
          role: Role.GUEST,
        },
      });
      createdById = guest.id;
    }

    const lead = await this.prisma.lead.create({
      data: {
        propertyId,
        fullName: dto.fullName,
        email: dto.email,
        phone: dto.phone,
        source: dto.source,
        agentId: property.agentId,
        assigneeId: property.createdById,
        createdById,
      },
    });

    if (dto.message && createdById) {
      await this.prisma.crmNote.create({
        data: { leadId: lead.id, authorId: createdById, body: dto.message },
      });
    }

    return { received: true, leadId: lead.id };
  }

  async list(user: AuthenticatedUser) {
    if (STAFF_ROLES.includes(user.role)) {
      return this.prisma.lead.findMany({
        orderBy: { createdAt: 'desc' },
        include: DETAIL_INCLUDE,
      });
    }

    const agent = await this.prisma.agent.findUnique({
      where: { userId: user.id },
    });

    return this.prisma.lead.findMany({
      where: {
        OR: [
          { assigneeId: user.id },
          ...(agent ? [{ agentId: agent.id }] : []),
        ],
      },
      orderBy: { createdAt: 'desc' },
      include: DETAIL_INCLUDE,
    });
  }

  private async assertCanAccess(user: AuthenticatedUser, leadId: string) {
    const lead = await this.prisma.lead.findUnique({
      where: { id: leadId },
      include: { agent: true },
    });
    if (!lead) throw new NotFoundException('Lead not found');

    if (STAFF_ROLES.includes(user.role)) return lead;
    if (lead.assigneeId === user.id) return lead;
    if (lead.agent?.userId === user.id) return lead;

    throw new ForbiddenException(
      'You do not have permission to access this lead',
    );
  }

  async findOne(user: AuthenticatedUser, id: string) {
    await this.assertCanAccess(user, id);
    return this.prisma.lead.findUnique({
      where: { id },
      include: DETAIL_INCLUDE,
    });
  }

  async updateStatus(user: AuthenticatedUser, id: string, status: LeadStatus) {
    await this.assertCanAccess(user, id);
    return this.prisma.lead.update({ where: { id }, data: { status } });
  }

  async assign(user: AuthenticatedUser, id: string, assigneeId: string) {
    await this.assertCanAccess(user, id);
    return this.prisma.lead.update({
      where: { id },
      data: { assigneeId, status: LeadStatus.CONTACTED },
    });
  }

  async addNote(user: AuthenticatedUser, id: string, dto: CreateNoteDto) {
    await this.assertCanAccess(user, id);
    return this.prisma.crmNote.create({
      data: { leadId: id, authorId: user.id, body: dto.body },
    });
  }

  async addTask(user: AuthenticatedUser, id: string, dto: CreateTaskDto) {
    await this.assertCanAccess(user, id);
    return this.prisma.crmTask.create({
      data: {
        leadId: id,
        assigneeId: dto.assigneeId ?? user.id,
        title: dto.title,
        dueAt: dto.dueAt ? new Date(dto.dueAt) : undefined,
      },
    });
  }

  async completeTask(user: AuthenticatedUser, taskId: string) {
    const task = await this.prisma.crmTask.findUnique({
      where: { id: taskId },
    });
    if (!task) throw new NotFoundException('Task not found');
    await this.assertCanAccess(user, task.leadId);
    return this.prisma.crmTask.update({
      where: { id: taskId },
      data: { completedAt: new Date() },
    });
  }
}
