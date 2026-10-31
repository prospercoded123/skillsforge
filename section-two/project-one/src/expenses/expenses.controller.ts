import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { ApiDoc } from '../common/api-doc.js';
import { CreateExpenseDto } from './dto/create-expense.dto.js';
import { ExpenseListQueryDto } from './dto/expense-list-query.dto.js';
import { ExpenseQueryDto } from './dto/expense-query.dto.js';
import { UpdateExpenseDto } from './dto/update-expense.dto.js';
import { expensesDocs } from './expenses.docs.js';
import { ExpensesService } from './expenses.service.js';

@ApiTags('expenses')
@ApiBearerAuth()
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @ApiDoc(expensesDocs.create)
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateExpenseDto) {
    return this.expensesService.create(user.id, dto);
  }

  @Get()
  @ApiDoc(expensesDocs.findAll)
  findAll(@CurrentUser() user: AuthUser, @Query() query: ExpenseListQueryDto) {
    return this.expensesService.findAll(user.id, query);
  }

  @Get('summary')
  @ApiDoc(expensesDocs.summary)
  summary(@CurrentUser() user: AuthUser, @Query() query: ExpenseQueryDto) {
    return this.expensesService.summary(user.id, query);
  }

  @Get(':id')
  @ApiDoc(expensesDocs.findOne)
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expensesService.findOne(user.id, id);
  }

  @Patch(':id')
  @ApiDoc(expensesDocs.update)
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateExpenseDto,
  ) {
    return this.expensesService.update(user.id, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiDoc(expensesDocs.remove)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.expensesService.remove(user.id, id);
  }
}
