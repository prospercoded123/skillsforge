import { forwardRef, Module } from '@nestjs/common';
import { ExpensesModule } from '../expenses/expenses.module.js';
import { CategoriesController } from './categories.controller.js';
import { CategoriesService } from './categories.service.js';

@Module({
  imports: [forwardRef(() => ExpensesModule)],
  controllers: [CategoriesController],
  providers: [CategoriesService],
  exports: [CategoriesService],
})
export class CategoriesModule {}
