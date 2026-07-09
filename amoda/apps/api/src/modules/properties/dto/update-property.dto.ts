import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { PropertyStatus } from '@prisma/client';
import { IsEnum, IsOptional } from 'class-validator';
import { CreatePropertyDto } from './create-property.dto';

export class UpdatePropertyDto extends PartialType(CreatePropertyDto) {
  @ApiPropertyOptional({ enum: PropertyStatus })
  @IsOptional()
  @IsEnum(PropertyStatus)
  status?: PropertyStatus;
}
