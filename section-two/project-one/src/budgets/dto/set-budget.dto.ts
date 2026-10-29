import { IsNumber, IsPositive } from 'class-validator';

export class SetBudgetDto {
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  limit: number;
}
