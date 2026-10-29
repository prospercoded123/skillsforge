import { IntersectionType } from '@nestjs/swagger';
import { PaginationQueryDto } from '../../common/pagination-query.dto.js';
import { ExpenseQueryDto } from './expense-query.dto.js';

export class ExpenseListQueryDto extends IntersectionType(
  ExpenseQueryDto,
  PaginationQueryDto,
) {}
