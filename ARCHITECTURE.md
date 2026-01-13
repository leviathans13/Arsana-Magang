# ARSANA System Architecture

## System Overview

ARSANA is a modern web-based document archive management system designed for government offices to digitize and manage incoming and outgoing letters. The system replaces traditional manual spreadsheet-based tracking with a robust, scalable digital solution.

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js (v4.18.2)
- **Language**: TypeScript (v5.3.3)
- **Database**: PostgreSQL
- **ORM**: Prisma (v6.0.0)
- **Authentication**: JWT (jsonwebtoken v9.0.2)
- **Validation**: Zod (v3.22.4)
- **Security**: Helmet (v7.2.0), bcryptjs (v2.4.3)
- **File Upload**: Multer (v2.0.2)
- **Logging**: Winston (v3.11.0)
- **API Documentation**: Swagger (swagger-jsdoc + swagger-ui-express)
- **Task Scheduling**: node-cron (v3.0.3)

### Frontend
- **Framework**: Next.js (v15.5.3)
- **Language**: TypeScript (v5.2.2)
- **UI Library**: React (v18.3.1)
- **Styling**: Tailwind CSS (v3.3.3)
- **HTTP Client**: Axios (v1.5.1)
- **State Management**: React Query (v3.39.3)
- **Form Handling**: React Hook Form (v7.46.1)
- **Notifications**: React Hot Toast (v2.4.1)
- **Calendar**: FullCalendar (v6.1.19) + React DatePicker (v4.21.0)
- **Icons**: Lucide React (v0.279.0)

## Architecture Patterns

### Backend Architecture - Layered Architecture

```
┌─────────────────────────────────────────────┐
│            HTTP Request                      │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          Middleware Layer                    │
│  - Authentication                            │
│  - Validation (Zod)                          │
│  - Sanitization                              │
│  - Rate Limiting                             │
│  - Request Logging                           │
│  - File Upload (Multer)                      │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         Controller Layer                     │
│  - HTTP request/response handling            │
│  - Query parameter parsing                   │
│  - Response formatting                       │
│  - Delegates to service layer                │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          Service Layer                       │
│  - Business logic                            │
│  - Transaction management                    │
│  - Data validation                           │
│  - Cross-cutting concerns                    │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│          Data Layer (Prisma ORM)             │
│  - Database queries                          │
│  - Relations management                      │
│  - Type-safe operations                      │
└─────────────────┬───────────────────────────┘
                  │
┌─────────────────▼───────────────────────────┐
│         PostgreSQL Database                  │
└─────────────────────────────────────────────┘
```

### Service Layer Pattern

The service layer encapsulates business logic and provides these benefits:

1. **Separation of Concerns**: Controllers handle HTTP, services handle business logic
2. **Transaction Management**: Multi-step operations wrapped in database transactions
3. **Reusability**: Business logic can be called from multiple controllers
4. **Testability**: Business logic can be tested independently of HTTP layer

**Example Service**:
```typescript
class IncomingLetterService {
  async createIncomingLetter(data, userId, file) {
    // Use transaction for atomicity
    return await prisma.$transaction(async (tx) => {
      // 1. Create letter
      const letter = await tx.incomingLetter.create({...});
      
      // 2. Create calendar event if invitation
      if (data.isInvitation) {
        const event = await tx.calendarEvent.create({...});
        await createEventNotifications(...);
      }
      
      // 3. Create notification
      await tx.notification.create({...});
      
      return letter;
    });
  }
}
```

## Database Schema

### Core Entities

#### User
- Authentication and authorization
- Tracks who created each document
- Role-based access control (ADMIN, STAFF)

#### IncomingLetter
- Incoming correspondence tracking
- Event/invitation management
- Follow-up tracking
- Disposition routing

#### OutgoingLetter
- Outgoing correspondence tracking
- Classification and security levels
- Event management
- Srikandi integration

#### CalendarEvent
- Event scheduling
- Linked to letters (incoming/outgoing)
- Notification tracking (7-day, 3-day, 1-day reminders)

#### Notification
- User notifications
- Event reminders
- System notifications
- Read/unread status

### Key Relationships

```
User (1) ─────── (N) IncomingLetter
User (1) ─────── (N) OutgoingLetter
User (1) ─────── (N) CalendarEvent
User (1) ─────── (N) Notification

IncomingLetter (1) ─────── (0..N) CalendarEvent
OutgoingLetter (1) ─────── (0..N) CalendarEvent
CalendarEvent (1) ─────── (N) Notification
```

