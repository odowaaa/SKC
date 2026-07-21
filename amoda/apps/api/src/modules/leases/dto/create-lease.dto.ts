import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsEmail,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateLeaseDto {
  @ApiProperty()
  @IsString()
  propertyId: string;

  @ApiProperty({
    description:
      'Email of the tenant. A tenant account is created if one does not exist.',
  })
  @IsEmail()
  tenantEmail: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantFirstName?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tenantLastName?: string;

  @ApiProperty()
  @IsDateString()
  startDate: string;

  @ApiProperty()
  @IsDateString()
  endDate: string;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  rentAmount: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional({ default: 'MONTHLY' })
  @IsOptional()
  @IsString()
  billingCycle?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  depositAmount?: number;
}
