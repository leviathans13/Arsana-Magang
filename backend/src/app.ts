import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import path from 'path';
import fs from 'fs';

import { config } from './config/env';
import { prisma } from './config/database';
import { logger } from './utils/logger';
import { errorHandler, notFoundHandler, apiRateLimiter, requestLogger } from './middlewares';
import routes from './routes';
import { initCronJobs } from './services/cronService';
import { setupSwagger } from './config/swagger';

// Create Express app
const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting
app.use(apiRateLimiter);

// Request logging
app.use(requestLogger);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directories exist
const uploadDirs = [
  path.join(config.uploadPath, 'letters', 'incoming'),
  path.join(config.uploadPath, 'letters', 'outgoing'),
];

uploadDirs.forEach((dir) => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    logger.info(`Created upload directory: ${dir}`);
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(config.uploadPath));

// Health check endpoint
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// Setup Swagger API documentation
setupSwagger(app);

// API routes
app.use('/api', routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Start server
const startServer = async (): Promise<void> => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected successfully');

    // Initialize cron jobs
    initCronJobs();

    // Start listening
    const server = app.listen(config.port, () => {
      logger.info(`🚀 Server running on port ${config.port}`);
      logger.info(`📍 Environment: ${config.nodeEnv}`);
      logger.info(`🔗 API: http://localhost:${config.port}/api`);
      logger.info(`🔗 Health: http://localhost:${config.port}/api/health`);
      logger.info(`📚 API Docs: http://localhost:${config.port}/api-docs`);
    });

    // Graceful shutdown handler
    const gracefulShutdown = async (signal: string): Promise<void> => {
      logger.info(`${signal} received. Starting graceful shutdown...`);
      
      server.close(async () => {
        logger.info('HTTP server closed');
        
        try {
          await prisma.$disconnect();
          logger.info('Database connection closed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during database disconnect:', error);
          process.exit(1);
        }
      });

      // Force close after 30 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Handle uncaught exceptions
process.on('uncaughtException', async (error: Error) => {
  logger.error('Uncaught Exception:', error);
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect errors
  }
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', async (reason: unknown) => {
  logger.error('Unhandled Rejection:', reason);
  try {
    await prisma.$disconnect();
  } catch {
    // Ignore disconnect errors
  }
  process.exit(1);
});

// Start the server
startServer();

export default app;
