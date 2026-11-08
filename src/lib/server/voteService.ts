import 'server-only';
import { Choice, VoteResponse, VoteStatusResponse } from '../shared/types';
import { voteRequestSchema, voteStatusRequestSchema } from '../shared/validation';
import { getServerEnv } from './env';
import { getParticipantDigest } from './crypto';
import { getRedisClient } from './redis/client';
import { ATOMIC_VOTE_LUA } from './redis/luaScripts';

export class VoteServiceError extends Error {
  code: string;
  statusCode: number;

  constructor(message: string, code: string = 'VOTE_ERROR', statusCode: number = 500) {
    super(message);
    this.name = 'VoteServiceError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

/**
 * Atomically records a vote or returns existing vote using Redis Lua EVAL.
 */
export async function recordVote(
  rawParticipantId: string,
  rawChoice: string
): Promise<VoteResponse> {
  const parsed = voteRequestSchema.safeParse({
    participantId: rawParticipantId,
    choice: rawChoice,
  });

  if (!parsed.success) {
    const firstError = parsed.error.issues[0]?.message || 'Некоректні дані голосування';
    throw new VoteServiceError(firstError, 'VALIDATION_ERROR', 400);
  }

  const { participantId, choice } = parsed.data;
  const env = getServerEnv();
  const redis = getRedisClient();

  const digest = getParticipantDigest(participantId, env.voteIdHmacSecret);
  const voterKey = `${env.redisKeyPrefix}:voter:${digest}`;
  const countsKey = `${env.redisKeyPrefix}:counts`;
  const timestamp = new Date().toISOString();

  try {
    const result = await redis.eval<[string, string]>(
      ATOMIC_VOTE_LUA,
      [voterKey, countsKey],
      [choice, timestamp]
    );

    const [status, confirmedChoice] = result;

    return {
      status: status === 'already_voted' ? 'already_voted' : 'recorded',
      choice: (confirmedChoice as Choice) || choice,
    };
  } catch (err) {
    if (err instanceof VoteServiceError) throw err;
    throw new VoteServiceError(
      'Помилка збереження голосу у сховищі даних. Будь ласка, спробуйте ще раз.',
      'STORAGE_ERROR',
      503
    );
  }
}

/**
 * Checks whether this browser participantId has already voted.
 */
export async function getVoteStatus(
  rawParticipantId: string
): Promise<VoteStatusResponse> {
  const parsed = voteStatusRequestSchema.safeParse({
    participantId: rawParticipantId,
  });

  if (!parsed.success) {
    throw new VoteServiceError('Невалідний ідентифікатор учасника', 'VALIDATION_ERROR', 400);
  }

  const { participantId } = parsed.data;
  const env = getServerEnv();
  const redis = getRedisClient();

  const digest = getParticipantDigest(participantId, env.voteIdHmacSecret);
  const voterKey = `${env.redisKeyPrefix}:voter:${digest}`;

  try {
    const existingChoice = await redis.get<string>(voterKey);

    if (existingChoice === 'stay' || existingChoice === 'switch') {
      return {
        voted: true,
        choice: existingChoice,
      };
    }

    return { voted: false };
  } catch {
    throw new VoteServiceError(
      'Не вдалося перевірити статус голосу',
      'STORAGE_ERROR',
      503
    );
  }
}

