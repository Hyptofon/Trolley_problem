import { AdminStatsResponse } from '../types';

export interface RawVoteCounts {
  stay: number;
  switch: number;
  updatedAt?: string;
}

/**
 * Accurately calculates total and percentages with 1 decimal place precision.
 * Safely handles edge cases like 0 votes, NaN, negative numbers, and large aggregates.
 */
export function calculateStats(raw: RawVoteCounts): AdminStatsResponse {
  const stay = Math.max(0, Math.floor(Number(raw.stay) || 0));
  const switchCount = Math.max(0, Math.floor(Number(raw.switch) || 0));
  const total = stay + switchCount;

  if (total === 0) {
    return {
      total: 0,
      stay: 0,
      switch: 0,
      stayPercent: 0,
      switchPercent: 0,
      updatedAt: raw.updatedAt || new Date().toISOString(),
    };
  }

  // Calculate with 1 decimal place precision
  const rawStayPercent = (stay / total) * 100;
  const rawSwitchPercent = (switchCount / total) * 100;

  const stayPercent = Math.round(rawStayPercent * 10) / 10;
  const switchPercent = Math.round(rawSwitchPercent * 10) / 10;

  return {
    total,
    stay,
    switch: switchCount,
    stayPercent,
    switchPercent,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}

