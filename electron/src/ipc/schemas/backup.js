import { z } from 'zod';

export const backupExportSchema = z.string().min(4, 'La contraseña debe tener al menos 4 caracteres');
export const backupImportSchema = z.string().min(4, 'La contraseña debe tener al menos 4 caracteres');
