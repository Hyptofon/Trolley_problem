import { describe, it, expect, beforeEach } from 'vitest';
import { recordVote, getVoteStatus } from '@/lib/server/voteService';
import { getAdminStats } from '@/lib/server/adminService';
import { getInMemoryRedisAdapter } from '@/lib/server/redis/client';

describe('Redis Atomicity & Concurrency (Lua EVAL simulation)', () => {
  beforeEach(() => {
    getInMemoryRedisAdapter().clear();
  });

  it('guarantees atomicity under 25 concurrent requests with the SAME participantId and choice', async () => {
    const participantId = '550e8400-e29b-41d4-a716-446655440000';

    // Launch 25 concurrent vote calls for the same participant ID (all stay)
    const promises = Array.from({ length: 25 }, () =>
      recordVote(participantId, 'stay')
    );

    const results = await Promise.all(promises);

    const recordedCount = results.filter((r) => r.status === 'recorded').length;
    const alreadyVotedCount = results.filter((r) => r.status === 'already_voted').length;

    // Exactly one call must be recorded; exactly 24 must be already_voted
    expect(recordedCount).toBe(1);
    expect(alreadyVotedCount).toBe(24);

    // All results must have the same final choice
    for (const r of results) {
      expect(r.choice).toBe('stay');
    }

    // Verify Redis counts hash: total must be exactly 1
    const stats = await getAdminStats();
    expect(stats.total).toBe(1);
    expect(stats.stay).toBe(1);
    expect(stats.switch).toBe(0);
  });

  it('correctly records 30 concurrent votes from 30 DIFFERENT participants', async () => {
    // 18 stay, 12 switch
    const stayIds = Array.from({ length: 18 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i + 1).padStart(12, '0')}`
    );
    const switchIds = Array.from({ length: 12 }, (_, i) =>
      `00000000-0000-4000-8000-${String(i + 19).padStart(12, '0')}`
    );

    const promises = [
      ...stayIds.map((id) => recordVote(id, 'stay')),
      ...switchIds.map((id) => recordVote(id, 'switch')),
    ];

    const results = await Promise.all(promises);

    // All 30 must succeed as recorded
    expect(results).toHaveLength(30);
    for (const res of results) {
      expect(res.status).toBe('recorded');
    }

    // Verify Redis totals
    const stats = await getAdminStats();
    expect(stats.total).toBe(30);
    expect(stats.stay).toBe(18);
    expect(stats.switch).toBe(12);
    expect(stats.stayPercent).toBe(60);
    expect(stats.switchPercent).toBe(40);
  });

  it('supports atomic vote replacement / revote without duplicating totals', async () => {
    const id = '550e8400-e29b-41d4-a716-446655440099';

    // Initial choice: stay
    const first = await recordVote(id, 'stay');
    expect(first.status).toBe('recorded');
    expect(first.choice).toBe('stay');
    expect(first.previousChoice).toBeNull();

    let stats = await getAdminStats();
    expect(stats.total).toBe(1);
    expect(stats.stay).toBe(1);
    expect(stats.switch).toBe(0);

    // Participant changes mind and votes 'switch'
    const second = await recordVote(id, 'switch');
    expect(second.status).toBe('updated');
    expect(second.choice).toBe('switch');
    expect(second.previousChoice).toBe('stay');

    // Total must still be 1, but stay is 0 and switch is 1
    stats = await getAdminStats();
    expect(stats.total).toBe(1);
    expect(stats.stay).toBe(0);
    expect(stats.switch).toBe(1);

    // If participant votes 'switch' again, returns 'already_voted'
    const third = await recordVote(id, 'switch');
    expect(third.status).toBe('already_voted');
    expect(third.choice).toBe('switch');

    // Participant changes mind back to 'stay'
    const fourth = await recordVote(id, 'stay');
    expect(fourth.status).toBe('updated');
    expect(fourth.choice).toBe('stay');
    expect(fourth.previousChoice).toBe('switch');

    stats = await getAdminStats();
    expect(stats.total).toBe(1);
    expect(stats.stay).toBe(1);
    expect(stats.switch).toBe(0);

    // Status check must return current choice
    const status = await getVoteStatus(id);
    expect(status).toEqual({ voted: true, choice: 'stay' });
  });
});

