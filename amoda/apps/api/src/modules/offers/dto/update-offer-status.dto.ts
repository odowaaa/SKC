import { ApiProperty } from '@nestjs/swagger';
import { OfferStatus } from '@prisma/client';
import { IsEnum } from 'class-validator';

export class UpdateOfferStatusDto {
  @ApiProperty({ enum: OfferStatus })
  @IsEnum(OfferStatus)
  status: OfferStatus;
}
