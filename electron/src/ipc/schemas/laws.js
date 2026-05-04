import { z } from 'zod';

export const lawImportSchema = z.object({
  filePath: z.string().min(1, 'La ruta del archivo es requerida'),
  metadata: z.object({
    expediente: z.string().optional(),
    titulo: z.string().optional(),
    tipo: z.string().optional(),
  }).optional().default({}),
});

export const lawSearchSchema = z.object({
  term: z.string().optional().default(''),
  filters: z.record(z.any()).optional().default({}),
});
