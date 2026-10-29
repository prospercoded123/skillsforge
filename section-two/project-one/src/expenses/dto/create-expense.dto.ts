import { ApiProperty } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { PaymentMethod } from '../enums/payment-method.enum.js';

export class CreateExpenseDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  title: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  amount: number;

  @IsUUID()
  categoryId: string;

  @IsDateString()
  date: string;

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;
}
