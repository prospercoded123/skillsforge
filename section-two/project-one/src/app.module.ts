import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module.js';
import { BudgetsModule } from './budgets/budgets.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { DatabaseModule } from './database/database.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';
import { ReportsModule } from './reports/reports.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    DatabaseModule,
    AuthModule,
    CategoriesModule,
    ExpensesModule,
    BudgetsModule,
    ReportsModule,
  ],
})
export class AppModule {}
