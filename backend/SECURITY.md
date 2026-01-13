# Security Implementation Guide for ARSANA

This document outlines the security measures implemented in the ARSANA mail management system.

## 🔒 Security Features Implemented

### 1. Input Sanitization
**Location**: `backend/src/middlewares/sanitize.middleware.ts`

- **XSS Prevention**: All user inputs are sanitized to remove malicious scripts
- **Injection Prevention**: SQL-like patterns are stripped (defense-in-depth)
- **File Name Sanitization**: Prevents directory traversal attacks
- **Recursive Sanitization**: All nested objects and arrays are sanitized

**Applied to**:
- Request body
- Query parameters
- URL parameters
- File uploads (metadata only)

### 2. Authentication & Authorization
**Location**: `backend/src/middlewares/auth.middleware.ts`

- **JWT-based Authentication**: Secure token-based auth
- **Token Verification**: All protected routes verify JWT tokens
- **User Context**: Authenticated user attached to request
- **Role-based Access**: Admin middleware for restricted operations

**Best Practices**:
- Tokens expire after configured time (default: 7 days)
- Tokens are verified on every request
- Invalid tokens result in 401 Unauthorized
- User existence is verified from database

### 3. Rate Limiting
**Location**: `backend/src/middlewares/rateLimit.middleware.ts`

- **API Rate Limiting**: 100 requests per 15 minutes per IP
- **Login Rate Limiting**: 20 login attempts per 15 minutes per IP
- **Sensitive Operations**: Additional rate limiting for critical operations

**Purpose**: Prevent brute force attacks and DoS

### 4. Secure Headers (Helmet)
**Location**: `backend/src/app.ts`

- **Content Security Policy (CSP)**: Restricts resource loading
- **XSS Protection**: X-XSS-Protection header
- **No Sniffing**: X-Content-Type-Options
- **Frame Protection**: X-Frame-Options
- **HTTPS Enforcement**: Strict-Transport-Security (production)

### 5. CORS Configuration
**Location**: `backend/src/app.ts`

- **Origin Restriction**: Only configured frontend URL allowed
- **Credentials Support**: Cookies and auth headers allowed
- **Method Restriction**: Only necessary HTTP methods enabled
- **Header Restriction**: Only allowed headers accepted

**Configuration**:
```typescript
cors({
  origin: config.frontendUrl,  // Only allow frontend
  credentials: true,           // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
})
```

### 6. File Upload Security
**Location**: `backend/src/middlewares/upload.middleware.ts`

- **File Size Limit**: 5MB maximum per file
- **File Type Validation**: Only PDF, DOC, DOCX, JPG, PNG allowed
- **MIME Type Checking**: Validates actual file type
- **Unique File Names**: Prevents file overwrite attacks
- **Directory Separation**: Incoming and outgoing files stored separately

### 7. Database Security

#### Prisma ORM Protection
- **Prepared Statements**: All queries use parameterized statements
- **SQL Injection Prevention**: Built-in protection by Prisma
- **Type Safety**: TypeScript ensures type correctness

#### Transaction Support
**Location**: Service layer (e.g., `backend/src/services/incomingLetterService.ts`)

- **Atomic Operations**: Multi-step operations wrapped in transactions
- **Rollback on Error**: Automatic rollback on failure
- **Data Consistency**: Ensures database integrity

**Example**:
```typescript
await prisma.$transaction(async (tx) => {
  // Create letter
  const letter = await tx.incomingLetter.create({...});
  
  // Create calendar event
  const event = await tx.calendarEvent.create({...});
  
  // Create notifications
  await tx.notification.create({...});
});
```

### 8. Error Handling
**Location**: `backend/src/middlewares/error.middleware.ts`

- **Centralized Error Handler**: Single point for error processing
- **Sensitive Data Protection**: Stack traces only in development
- **Structured Logging**: All errors logged with context
- **Custom Error Classes**: Type-safe error handling

**Error Classes**:
- `ApiError`: Base error class
- `NotFoundError`: Resource not found (404)
- `ValidationError`: Input validation failed (400)
- `UnauthorizedError`: Auth required (401)
- `ForbiddenError`: Access denied (403)
- `ConflictError`: Resource conflict (409)

### 9. Logging & Monitoring
**Location**: `backend/src/utils/logger.ts`

- **Structured Logging**: Winston-based logging
- **Log Levels**: error, warn, info, debug
- **Request Logging**: All API requests logged
- **Error Logging**: Detailed error information captured
- **Production Safety**: No sensitive data in logs

### 10. Environment Variables
**Location**: `backend/src/config/env.ts`

- **Schema Validation**: Zod validates all env vars on startup
- **Type Safety**: Typed configuration object
- **Required Variables**: Application fails fast if missing
- **Secure Defaults**: Safe default values where applicable

**Required Variables**:
```bash
DATABASE_URL=postgresql://...
JWT_SECRET=<minimum 32 characters>
FRONTEND_URL=http://localhost:3000
```

## 🛡️ Security Best Practices

### For Developers

1. **Never Trust User Input**
   - Always validate and sanitize input
   - Use Zod schemas for validation
   - Sanitization is automatic but be aware of edge cases

2. **Use Service Layer**
   - Business logic in service layer
   - Use transactions for multi-step operations
   - Controllers should be thin

3. **Error Handling**
   - Use async/await with asyncHandler
   - Throw custom error classes
   - Never expose internal errors to clients

4. **Authentication**
   - Always use authMiddleware for protected routes
   - Use adminMiddleware for admin-only routes
   - Never hardcode credentials

5. **File Uploads**
   - Always validate file type and size
   - Use provided upload middleware
   - Store files outside web root

### For Deployment

1. **Environment Variables**
   - Use strong JWT secret (min 32 chars)
   - Set NODE_ENV=production
   - Use HTTPS in production
   - Configure proper CORS origin

2. **Database**
   - Use connection pooling
   - Regular backups
   - Encrypt data at rest
   - Use SSL/TLS for connections

3. **Monitoring**
   - Enable file logging in production
   - Set up error monitoring (e.g., Sentry)
   - Monitor rate limit hits
   - Regular security audits

## 🔐 Security Checklist

- [x] Input sanitization on all endpoints
- [x] JWT authentication
- [x] Role-based authorization
- [x] Rate limiting
- [x] Secure headers (Helmet)
- [x] CORS configuration
- [x] File upload validation
- [x] SQL injection prevention (Prisma)
- [x] XSS prevention
- [x] Transaction support
- [x] Centralized error handling
- [x] Structured logging
- [x] Environment validation
- [ ] HTTPS enforcement (deployment)
- [ ] Security headers in production
- [ ] Regular dependency updates
- [ ] Security audits
- [ ] Penetration testing

## 📚 Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Prisma Security Best Practices](https://www.prisma.io/docs/guides/security)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)

## 🚨 Reporting Security Issues

If you discover a security vulnerability, please report it to:
- Email: [security contact]
- Do not create public issues for security vulnerabilities

## 📝 Security Updates

This document should be updated whenever new security features are added or existing ones are modified.

Last Updated: 2026-01-13
