import { z } from 'zod';

export const logSchema = z.object({
  level: z.enum(['info', 'error', 'warn', 'debug']),
  message: z.string().min(1)
});

export const qrGenerateSchema = z.string().min(1);

export const analyticsOptInSchema = z.boolean();
