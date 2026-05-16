import { z } from 'zod';

export const authVerifySchema = z.object({
  password: z.string().min(1, 'La contraseña es requerida'),
  hash: z.string().min(1, 'El hash es requerido'),
});

export const authGetUserSchema = z.any().optional();

export const authRecoverSchema = z.object({
  phrase: z.string().min(10),
  newPassword: z.string().min(8)
});
export const authUpdateLoginSchema = z.number().int().positive('ID de usuario inválido');

export const authHashSchema = z.string().min(1, 'La contraseña es requerida');
