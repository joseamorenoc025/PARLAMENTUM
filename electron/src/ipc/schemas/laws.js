import { z } from 'zod';

export const lawImportSchema = z.object({
  metadata: z.object({
    titulo: z.string().min(3, 'El título debe tener al menos 3 caracteres'),
    gaceta: z.enum(['Ordinaria', 'Extraordinaria'], {
      errorMap: () => ({ message: 'La gaceta debe ser Ordinaria o Extraordinaria' })
    }),
    anio: z.number().int().min(1900).max(new Date().getFullYear() + 1),
    driveLink: z.string().url('Debe ser una URL válida de Google Drive').or(z.string().min(1, 'El enlace de Drive es requerido')),
  }),
});

export const lawSearchSchema = z.object({
  term: z.string().optional().default(''),
  filters: z.record(z.any()).optional().default({}),
});
