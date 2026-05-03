import winston from 'winston';
import path from 'path';
import fs from 'fs';
import { app } from 'electron';

// This is a helper to get paths before app is ready if needed, 
// but usually we call this after app.whenReady() or use app.getPath
const getLogPath = () => {
  try {
    const userDataPath = app.getPath('userData');
    const logPath = path.join(userDataPath, 'logs');
    if (!fs.existsSync(logPath)) {
      fs.mkdirSync(logPath, { recursive: true });
    }
    return logPath;
  } catch (e) {
    // Fallback for environment where app might not be fully ready
    return './logs';
  }
};

const LOG_PATH = getLogPath();

export const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { 
    app: 'cerebro-legislativo',
    platform: process.platform
  },
  transports: [
    new winston.transports.File({ 
      filename: path.join(LOG_PATH, 'error.log'), 
      level: 'error',
      maxsize: 5 * 1024 * 1024, // 5MB
      maxFiles: 3 
    }),
    new winston.transports.File({ 
      filename: path.join(LOG_PATH, 'combined.log'),
      maxsize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
    )
  }));
}
