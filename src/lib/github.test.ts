import { describe, it, expect } from 'vitest';
import { sixMonthRange } from './github';

describe('sixMonthRange', () => {
  it('spans exactly 6 months ending at now', () => {
    const now = new Date('2026-08-14T12:00:00.000Z');
    expect(sixMonthRange(now)).toEqual({
      from: '2026-02-14T12:00:00.000Z',
      to: '2026-08-14T12:00:00.000Z',
    });
  });

  it('handles month-length underflow (e.g. Mar 31 - 6mo has no day 31)', () => {
    const now = new Date('2026-03-31T00:00:00.000Z');
    const { from } = sixMonthRange(now);
    // JS Date rolls Sep 31 -> Oct 1
    expect(from).toBe('2025-10-01T00:00:00.000Z');
  });
});
