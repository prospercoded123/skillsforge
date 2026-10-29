export const MONTH_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

export interface DateRange {
  from: string;
  to: string;
}

export function todayString(): string {
  return new Date().toISOString().slice(0, 10);
}

function toDayNumber(date: string): number {
  return Date.parse(`${date}T00:00:00Z`) / MS_PER_DAY;
}

export function addDays(date: string, days: number): string {
  return new Date((toDayNumber(date) + days) * MS_PER_DAY)
    .toISOString()
    .slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return toDayNumber(to) - toDayNumber(from) + 1;
}

export function monthRange(month: string): DateRange {
  const [year, monthNumber] = month.split('-').map(Number);
  const lastDay = new Date(Date.UTC(year, monthNumber, 0)).getUTCDate();
  return {
    from: `${month}-01`,
    to: `${month}-${String(lastDay).padStart(2, '0')}`,
  };
}

export function previousMonth(month: string): string {
  const [year, monthNumber] = month.split('-').map(Number);
  return new Date(Date.UTC(year, monthNumber - 2, 1)).toISOString().slice(0, 7);
}
