import { z } from 'zod';

export const setupInitializeSchema = z.object({
  password: z.string().min(8),
  chamberName: z.string().min(3).max(100),
  timezone: z.string(),
  logoBuffer: z.any().optional(), // Buffer de imagen (opcional)
});
