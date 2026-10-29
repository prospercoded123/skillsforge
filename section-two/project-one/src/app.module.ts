import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module.js';
import { CategoriesModule } from './categories/categories.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';

@Module({
  imports: [AuthModule, CategoriesModule, ExpensesModule],
})
export class AppModule {}
