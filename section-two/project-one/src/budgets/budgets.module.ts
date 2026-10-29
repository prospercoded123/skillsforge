import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CategoriesModule } from '../categories/categories.module.js';
import { BudgetsController } from './budgets.controller.js';
import { BudgetsService } from './budgets.service.js';
import { CategoryBudget } from './entities/category-budget.entity.js';
import { MonthlyBudget } from './entities/monthly-budget.entity.js';

@Module({
  imports: [TypeOrmModule.forFeature([MonthlyBudget, CategoryBudget]), CategoriesModule],
  controllers: [BudgetsController],
  providers: [BudgetsService],
  exports: [BudgetsService],
})
export class BudgetsModule {}
