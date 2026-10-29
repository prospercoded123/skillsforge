import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
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

  @Put(':month')
  set(
    @CurrentUser() user: AuthUser,
    @Param('month', ParseMonthPipe) month: string,
    @Body() dto: SetBudgetDto,
  ) {
    return this.budgetsService.set(user.id, month, dto.limit);
  }

  @Get(':month')
  status(
    @CurrentUser() user: AuthUser,
    @Param('month', ParseMonthPipe) month: string,
  ) {
    return this.budgetsService.status(user.id, month);
  }

  @Delete(':month')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(
    @CurrentUser() user: AuthUser,
    @Param('month', ParseMonthPipe) month: string,
  ) {
    this.budgetsService.remove(user.id, month);
  }
}
