import { z } from 'zod';

export const authVerifySchema = z.object({
  password: z.string().min(1, 'La contraseña es requerida'),
  hash: z.string().min(1, 'El hash es requerido'),
});

export const authGetUserSchema = z.string().min(1, 'El nombre de usuario es requerido');

export const authUpdateLoginSchema = z.number().int().positive('ID de usuario inválido');

export const authHashSchema = z.string().min(1, 'La contraseña es requerida');
