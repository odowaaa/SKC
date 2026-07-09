import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentGatewayProvider } from '@prisma/client';
import { Type } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreatePaymentDto {
  @ApiProperty({ enum: PaymentGatewayProvider })
  @IsEnum(PaymentGatewayProvider)
  provider: PaymentGatewayProvider;

  @ApiProperty()
  @Type(() => Number)
  @IsNumber()
  @IsPositive()
  amount: number;

  @ApiPropertyOptional({ default: 'USD' })
  @IsOptional()
  @IsString()
  currency?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  invoiceId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description:
      'Required for mobile-money gateways (EVC/Zaad/Sahal/Premier Wallet)',
  })
  @IsOptional()
  @IsString()
  customerPhone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsUrl()
  returnUrl?: string;
}
