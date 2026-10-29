import { PaymentMethod } from '../enums/payment-method.enum.js';

export class Expense {
  id: string;
  userId: string;
  title: string;
  amount: number;
  categoryId: string;
  date: Date;
  paymentMethod: PaymentMethod;
  createdAt: Date;
}
