import { z } from 'zod';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Environment validation schema
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  DATABASE_URL: z.string().url().or(z.string().min(1)),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  UPLOAD_PATH: z.string().default('./uploads'),
  FRONTEND_URL: z.string().url().default('http://localhost:3000'),
  ENABLE_FILE_LOGGING: z.string().transform((val) => val === 'true').default('false'),
  DETAILED_REQUEST_LOGGING: z.string().transform((val) => val === 'true').default('false'),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),
});

// Parse and validate environment variables
const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  console.error('❌ Invalid environment variables:');
  console.error(parsedEnv.error.format());
  process.exit(1);
}

// Export typed config object
export const config = {
  nodeEnv: parsedEnv.data.NODE_ENV,
  port: parsedEnv.data.PORT,
  databaseUrl: parsedEnv.data.DATABASE_URL,
  jwt: {
    secret: parsedEnv.data.JWT_SECRET,
    expiresIn: parsedEnv.data.JWT_EXPIRES_IN,
  },
  uploadPath: parsedEnv.data.UPLOAD_PATH,
  frontendUrl: parsedEnv.data.FRONTEND_URL,
  logging: {
    enableFileLogging: parsedEnv.data.ENABLE_FILE_LOGGING,
    detailedRequestLogging: parsedEnv.data.DETAILED_REQUEST_LOGGING,
    level: parsedEnv.data.LOG_LEVEL,
  },
  isDevelopment: parsedEnv.data.NODE_ENV === 'development',
  isProduction: parsedEnv.data.NODE_ENV === 'production',
  isTest: parsedEnv.data.NODE_ENV === 'test',
} as const;

export type Config = typeof config;
