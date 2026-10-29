import { describe, expect, it } from 'vitest';
import { addDays, daysBetween, monthRange, previousMonth } from './dates.js';

describe('dates', () => {
  it('returns the first and last day of a month', () => {
    expect(monthRange('2026-02')).toEqual({
      from: '2026-02-01',
      to: '2026-02-28',
    });
    expect(monthRange('2028-02')).toEqual({
      from: '2028-02-01',
      to: '2028-02-29',
    });
  });

  it('steps back to the previous month across a year boundary', () => {
    expect(previousMonth('2026-01')).toBe('2025-12');
    expect(previousMonth('2026-10')).toBe('2026-09');
  });

  it('counts both ends of a range', () => {
    expect(daysBetween('2026-10-01', '2026-10-31')).toBe(31);
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
  });
});
