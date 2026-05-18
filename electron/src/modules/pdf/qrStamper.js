import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import QRCode from 'qrcode';
import { PDFDocument } from 'pdf-lib';
import { db } from '../../db/index.js';
import * as schema from '../../db/schema.js';
import { eq } from 'drizzle-orm';
import { app } from 'electron';
import { logger } from '../../lib/logger.js';

export async function stampQR(entidadTipo, entidadId) {
  try {
    let filePath, fileHash, contenidoBase64, originalRecord;
    
    // 1. Fetch document from DB depending on the type
    if (entidadTipo === 'Law') {
      const records = db.select().from(schema.laws).where(eq(schema.laws.id, Number(entidadId))).all();
      if (!records || records.length === 0) throw new Error('Ley no encontrada.');
      originalRecord = records[0];
      filePath = originalRecord.rutaPdf;
      fileHash = originalRecord.fileHash;
      if (!filePath) throw new Error('La ley no tiene un PDF local asignado.');
    } else {
      const records = db.select().from(schema.documents).where(eq(schema.documents.id, Number(entidadId))).all();
      if (!records || records.length === 0) throw new Error('Documento no encontrado.');
      originalRecord = records[0];
      filePath = originalRecord.rutaArchivo;
      fileHash = originalRecord.hashIntegridad;
      contenidoBase64 = originalRecord.contenidoBase64;
    }

    // Si el archivo no existe físicamente local
    if (!fs.existsSync(filePath)) {
      if (entidadTipo !== 'Law' && contenidoBase64) {
        const docsPath = path.join(app.getPath('userData'), 'documents');
        if (!fs.existsSync(docsPath)) fs.mkdirSync(docsPath, { recursive: true });
        filePath = path.join(docsPath, originalRecord.nombreOriginal || `doc_${entidadId}.pdf`);
        fs.writeFileSync(filePath, Buffer.from(contenidoBase64, 'base64'));
      } else {
        throw new Error('El archivo físico no existe.');
      }
    }

    // 2. Generate QR code (using the original document hash as validation)
    const validationText = `Hash de validación:\n${fileHash || 'Pendiente'}`;
    const qrBuffer = await QRCode.toBuffer(validationText, {
      type: 'png',
      errorCorrectionLevel: 'H',
      margin: 1,
      width: 150
    });

    // 3. Load PDF
    const pdfBytes = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // 4. Embed QR Image
    const qrImage = await pdfDoc.embedPng(qrBuffer);
    const pages = pdfDoc.getPages();
    const lastPage = pages[pages.length - 1];
    const { width, height } = lastPage.getSize();

    // 5. Draw QR on bottom right (with some margin)
    const qrSize = 100;
    const marginX = 40;
    const marginY = 40;
    lastPage.drawImage(qrImage, {
      x: width - qrSize - marginX,
      y: marginY,
      width: qrSize,
      height: qrSize,
    });

    // 6. Save modified PDF
    const modifiedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(filePath, modifiedPdfBytes);

    // 7. Update document DB record with new hash
    const newHash = crypto.createHash('sha256').update(modifiedPdfBytes).digest('hex');
    
    if (entidadTipo === 'Law') {
      db.update(schema.laws).set({ fileHash: newHash }).where(eq(schema.laws.id, originalRecord.id)).run();
    } else {
      const newBase64 = Buffer.from(modifiedPdfBytes).toString('base64');
      db.update(schema.documents).set({
        tamanoBytes: modifiedPdfBytes.length,
        hashIntegridad: newHash,
        contenidoBase64: newBase64
      }).where(eq(schema.documents.id, originalRecord.id)).run();
    }

    return { success: true, newHash };
  } catch (error) {
    logger.error('Error in stampQR:', error);
    throw error;
  }
}
