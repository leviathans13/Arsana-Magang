import winston from 'winston';
import path from 'path';
import { config } from '../config/env';

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack }) => {
    return stack
      ? `${timestamp} [${level.toUpperCase()}]: ${message}\n${stack}`
      : `${timestamp} [${level.toUpperCase()}]: ${message}`;
  })
);

// Create transports array
const transports: winston.transport[] = [
  new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      logFormat
    ),
  }),
];

// Add file transport if enabled
if (config.logging.enableFileLogging) {
  const logsDir = path.join(process.cwd(), 'logs');
  
  transports.push(
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: logFormat,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: logFormat,
    })
  );
}

// Create logger instance
export const logger = winston.createLogger({
  level: config.logging.level,
  format: logFormat,
  transports,
  exitOnError: false,
});

// Helper functions for different log levels
export const logError = (message: string, error?: Error): void => {
  if (error) {
    logger.error(`${message}: ${error.message}`, { stack: error.stack });
  } else {
    logger.error(message);
  }
};

export const logWarn = (message: string): void => {
  logger.warn(message);
};

export const logInfo = (message: string): void => {
  logger.info(message);
};

export const logDebug = (message: string): void => {
  logger.debug(message);
};

export default logger;
