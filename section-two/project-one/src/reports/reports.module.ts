import { Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module.js';
import { ExpensesModule } from '../expenses/expenses.module.js';
import { ReportsController } from './reports.controller.js';
import { ReportsService } from './reports.service.js';

@Module({
  imports: [ExpensesModule, CategoriesModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