## Security Architecture

### Defense in Depth Strategy

```
┌─────────────────────────────────────────────┐
│     Layer 1: Network (HTTPS, CORS)          │
├─────────────────────────────────────────────┤
│     Layer 2: Rate Limiting                  │
├─────────────────────────────────────────────┤
│     Layer 3: Authentication (JWT)           │
├─────────────────────────────────────────────┤
│     Layer 4: Input Sanitization             │
├─────────────────────────────────────────────┤
│     Layer 5: Validation (Zod)               │
├─────────────────────────────────────────────┤
│     Layer 6: Authorization (Roles)          │
├─────────────────────────────────────────────┤
│     Layer 7: Database (Prisma - Safe)       │
└─────────────────────────────────────────────┘
```

### Security Features

1. **Input Sanitization**
   - XSS prevention through HTML entity encoding
   - SQL injection prevention (Prisma)
   - File name sanitization
   - URL validation

2. **Authentication & Authorization**
   - JWT-based authentication
   - Secure password hashing (bcrypt)
   - Role-based access control
   - Token expiration

3. **Rate Limiting**
   - Global API rate limiting (100 req/15min)
   - Login-specific limiting (20 req/15min)
   - Prevents brute force attacks

4. **Security Headers (Helmet)**
   - Content Security Policy (CSP)
   - XSS Protection
   - MIME Type Sniffing Prevention
   - Frame Options

5. **File Upload Security**
   - Type validation (whitelist)
   - Size limits (5MB)
   - MIME type checking
   - Secure file naming

## API Architecture

### RESTful Design

```
/api
├── /auth
│   ├── POST   /login
│   ├── POST   /register
│   └── GET    /me
├── /incoming-letters
│   ├── GET    /                    (list with filters)
│   ├── GET    /:id                 (get single)
│   ├── POST   /                    (create)
│   ├── PUT    /:id                 (update)
│   └── DELETE /:id                 (delete)
├── /outgoing-letters
│   ├── GET    /                    (list with filters)
│   ├── GET    /:id                 (get single)
│   ├── POST   /                    (create)
│   ├── PUT    /:id                 (update)
│   └── DELETE /:id                 (delete)
├── /calendar
│   ├── GET    /events              (with date range)
│   └── GET    /upcoming            (upcoming events)
├── /notifications
│   ├── GET    /                    (list)
│   ├── PUT    /:id/read            (mark as read)
│   └── PUT    /read-all            (mark all as read)
└── /files
    ├── GET    /:type/:id           (download)
    ├── GET    /:type/:id/preview   (preview)
    └── GET    /:type/:id/info      (file info)
```

### Response Format

All API responses follow a consistent format:

```typescript
// Success Response
{
  success: true,
  data: {...},
  message?: "Optional message"
}

// Error Response
{
  success: false,
  error: "Error message",
  message: "User-friendly message",
  details?: {...}  // Validation errors
}
```

## Frontend Architecture

### Page Structure (Next.js Pages Router)

```
/pages
├── /auth
│   ├── login.tsx
│   └── register.tsx
├── /dashboard
│   └── index.tsx
├── /letters
│   ├── /incoming
│   │   ├── index.tsx           (list)
│   │   ├── create.tsx          (create form)
│   │   └── [id]
│   │       ├── index.tsx       (detail)
│   │       └── edit.tsx        (edit form)
│   └── /outgoing
│       ├── index.tsx           (list)
│       ├── create.tsx          (create form)
│       └── [id]
│           ├── index.tsx       (detail)
│           └── edit.tsx        (edit form)
├── /calendar
│   └── index.tsx
└── /notifications
    └── index.tsx
```

### State Management

**React Query** for server state:
```typescript
// Fetch data
const { data, isLoading, error } = useIncomingLetters({ page, limit });

// Mutations
const createMutation = useCreateIncomingLetter();
await createMutation.mutateAsync(formData);

// Auto cache invalidation
queryClient.invalidateQueries(['incomingLetters']);
```

### Custom Hooks Pattern

```typescript
// Data fetching
useIncomingLetters()
useIncomingLetter(id)
useOutgoingLetters()
useNotifications()

// Mutations
useCreateIncomingLetter()
useUpdateIncomingLetter()
useDeleteIncomingLetter()

// Auth
useAuth()
```

## Data Flow

### Creating a Letter (Example)

