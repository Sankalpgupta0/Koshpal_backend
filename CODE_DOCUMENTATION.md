# Koshpal Backend - Code Documentation

## Project Overview

Koshpal Backend is a comprehensive financial wellness platform API built with NestJS, providing services for employee financial management, HR administration, and financial coaching consultations.

## Technology Stack

- **Framework:** NestJS v11.0.1
- **Database:** PostgreSQL with Prisma ORM v6.19.1
- **Authentication:** JWT (JSON Web Tokens)
- **Queue:** BullMQ with Redis
- **Email:** Nodemailer
- **Rate Limiting:** @nestjs/throttler
- **Validation:** class-validator, class-transformer
- **Security:** bcryptjs for password hashing
- **API Documentation:** Postman Collection included

## Project Structure

```
koshpal-backend/
├── prisma/                      # Database schema and migrations
│   ├── schema.prisma           # Prisma schema with all models
│   ├── migrations/             # Database migration files
│   └── seed/                   # Database seeding scripts
│
├── src/
│   ├── auth/                   # Authentication module
│   │   ├── auth.controller.ts  # Login, logout, refresh tokens
│   │   ├── auth.service.ts     # Authentication logic
│   │   ├── dto/                # Data transfer objects
│   │   └── strategies/         # JWT and refresh token strategies
│   │
│   ├── common/                 # Shared utilities and configs
│   │   ├── config/            # Configuration files
│   │   ├── decorators/        # Custom decorators (@CurrentUser, @Roles)
│   │   ├── enums/             # Enums (Role, TransactionType, etc.)
│   │   ├── filters/           # Exception filters
│   │   ├── guards/            # Auth guards (JWT, Role-based)
│   │   ├── interceptors/      # Request/response interceptors
│   │   ├── logger/            # Custom logging service
│   │   └── types/             # TypeScript type definitions
│   │
│   ├── modules/
│   │   ├── admin/             # Admin management
│   │   │   └── companies/     # Company CRUD operations
│   │   │
│   │   ├── hr/                # HR management
│   │   │   └── employees/     # Employee CRUD, bulk upload
│   │   │
│   │   ├── employee/          # Employee portal
│   │   │   ├── profile/       # Employee profile management
│   │   │   └── goals/         # Financial goals CRUD
│   │   │
│   │   ├── consultation/      # Employee consultation booking
│   │   │   ├── consultation.controller.ts
│   │   │   ├── consultation.service.ts
│   │   │   ├── meeting.service.ts  # Google Meet link generation
│   │   │   └── dto/
│   │   │
│   │   ├── coach/             # Coach portal
│   │   │   ├── coach.controller.ts
│   │   │   ├── coach.service.ts
│   │   │   └── dto/
│   │   │
│   │   └── finance/           # Financial management
│   │       ├── accounts/      # Bank account management
│   │       ├── transactions/  # Transaction CRUD
│   │       └── insights/      # Financial insights & analytics
│   │
│   ├── mail/                  # Email service
│   │   ├── mail.service.ts    # Email sending logic
│   │   └── templates/         # HTML email templates
│   │
│   ├── queue/                 # Background job processing
│   │   └── processors/        # BullMQ job processors
│   │
│   ├── workers/               # Background workers
│   │   └── consultation-email.worker.ts
│   │
│   ├── app.module.ts          # Root application module
│   └── main.ts                # Application entry point
│
├── test/                      # E2E tests
├── .env.example              # Environment variables template
├── API_DOCUMENTATION_V1.md   # Complete API documentation
├── Koshpal-Complete-API.postman_collection.json
└── README.md                 # This file
```

## Key Features

### 1. Authentication & Authorization
- JWT-based authentication with refresh tokens
- Role-based access control (EMPLOYEE, HR, ADMIN, COACH)
- Rate limiting on sensitive endpoints
- Password encryption with bcrypt

### 2. Employee Portal
- Profile management
- Financial goal tracking
- Transaction management
- Spending insights and analytics
- Monthly budget management
- Consultation booking with coaches

### 3. HR Management
- Employee CRUD operations
- Bulk employee upload via CSV
- Company-specific employee management
- Employee profile updates

### 4. Admin Portal
- Company management
- HR account creation and management
- System-wide oversight

### 5. Coach Portal
- Availability slot management
- Consultation booking view
- Consultation statistics
- Profile management with expertise and ratings

### 6. Financial Management
- Multiple bank account support
- Income/Expense transaction tracking
- Category-wise spending analysis
- Monthly financial summaries
- Budget setting and tracking
- Spending insights and trends

### 7. Consultation System
- Coach listing with profiles
- Slot-based availability system
- Google Meet integration for video calls
- Email notifications via BullMQ queue
- Consultation history with filters (past, upcoming, thisWeek, thisMonth)
- Comprehensive statistics for both employees and coaches

## Database Models

