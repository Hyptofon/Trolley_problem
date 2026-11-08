import 'server-only';

/**
 * Atomic Lua script for recording a vote or updating/replacing an existing vote.
 *
 * KEYS[1] = voter key (e.g. prefix:voter:{digest})
 * KEYS[2] = counts hash key (e.g. prefix:counts)
 * ARGV[1] = choice ('stay' | 'switch')
 * ARGV[2] = updatedAt ISO timestamp
 *
 * Semantics:
 * - If voter has NOT voted yet:
 *     SET voterKey choice
 *     HINCRBY countsKey choice +1
 *     HSET countsKey updatedAt timestamp
 *     Returns ['recorded', choice, '']
 * - If voter already voted the SAME choice:
 *     Returns ['already_voted', choice, choice] (unchanged)
 * - If voter already voted a DIFFERENT choice (e.g. stay -> switch):
 *     HINCRBY countsKey existingChoice -1
 *     HINCRBY countsKey choice +1
 *     SET voterKey choice
 *     HSET countsKey updatedAt timestamp
 *     Returns ['updated', choice, existingChoice]
 */
export const ATOMIC_VOTE_LUA = `
local existingChoice = redis.call('GET', KEYS[1])
if not existingChoice then
  redis.call('SET', KEYS[1], ARGV[1])
  redis.call('HINCRBY', KEYS[2], ARGV[1], 1)
  redis.call('HSET', KEYS[2], 'updatedAt', ARGV[2])
  return { 'recorded', ARGV[1], '' }
elseif existingChoice == ARGV[1] then
  return { 'already_voted', ARGV[1], existingChoice }
else
  local prevCount = tonumber(redis.call('HGET', KEYS[2], existingChoice) or '0')
  if prevCount > 0 then
    redis.call('HINCRBY', KEYS[2], existingChoice, -1)
  end
  redis.call('HINCRBY', KEYS[2], ARGV[1], 1)
  redis.call('SET', KEYS[1], ARGV[1])
  redis.call('HSET', KEYS[2], 'updatedAt', ARGV[2])
  return { 'updated', ARGV[1], existingChoice }
end
`;
