import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { ExpenseQueryDto } from '../../expenses/dto/expense-query.dto.js';
import { ExportFormat } from '../enums/export-format.enum.js';

export class ExportExpensesQueryDto extends ExpenseQueryDto {
  @ApiPropertyOptional({ enum: ExportFormat, default: ExportFormat.JSON })
  @IsOptional()
  @IsEnum(ExportFormat)
  format: ExportFormat = ExportFormat.JSON;
}
