import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsUUID,
  Matches,
} from 'class-validator';
import { MONTH_PATTERN } from '../../common/dates.js';
import { PaymentMethod } from '../enums/payment-method.enum.js';
import { SortField, SortOrder } from '../enums/sort.enum.js';

export class ExpenseQueryDto {
  @IsOptional()
  @IsUUID()
  categoryId?: string;

  @ApiPropertyOptional({ enum: PaymentMethod })
  @IsOptional()
  @IsEnum(PaymentMethod)
  paymentMethod?: PaymentMethod;

  @ApiPropertyOptional({ description: 'Inclusive start date, e.g. 2026-10-01' })
  @IsOptional()
  @IsDateString()
  from?: string;

  @ApiPropertyOptional({ description: 'Inclusive end date, e.g. 2026-10-31' })
  @IsOptional()
  @IsDateString()
  to?: string;

  @ApiPropertyOptional({
    description:
      'Whole calendar month, e.g. 2026-10. Overrides from and to, and enables budget analysis.',
  })
  @IsOptional()
  @Matches(MONTH_PATTERN, { message: 'month must be in YYYY-MM format' })
  month?: string;

  @ApiPropertyOptional({ enum: SortField, default: SortField.DATE })
  @IsOptional()
  @IsEnum(SortField)
  sortBy: SortField = SortField.DATE;

  @ApiPropertyOptional({ enum: SortOrder, default: SortOrder.DESC })
  @IsOptional()
  @IsEnum(SortOrder)
  order: SortOrder = SortOrder.DESC;
}
