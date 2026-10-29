import { forwardRef, Module } from '@nestjs/common';
import { CategoriesModule } from '../categories/categories.module.js';
import { ExpensesController } from './expenses.controller.js';
import { ExpensesService } from './expenses.service.js';

@Module({
  imports: [forwardRef(() => CategoriesModule)],
  controllers: [ExpensesController],
  providers: [ExpensesService],
  exports: [ExpensesService],
})
export class ExpensesModule {}
