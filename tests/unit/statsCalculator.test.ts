import { describe, it, expect } from 'vitest';
import { calculateStats } from '../../src/utils/statsCalculator';

describe('Stats Calculator Utility', () => {
  it('handles 0/0 votes gracefully', () => {
    const res = calculateStats({ stay: 0, switch: 0, updatedAt: '2026-11-05T12:00:00Z' });
    expect(res).toEqual({
      total: 0,
      stay: 0,
      switch: 0,
      stayPercent: 0,
      switchPercent: 0,
      updatedAt: '2026-11-05T12:00:00Z',
    });
  });

  it('calculates 100% stay when only stay votes exist (1/0)', () => {
    const res = calculateStats({ stay: 1, switch: 0 });
    expect(res.total).toBe(1);
    expect(res.stay).toBe(1);
    expect(res.switch).toBe(0);
    expect(res.stayPercent).toBe(100);
    expect(res.switchPercent).toBe(0);
  });

  it('calculates 100% switch when only switch votes exist (0/1)', () => {
    const res = calculateStats({ stay: 0, switch: 1 });
    expect(res.total).toBe(1);
    expect(res.stay).toBe(0);
    expect(res.switch).toBe(1);
    expect(res.stayPercent).toBe(0);
    expect(res.switchPercent).toBe(100);
  });

  it('calculates equal 50/50 split correctly', () => {
    const res = calculateStats({ stay: 50, switch: 50 });
    expect(res.total).toBe(100);
    expect(res.stayPercent).toBe(50);
    expect(res.switchPercent).toBe(50);
  });

  it('rounds to 1 decimal place with fractional splits (e.g. 1/2 -> 33.3% and 66.7%)', () => {
    const res = calculateStats({ stay: 1, switch: 2 });
    expect(res.total).toBe(3);
    expect(res.stayPercent).toBe(33.3);
    expect(res.switchPercent).toBe(66.7);
  });

  it('handles large aggregate numbers safely without overflow', () => {
    const res = calculateStats({ stay: 1000000, switch: 3000000 });
    expect(res.total).toBe(4000000);
    expect(res.stayPercent).toBe(25);
    expect(res.switchPercent).toBe(75);
  });

  it('handles negative or invalid values by treating them as 0', () => {
    const res = calculateStats({
      stay: -5,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      switch: 'invalid' as any,
    });
    expect(res.total).toBe(0);
    expect(res.stay).toBe(0);
    expect(res.switch).toBe(0);
  });
});

