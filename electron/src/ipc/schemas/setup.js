import { z } from 'zod';

export const setupInitializeSchema = z.object({
  username: z.string().min(3).max(20),
  password: z.string().min(8),
  securityQuestion: z.string().min(5),
  securityAnswer: z.string().min(3),
  chamberName: z.string().min(3).max(100),
  timezone: z.string(),
  logoBuffer: z.any().optional(), // Buffer de imagen (opcional)
});
