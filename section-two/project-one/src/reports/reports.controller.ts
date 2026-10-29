import { Controller, Get, Query, Res } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ExportExpensesQueryDto } from './dto/export-expenses-query.dto.js';
import { ExportFormat } from './enums/export-format.enum.js';
import { ReportsService } from './reports.service.js';

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('expenses')
  exportExpenses(
    @CurrentUser() user: AuthUser,
    @Query() query: ExportExpensesQueryDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    if (query.format === ExportFormat.CSV) {
      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="expenses.csv"',
      );
      return this.reportsService.toCsv(user.id, query);
    }
    return this.reportsService.toJson(user.id, query);
  }
}
