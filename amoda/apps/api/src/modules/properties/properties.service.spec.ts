import { Test } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { PropertyStatus, Role } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { PropertiesService } from './properties.service';

describe('PropertiesService', () => {
  let service: PropertiesService;
  const prismaMock = {
    property: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
    },
    agent: { findUnique: jest.fn() },
    owner: { findUnique: jest.fn() },
    propertyAmenity: { deleteMany: jest.fn() },
    propertyCategory: { deleteMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const moduleRef = await Test.createTestingModule({
      providers: [
        PropertiesService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(PropertiesService);
  });

  it('marks listings from staff roles as published immediately', async () => {
    prismaMock.property.create.mockResolvedValue({
      id: 'prop_1',
      status: PropertyStatus.PUBLISHED,
    });

    await service.create(
      { id: 'user_1', email: 'admin@amoda.app', role: Role.ADMIN },
      {
        title: 'Modern Villa',
        description: 'A beautiful villa with a garden and pool.',
        type: 'VILLA' as never,
        listingType: 'SALE' as never,
        price: 100000,
        country: 'Somalia',
        city: 'Mogadishu',
      },
    );

    expect(prismaMock.property.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ status: PropertyStatus.PUBLISHED }),
      }),
    );
  });

  it('marks listings from non-staff roles as pending review', async () => {
    prismaMock.property.create.mockResolvedValue({
      id: 'prop_2',
      status: PropertyStatus.PENDING_REVIEW,
    });
    prismaMock.agent.findUnique.mockResolvedValue({ id: 'agent_1' });

    await service.create(
      { id: 'user_2', email: 'agent@amoda.app', role: Role.AGENT },
      {
        title: 'Cozy Apartment',
        description: 'A cozy two bedroom apartment near downtown.',
        type: 'APARTMENT' as never,
        listingType: 'RENT' as never,
        price: 500,
        country: 'Somalia',
        city: 'Hargeisa',
      },
    );

    expect(prismaMock.property.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: PropertyStatus.PENDING_REVIEW,
        }),
      }),
    );
  });

  it('throws NotFoundException when a property does not exist', async () => {
    prismaMock.property.findFirst.mockResolvedValue(null);
    await expect(service.findById('missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
