import { z } from 'zod';

export const lawImportSchema = z.object({
  metadata: z.object({
    id: z.number().int().nullable().optional(),
    titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    gaceta: z.enum(['Ordinaria', 'Extraordinaria'], {
      errorMap: () => ({ message: 'La gaceta debe ser Ordinaria o Extraordinaria' })
    }),
    anio: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    numero: z.string().optional().default(''),
    fechaPublicacion: z.string().optional().default(() => new Date().toISOString()),
    driveLink: z.string().url('Debe ser una URL válida de Google Drive').or(z.string().length(0)).nullable().optional(),
    localFilePath: z.string().nullable().optional(),
    fileHash: z.string().nullable().optional().default(''),
    tags: z.string().nullable().optional(),
  }),
});

export const lawSearchSchema = z.object({
  term: z.string().optional().default(''),
  filters: z.record(z.any()).optional().default({}),
});
