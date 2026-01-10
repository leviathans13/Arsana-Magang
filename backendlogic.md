1. CONFIGURATION FILES
src/config/env.ts
Logic: Validasi dan export environment variables menggunakan Zod
Validate DATABASE_URL, PORT, JWT_SECRET, dll
Throw error jika ada env yang tidak valid
Export typed config object

src/config/database.ts
Logic: Initialize dan export Prisma Client singleton
Import PrismaClient
Create single instance
Handle disconnect on app termination

src/config/constants.ts
Logic: Define semua konstanta aplikasi
Enum values (LetterClassification, LetterSource, NotificationType)
Disposisi options array
Security classification options
Default pagination values

2. MIDDLEWARES
src/middlewares/auth.middleware.ts
Logic: Verify JWT token dan attach user ke request
Extract token dari header Authorization: Bearer <token>
Verify menggunakan jwt.verify()
Query user dari database via user.repository.ts
Attach user object ke req.user
Jika gagal, throw 401 Unauthorized

src/middlewares/validate.middleware.ts
Logic: Validate request body/query/params dengan Zod schema
Higher-order function yang menerima zod schema
Parse request data dengan schema.parse()
Jika valid, lanjutkan ke next()
Jika tidak valid, return 400 dengan error details

src/middlewares/error.middleware.ts
Logic: Global error handler
Catch semua error dari routes
Format error response (status, message, details)
Log error menggunakan logger.ts
Return standardized error response

src/middlewares/upload.middleware.ts
Logic: Handle file upload dengan multer
Configure multer storage (disk storage ke folder uploads/)
File filter (hanya PDF, DOC, DOCX, JPG, PNG)
Size limit (max 5MB)
Generate unique filename dengan timestamp

src/middlewares/rateLimit.middleware.ts
Logic: Limit request rate per IP
Configure express-rate-limit
Max 100 requests per 15 menit untuk API umum
Max 5 requests per 15 menit untuk login

3. VALIDATORS (Zod Schemas)
src/validators/incoming-letter.validator.ts
Logic: Zod schemas untuk incoming letter CRUD

src/validators/outgoing-letter.validator.ts
Logic: Similar dengan incoming letter, tapi dengan field tambahan untuk surat keluar

src/validators/agenda.validator.ts
Logic: Validate agenda data
eventDate, eventTime, venue required
Validate date format

src/validators/auth.validator.ts
Logic: Validate login/register
Username min 3 chars
Email format valid
Password min 8 chars