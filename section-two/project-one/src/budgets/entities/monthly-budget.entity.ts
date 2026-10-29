import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { decimalTransformer } from '../../common/database/decimal.transformer.js';
import { User } from '../../users/entities/user.entity.js';

@Entity('monthly_budgets')
@Unique(['userId', 'month'])
export class MonthlyBudget {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 7 })
  month: string;

  @Column({ type: 'numeric', precision: 12, scale: 2, transformer: decimalTransformer })
  limitAmount: number;

  @Column('uuid')
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;
}
