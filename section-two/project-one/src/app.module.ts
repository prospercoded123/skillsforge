import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { BudgetsModule } from './budgets/budgets.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';

@Module({
  imports: [AuthModule, CategoriesModule, ExpensesModule, BudgetsModule],
})
export class AppModule {}
