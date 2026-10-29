import { Module } from '@nestjs/common';
import { CategoriesModule } from './categories/categories.module.js';
import { ExpensesModule } from './expenses/expenses.module.js';

@Module({
  imports: [CategoriesModule, ExpensesModule],
})
export class AppModule {}
