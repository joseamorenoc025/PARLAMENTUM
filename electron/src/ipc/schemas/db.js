import { z } from 'zod';

export const dbSelectSchema = z.object({
  table: z.string().min(1, 'La tabla es requerida'),
  where: z.record(z.any()).optional().default({}),
});

export const dbUpsertSchema = z.object({
  table: z.string().min(1, 'La tabla es requerida'),
  data: z.record(z.any()).and(z.object({ id: z.any().optional() })),
});

export const dbQuerySchema = z.object({
  sql: z.string().min(1, 'La consulta SQL es requerida'),
  params: z.array(z.any()).optional().default([]),
});
