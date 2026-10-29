import { roundMoney } from '../common/money.js';
import { SpendingRecord } from './analysis.types.js';

export function sumAmounts(records: SpendingRecord[]): number {
  return roundMoney(records.reduce((sum, record) => sum + record.amount, 0));
}

export function percentOf(part: number, whole: number): number {
  return whole > 0 ? roundMoney((part / whole) * 100) : 0;
}

export function groupByCategory(
  records: SpendingRecord[],
): Map<string, SpendingRecord[]> {
  const groups = new Map<string, SpendingRecord[]>();
  for (const record of records) {
    groups.set(record.categoryId, [
      ...(groups.get(record.categoryId) ?? []),
      record,
    ]);
  }
  return groups;
}
