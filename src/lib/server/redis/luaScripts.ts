import 'server-only';

/**
 * Atomic Lua script for recording a vote and incrementing counts.
 *
 * KEYS[1] = voter key (e.g. prefix:voter:{digest})
 * KEYS[2] = counts hash key (e.g. prefix:counts)
 * ARGV[1] = choice ('stay' | 'switch')
 * ARGV[2] = updatedAt ISO timestamp
 *
 * Returns:
 *   [status, choice]
 *   status: 'recorded' | 'already_voted'
 */
export const ATOMIC_VOTE_LUA = `
local existingChoice = redis.call('GET', KEYS[1])
if existingChoice then
  return { 'already_voted', existingChoice }
else
  redis.call('SET', KEYS[1], ARGV[1])
  redis.call('HINCRBY', KEYS[2], ARGV[1], 1)
  redis.call('HSET', KEYS[2], 'updatedAt', ARGV[2])
  return { 'recorded', ARGV[1] }
end
`;

