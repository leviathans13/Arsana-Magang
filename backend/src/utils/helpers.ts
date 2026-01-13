import { PAGINATION } from '../config/constants';

// Pagination helper
export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationResult {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

export const getPagination = (params: PaginationParams): PaginationResult => {
  const page = Math.max(1, params.page || PAGINATION.DEFAULT_PAGE);
  const limit = Math.min(
    Math.max(1, params.limit || PAGINATION.DEFAULT_LIMIT),
    PAGINATION.MAX_LIMIT
  );
  const skip = (page - 1) * limit;

  return { skip, take: limit, page, limit };
};

export interface PaginationMeta {
  current: number;
  limit: number;
  total: number;
  pages: number;
}

export const createPaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  return {
    current: page,
    limit,
    total,
    pages: Math.ceil(total / limit),
  };
};

// Date helpers
export const parseDate = (dateString: string): Date => {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    throw new Error(`Invalid date format: ${dateString}`);
  }
  return date;
};

export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

export const subtractDays = (date: Date, days: number): Date => {
  return addDays(date, -days);
};

export const isDateBefore = (date1: Date, date2: Date): boolean => {
  return date1.getTime() < date2.getTime();
};

export const isDateAfter = (date1: Date, date2: Date): boolean => {
  return date1.getTime() > date2.getTime();
};

export const getDaysDifference = (date1: Date, date2: Date): number => {
  const diffTime = date2.getTime() - date1.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// String helpers
export const generateUniqueFilename = (originalFilename: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalFilename.split('.').pop() || '';
  return `${timestamp}-${random}.${extension}`;
};

export const sanitizeFilename = (filename: string): string => {
  return filename.replace(/[^a-zA-Z0-9.-]/g, '_');
};

// Search helper
export const createSearchFilter = (
  search: string | undefined,
  fields: string[]
): object | undefined => {
  if (!search || search.trim() === '') {
    return undefined;
  }

  const searchTerm = search.trim();
  return {
    OR: fields.map((field) => ({
      [field]: {
        contains: searchTerm,
        mode: 'insensitive',
      },
    })),
  };
};

// Response helpers
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export const successResponse = <T>(data: T, message?: string): ApiResponse<T> => {
  return {
    success: true,
    data,
    message,
  };
};

export const errorResponse = (error: string, message?: string): ApiResponse<never> => {
  return {
    success: false,
    error,
    message,
  };
};

/**
 * Normalize file path for storage
 * Removes 'uploads/' prefix and converts backslashes to forward slashes
 */
export const normalizeFilePath = (filePath: string): string => {
  return filePath
    .replace(/\\/g, '/')        // Convert backslashes to forward slashes
    .replace(/^uploads\//, ''); // Remove uploads/ prefix
};
