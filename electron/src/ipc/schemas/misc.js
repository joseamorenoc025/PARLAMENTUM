import { z } from 'zod';

<export const qrGenerateSchema = z.string().url().or(z.string().min(1));
export const logSchema = z.object({
  level: z.enum(['info', 'warn', 'error', 'debug']),
  message: z.string().min(1)
});

export const analyticsOptInSchema = z.boolean();