### Core Models
- **User**: Base user account (Employee, HR, Admin, Coach)
- **EmployeeProfile**: Employee-specific information
- **CoachProfile**: Coach credentials and ratings
- **Company**: Organization details
- **Account**: Bank accounts
- **Transaction**: Financial transactions
- **MonthlySummary**: Monthly financial aggregations
- **FinancialGoal**: Goal tracking
- **CoachSlot**: Coach availability slots
- **ConsultationBooking**: Booked consultations

## API Endpoints Overview

### Authentication (`/api/v1/auth`)
- POST `/login` - User login
- POST `/refresh` - Refresh access token
- POST `/logout` - User logout
- GET `/me` - Get current user
- PATCH `/me/password` - Change password

### Admin (`/api/v1/admin`)
- Companies CRUD
- HR management

### HR (`/api/v1/hr`)
- Employee CRUD
- Bulk upload
- Employee management

### Employee (`/api/v1/employee`)
- Profile management
- Financial goals
- Transactions
- Insights & budget
- Coach viewing
- Consultation booking

### Coach (`/api/v1/coach`)
- Slot management
- Profile management
- Consultation viewing
- Statistics

## Environment Variables

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/koshpal

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=15m
REFRESH_TOKEN_SECRET=your-refresh-secret
REFRESH_TOKEN_EXPIRES_IN=7d

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# CORS
CORS_ORIGIN=http://localhost:5173

# Application
PORT=3000
NODE_ENV=development
```

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Setup database
npx prisma generate
npx prisma migrate dev

# Seed database (optional)
npm run seed
```

### Running the Application

```bash
# Development
npm run start:dev

# Production
npm run build
npm run start:prod

# Watch mode
npm run start:debug
```

### Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Code Documentation Guidelines

### Controller Documentation
Each controller endpoint should have:
- Brief description of functionality
- @param tags for all parameters
- @returns description
- @throws for possible exceptions
- @route showing the HTTP method and path
- @access indicating protection level
- @example for complex request bodies

### Service Documentation
Each service method should include:
- Purpose and functionality description
- Parameter descriptions
- Return value description
- Side effects (emails, notifications, etc.)
- Database transactions information

### Example:
```typescript
/**
 * Book Consultation
 * 
 * Books a consultation session between an employee and coach.
 * Generates meeting link and sends email notifications.
 * 
 * @param user - Authenticated employee user
 * @param dto - Booking details including slotId
 * @returns Booking confirmation with meeting link
 * @throws NotFoundException if slot doesn't exist
 * @throws BadRequestException if slot is not available
 * @route POST /api/v1/employee/consultations/book
 * @access Protected - Employee only
 */
async bookConsultation(user: ValidatedUser, dto: BookConsultationDto) {
  // Implementation
}
```

## Best Practices

### 1. Error Handling
- Use NestJS built-in exceptions
- Provide meaningful error messages
- Log errors for debugging

### 2. Validation
- Use class-validator decorators in DTOs
- Validate all input data
- Use Pipes for transformation

### 3. Security
- Hash passwords before storage
- Validate JWT tokens on protected routes
- Implement rate limiting on sensitive endpoints
- Use environment variables for secrets

### 4. Database Operations
- Use Prisma transactions for multi-step operations
- Index frequently queried fields
- Use select to fetch only needed data
- Implement soft deletes where appropriate

### 5. Async Operations
- Use BullMQ for background jobs (emails, notifications)
- Handle queue failures gracefully
- Implement retry logic for failed jobs

## Rate Limits

- **Default:** 2000 requests/minute
- **Authentication:** 100 requests/minute
- **Login:** 50 attempts/minute

## Common Issues & Solutions

### Issue: Prisma Client errors
**Solution:** Run `npx prisma generate` after schema changes

### Issue: Redis connection failed
**Solution:** Ensure Redis is running: `redis-server`

### Issue: Email not sending
**Solution:** Check SMTP credentials and enable "Less secure apps" for Gmail

### Issue: JWT token expired
**Solution:** Use refresh token endpoint to get new access token

## API Documentation

Complete API documentation is available in:
- **Markdown:** `API_DOCUMENTATION_V1.md`
- **Postman:** `Koshpal-Complete-API.postman_collection.json` (155 endpoints)

Import the Postman collection to test all endpoints with pre-configured requests.

## Contributing

1. Follow the existing code structure
2. Add JSDoc comments for all public methods
3. Write unit tests for new features
4. Update API documentation for new endpoints
5. Run linter before committing: `npm run lint`

## Support

For questions or issues:
- Email: dev@koshpal.com
- Documentation: [API_DOCUMENTATION_V1.md](./API_DOCUMENTATION_V1.md)

## License

Proprietary - Koshpal Technologies Pvt Ltd

---

**Last Updated:** December 17, 2025  
**Version:** 1.0.0
