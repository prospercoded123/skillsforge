import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Put,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { AuthUser } from '../auth/auth-user.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { BudgetsService } from './budgets.service.js';
import { SetBudgetDto } from './dto/set-budget.dto.js';
import { ParseMonthPipe } from './pipes/parse-month.pipe.js';

@ApiTags('budgets')
@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  constructor(private readonly budgetsService: BudgetsService) {}

  @Get(':month')
  findForMonth(
    @CurrentUser() user: AuthUser,
    @Param('month', ParseMonthPipe) month: string,
  ) {
    return this.budgetsService.findForMonth(user.id, month);
  }

  @Put(':month')
  setOverall(
    @CurrentUser() user: AuthUser,
    @Param('month', ParseMonthPipe) month: string,
    @Body() dto: SetBudgetDto,
  ) {
    return this.budgetsService.setOverall(user.id, month, dto.limit);
  }

  @Delete(':month')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeOverall(
    @CurrentUser() user: AuthUser,
    @Param('month', ParseMonthPipe) month: string,
  ) {
    return this.budgetsService.removeOverall(user.id, month);
  }

  @Put(':month/categories/:categoryId')
  setForCategory(
    @CurrentUser() user: AuthUser,
    @Param('month', ParseMonthPipe) month: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
    @Body() dto: SetBudgetDto,
  ) {
    return this.budgetsService.setForCategory(
      user.id,
      categoryId,
      month,
      dto.limit,
    );
  }

  @Delete(':month/categories/:categoryId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeForCategory(
    @CurrentUser() user: AuthUser,
    @Param('month', ParseMonthPipe) month: string,
    @Param('categoryId', ParseUUIDPipe) categoryId: string,
  ) {
    return this.budgetsService.removeForCategory(user.id, categoryId, month);
  }
}
