import { AdminStatsResponse } from './types';

export interface RawVoteCounts {
  stay: number | string | null | undefined;
  switch: number | string | null | undefined;
  updatedAt?: string | null;
}

/**
 * Accurately calculates total votes and percentages with 1 decimal place precision.
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

  const rawStayPercent = (stay / total) * 100;
  const stayPercent = Math.round(rawStayPercent * 10) / 10;
  // Ensure the two percentages cleanly sum to 100% when there is a split
  const switchPercent = Math.round((100 - stayPercent) * 10) / 10;

  return {
    total,
    stay,
    switch: switchCount,
    stayPercent,
    switchPercent,
    updatedAt: raw.updatedAt || new Date().toISOString(),
  };
}
