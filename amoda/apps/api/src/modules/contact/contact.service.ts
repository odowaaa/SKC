import { Injectable } from '@nestjs/common';
import { Role } from '@prisma/client';
import { nanoid } from 'nanoid';
import { PrismaService } from '../../prisma/prisma.service';
import { MailService } from '../notifications/mail.service';
import { CreateContactMessageDto } from './dto/create-contact-message.dto';

@Injectable()
export class ContactService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async submit(dto: CreateContactMessageDto) {
    const [firstName, ...rest] = dto.name.trim().split(/\s+/);

    const requester = await this.prisma.user.upsert({
      where: { email: dto.email },
      update: {},
      create: {
        email: dto.email,
        firstName: firstName || 'Guest',
        lastName: rest.join(' ') || 'Contact',
        role: Role.GUEST,
        isEmailVerified: false,
      },
    });

    const ticket = await this.prisma.supportTicket.create({
      data: {
        ticketNumber: `TCK-${nanoid(10).toUpperCase()}`,
        requesterId: requester.id,
        subject: dto.subject,
        description: dto.message,
      },
    });

    await this.mail.sendGenericNotification(
      dto.email,
      "We've received your message — AMODA Support",
      `Thanks for reaching out, ${firstName}. Our team will respond to "${dto.subject}" shortly. Reference: ${ticket.ticketNumber}.`,
    );

    return { received: true, ticketNumber: ticket.ticketNumber };
  }
}
