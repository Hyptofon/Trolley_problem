import { z } from 'zod';

export const UUID_V4_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidUUID(id: unknown): id is string {
  return typeof id === 'string' && UUID_V4_REGEX.test(id);
}

export const voteRequestSchema = z.object({
  participantId: z
    .string({ required_error: 'Ідентифікатор учасника є обовʼязковим' })
    .regex(UUID_V4_REGEX, { message: 'Ідентифікатор має бути валідним UUID v4' }),
  choice: z.enum(['stay', 'switch'], {
    errorMap: () => ({ message: 'Вибір має бути рівно "stay" або "switch"' }),
  }),
});

export const voteStatusRequestSchema = z.object({
  participantId: z
    .string({ required_error: 'Ідентифікатор учасника є обовʼязковим' })
    .regex(UUID_V4_REGEX, { message: 'Ідентифікатор має бути валідним UUID v4' }),
});

export const adminLoginRequestSchema = z.object({
  password: z
    .string({ required_error: 'Пароль є обовʼязковим' })
    .min(1, { message: 'Пароль не може бути порожнім' })
    .max(256, { message: 'Пароль занадто довгий' }),
});

