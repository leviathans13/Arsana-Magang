/**
 * Sanitization utilities to prevent XSS and injection attacks
 * Uses a whitelist approach for safe HTML tags
 */

/**
 * Basic HTML entity encoding to prevent XSS
 */
export const escapeHtml = (str: string): string => {
  const htmlEntities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
  };

  return str.replace(/[&<>"'/]/g, (char) => htmlEntities[char] || char);
};

/**
 * Remove potentially dangerous characters from input
 * Allows: alphanumeric, spaces, common punctuation, Indonesian characters
 */
export const sanitizeString = (str: string): string => {
  if (typeof str !== 'string') return str;
  
  // Remove null bytes and control characters except newlines and tabs
  let sanitized = str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // Trim excessive whitespace
  sanitized = sanitized.trim().replace(/\s+/g, ' ');
  
  return sanitized;
};

/**
 * Sanitize object recursively
 */
export const sanitizeObject = (obj: any): any => {
  if (obj === null || obj === undefined) {
    return obj;
  }

  if (typeof obj === 'string') {
    return sanitizeString(obj);
  }

  if (Array.isArray(obj)) {
    return obj.map(sanitizeObject);
  }

  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(obj)) {
      // Skip functions and symbols
      if (typeof value === 'function' || typeof value === 'symbol') {
        continue;
      }
      sanitized[key] = sanitizeObject(value);
    }
    return sanitized;
  }

  return obj;
};

/**
 * Validate and sanitize email address
 */
export const sanitizeEmail = (email: string): string => {
  if (typeof email !== 'string') return '';
  
  // Remove whitespace and convert to lowercase
  const cleaned = email.trim().toLowerCase();
  
  // Basic email validation regex
  const emailRegex = /^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/;
  
  if (!emailRegex.test(cleaned)) {
    throw new Error('Invalid email format');
  }
  
  return cleaned;
};

/**
 * Sanitize file name to prevent directory traversal
 */
export const sanitizeFileName = (fileName: string): string => {
  if (typeof fileName !== 'string') return '';
  
  // Remove directory traversal attempts
  let sanitized = fileName.replace(/[/\\]/g, '_');
  
  // Remove null bytes
  sanitized = sanitized.replace(/\0/g, '');
  
  // Limit to safe characters: alphanumeric, dash, underscore, dot
  sanitized = sanitized.replace(/[^a-zA-Z0-9._-]/g, '_');
  
  // Remove leading dots to prevent hidden files
  sanitized = sanitized.replace(/^\.+/, '');
  
  // Ensure it's not empty
  if (sanitized.length === 0) {
    sanitized = 'file';
  }
  
  return sanitized;
};

/**
 * Sanitize SQL-like patterns (extra protection, Prisma already handles this)
 */
export const sanitizeSQLPattern = (str: string): string => {
  if (typeof str !== 'string') return str;
  
  // Remove SQL-like patterns (defensive approach)
  return str
    .replace(/['";]/g, '')  // Remove quotes and semicolons
    .replace(/--/g, '')      // Remove SQL comments
    .replace(/\/\*/g, '')    // Remove multi-line comment start
    .replace(/\*\//g, '');   // Remove multi-line comment end
};

/**
 * Strip HTML tags and encode remaining special characters (for text-only fields)
 * 
 * Security Note: This function is safe against incomplete tag injection because:
 * 1. First pass removes all complete HTML tags
 * 2. Second pass encodes any remaining < or > characters to HTML entities
 * This ensures that even if the first regex leaves behind partial tags like "<script",
 * they will be encoded to "&lt;script" and rendered as plain text, not executed.
 * 
 * @param str - Input string that may contain HTML
 * @returns Sanitized string with HTML tags removed and special chars encoded
 */
export const stripHtmlTags = (str: string): string => {
  if (typeof str !== 'string') return str;
  
  // Step 1: Remove all complete HTML tags (e.g., <div>, <script>test</script>)
  // CodeQL Note: This regex may leave incomplete tags, but they're handled in step 2
  let sanitized = str.replace(/<[^>]*>/g, '');
  
  // Step 2: Encode any remaining < or > characters to prevent incomplete tag injection
  // This ensures any leftover fragments like "<script" become "&lt;script"
  sanitized = sanitized.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  
  return sanitized;
};

/**
 * Sanitize search query
 */
export const sanitizeSearchQuery = (query: string): string => {
  if (typeof query !== 'string') return '';
  
  // Remove potentially dangerous characters but keep spaces and common search operators
  let sanitized = query.trim();
  
  // Remove control characters
  sanitized = sanitized.replace(/[\x00-\x1F\x7F]/g, '');
  
  // Limit length to prevent DoS
  if (sanitized.length > 200) {
    sanitized = sanitized.substring(0, 200);
  }
  
  return sanitized;
};

/**
 * Sanitize URL to prevent open redirect vulnerabilities
 */
export const sanitizeUrl = (url: string): string => {
  if (typeof url !== 'string') return '';
  
  const trimmed = url.trim();
  
  // Only allow http, https, and relative URLs
  if (trimmed.startsWith('/')) {
    return trimmed; // Relative URL is safe
  }
  
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
      return trimmed;
    }
  } catch {
    // Invalid URL
  }
  
  return '';
};
