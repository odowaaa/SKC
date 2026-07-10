import { ApiProperty } from '@nestjs/swagger';
import { LeadStatus } from '@prisma/client';
import { IsEnum, IsString } from 'class-validator';

export class UpdateLeadStatusDto {
  @ApiProperty({ enum: LeadStatus })
  @IsEnum(LeadStatus)
  status: LeadStatus;
}

export class AssignLeadDto {
  @ApiProperty()
  @IsString()
  assigneeId: string;
}
