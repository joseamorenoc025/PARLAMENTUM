import fs from 'fs/promises';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Polyfills para pdf-parse (pdf.js) en entorno Node.js/Electron Main
if (typeof global.DOMMatrix === 'undefined') {
  global.DOMMatrix = class DOMMatrix {
    constructor() {
      this.a = 1; this.b = 0; this.c = 0; this.d = 1; this.e = 0; this.f = 0;
    }
    toString() { return `matrix(${this.a}, ${this.b}, ${this.c}, ${this.d}, ${this.e}, ${this.f})`; }
  };
}
if (typeof global.Path2D === 'undefined') {
  global.Path2D = class Path2D {};
}
if (typeof global.ImageData === 'undefined') {
  global.ImageData = class ImageData {};
}
if (typeof global.DOMPoint === 'undefined') {
  global.DOMPoint = class DOMPoint {};
}

const pdf = require('pdf-parse');
import { logger } from '../lib/logger.js';

/**
 * Extracts text from a PDF file.
 * @param {string} filePath - Path to the PDF file.
 * @returns {Promise<string>} The extracted text.
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    logger.error(`Error extracting text from PDF [${filePath}]:`, error);
    throw new Error('No se pudo extraer el texto del PDF.');
  }
};

/**
 * Basic title extraction from content if not provided.
 * @param {string} content - Extracted text content.
 * @returns {string} A likely title.
 */
export const extractTitleFromContent = (content) => {
  // Take first 100 characters of the first line
  const firstLine = content.split('\n')[0].trim();
  if (firstLine.length > 5) return firstLine.substring(0, 100);
  return 'Ley sin título';
};
