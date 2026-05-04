import { logger } from '../lib/logger.js';
import { z } from 'zod';

/**
 * Validates IPC input data against a Zod schema.
 * @param {z.ZodSchema} schema - The Zod schema to validate against.
 * @param {any} data - The data to validate.
 * @param {string} channel - The IPC channel name (for logging).
 * @returns {Object} { success: boolean, data?: any, error?: string }
 */
export const validateIPCInput = (schema, data, channel) => {
  try {
    return { success: true, data: schema.parse(data) };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues || error.errors || [];
      const details = issues.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
      logger.warn(`IPC Validation Failed [${channel}]: ${details}`, { 
        channel, 
        received: data,
        errors: issues 
      });
      throw new Error(`Datos de entrada inválidos: ${details}`);
    }
    logger.error(`Unexpected error during IPC validation [${channel}]:`, error);
    throw error;
  }
};
