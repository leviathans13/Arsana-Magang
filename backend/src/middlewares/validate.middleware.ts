import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (schema: ZodSchema, target: ValidationTarget = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const dataToValidate = req[target];
      const result = schema.safeParse(dataToValidate);

      if (!result.success) {
        const errors = formatZodErrors(result.error);
        res.status(400).json({
          success: false,
          error: 'Validation failed',
          message: 'Invalid request data',
          details: errors,
        });
        return;
      }

      // Replace the target with parsed/transformed data
      req[target] = result.data;
      next();
    } catch (error) {
      res.status(400).json({
        success: false,
        error: 'Validation error',
        message: 'An error occurred during validation',
      });
    }
  };
};

// Helper function to format Zod errors
const formatZodErrors = (error: ZodError): Record<string, string[]> => {
  const errors: Record<string, string[]> = {};

  error.errors.forEach((err) => {
    const path = err.path.join('.') || 'root';
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(err.message);
  });

  return errors;
};

// Validate multiple schemas at once
export const validateMultiple = (schemas: {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const allErrors: Record<string, Record<string, string[]>> = {};

    for (const [target, schema] of Object.entries(schemas)) {
      if (schema) {
        const dataToValidate = req[target as ValidationTarget];
        const result = schema.safeParse(dataToValidate);

        if (!result.success) {
          allErrors[target] = formatZodErrors(result.error);
        } else {
          req[target as ValidationTarget] = result.data;
        }
      }
    }

    if (Object.keys(allErrors).length > 0) {
      res.status(400).json({
        success: false,
        error: 'Validation failed',
        message: 'Invalid request data',
        details: allErrors,
      });
      return;
    }

    next();
  };
};
