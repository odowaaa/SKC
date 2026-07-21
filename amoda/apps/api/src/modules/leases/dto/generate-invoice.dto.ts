import { ApiProperty } from '@nestjs/swagger';
import { IsDateString } from 'class-validator';

export class GenerateInvoiceDto {
  @ApiProperty({ description: 'Due date for the generated rent invoice' })
  @IsDateString()
  dueDate: string;
}