```
1. User fills form
   └─> React Hook Form validation

2. Form submission
   └─> Convert to FormData (with file)

3. API call via Axios
   └─> POST /api/incoming-letters

4. Backend receives request
   ├─> Middleware chain:
   │   ├─> Rate limiting
   │   ├─> Authentication
   │   ├─> Input sanitization
   │   ├─> Validation (Zod)
   │   └─> File upload (Multer)
   │
   └─> Controller
       └─> Service Layer
           └─> Transaction:
               ├─> Create letter
               ├─> Create calendar event (if invitation)
               ├─> Create notifications
               └─> Commit transaction

5. Response sent
   └─> Controller formats response

6. Frontend receives response
   ├─> React Query cache update
   ├─> Success toast
   └─> Navigate to letter detail
```

## Background Jobs (Cron)

### Scheduled Tasks

```typescript
// Runs daily at 8:00 AM
cron.schedule('0 8 * * *', () => {
  checkUpcomingEvents();    // Check for events 7, 3, 1 days ahead
  checkOverdueFollowUps();  // Check for overdue follow-ups
});
```

**Event Notification Schedule**:
- H-7: 7 days before event
- H-3: 3 days before event
- H-1: 1 day before event

## Performance Optimizations

### Backend
1. **Parallel Queries**: Use `Promise.all()` for independent queries
2. **Selective Loading**: Use Prisma `select` and `include` to minimize data transfer
3. **Pagination**: All list endpoints support pagination
4. **Indexes**: Strategic database indexes on frequently queried fields

### Frontend
1. **React Query Caching**: 5-minute stale time for data
2. **Code Splitting**: Next.js automatic code splitting
3. **Optimistic Updates**: Immediate UI updates before server confirmation
4. **Image Optimization**: Next.js Image component

## Deployment Architecture

```
┌─────────────────────────────────────────────┐
│               Load Balancer                  │
└──────────┬──────────────────┬────────────────┘
           │                  │
┌──────────▼────────┐  ┌──────▼────────┐
│  Frontend Server  │  │ Backend Server │
│    (Next.js)      │  │  (Express.js)  │
│    Port 3000      │  │    Port 5000   │
└─────────────────── ┘  └───────┬────────┘
                                │
                        ┌───────▼────────┐
                        │   PostgreSQL   │
                        │   Database     │
                        └────────────────┘
```

### Environment Configuration

**Development**:
- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- Database: Local PostgreSQL

**Production**:
- Frontend: Vercel / Custom server
- Backend: Internal server
- Database: Managed PostgreSQL

## Monitoring & Logging

### Logging Levels
- **error**: Critical errors requiring immediate attention
- **warn**: Warning conditions
- **info**: Informational messages (default)
- **debug**: Detailed debugging information

### Log Structure
```json
{
  "level": "info",
  "message": "API request",
  "timestamp": "2026-01-13T10:30:00.000Z",
  "method": "POST",
  "url": "/api/incoming-letters",
  "statusCode": 201,
  "duration": 245
}
```

## Testing Strategy

### Backend Testing
- **Unit Tests**: Service layer logic
- **Integration Tests**: API endpoints
- **Security Tests**: CodeQL static analysis

### Frontend Testing
- **Unit Tests**: Utility functions
- **Component Tests**: React Testing Library
- **Integration Tests**: User flows

## Development Workflow

1. **Local Setup**
   ```bash
   # Install dependencies
   npm install
   
   # Setup database
   npx prisma generate
   npx prisma db push
   npx prisma db seed
   
   # Run development servers
   npm run dev
   ```

2. **Code Quality**
   ```bash
   # Lint code
   npm run lint
   
   # Build for production
   npm run build
   
   # Run tests
   npm run test
   ```

3. **Git Workflow**
   - Feature branches
   - Pull requests
   - Code review
   - CI/CD pipeline

## Future Enhancements

### Planned Features
- [ ] Email notifications
- [ ] Document versioning
- [ ] Advanced search with full-text
- [ ] Export to PDF/Excel
- [ ] Digital signatures
- [ ] Mobile app
- [ ] Real-time collaboration
- [ ] Audit log viewer

### Technical Improvements
- [ ] Response caching (Redis)
- [ ] GraphQL API option
- [ ] Microservices architecture
- [ ] Container orchestration (Kubernetes)
- [ ] Elasticsearch integration
- [ ] Real-time updates (WebSockets)

## Conclusion

ARSANA is built with modern web technologies following industry best practices. The layered architecture ensures maintainability, security, and scalability. The system successfully digitizes the manual document management process while providing additional features like automated notifications and calendar integration.

---

**Last Updated**: January 13, 2026
**Version**: 1.0.0
**Maintainer**: Development Team
