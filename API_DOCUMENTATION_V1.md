# Koshpal Backend API Documentation V1

**Version:** 2.0.0  
**Base URL:** `http://localhost:3000` (Development) | `https://api.koshpal.com` (Production)  
**Last Updated:** December 27, 2025

## Table of Contents
1. [Authentication](#authentication)
2. [Health Check](#health-check)
3. [Admin Portal](#admin-portal)
4. [HR Management](#hr-management)
5. [Employee Portal](#employee-portal)
6. [Financial Goals](#financial-goals)
7. [Accounts Management](#accounts-management)
8. [Transactions Management](#transactions-management)
9. [Insights & Budget](#insights--budget)
10. [Coach Portal](#coach-portal)
11. [Employee Consultations](#employee-consultations)
12. [Rate Limits](#rate-limits)
13. [Data Models](#data-models)
14. [Validation Rules](#validation-rules)
15. [Error Handling](#error-handling)
16. [Security Features](#security-features)
17. [Best Practices](#best-practices)
18. [Webhooks & Background Jobs](#webhooks--background-jobs)
19. [Environment Variables](#environment-variables)
20. [Deployment Checklist](#deployment-checklist)
21. [API Versioning](#api-versioning)
22. [Support & Resources](#support--resources)

---

## Authentication

All authentication endpoints are located under `/api/v1/auth` route.

### 1.1 Login
**POST** `/api/v1/auth/login`

Authenticate user and receive access tokens. Supports all roles: EMPLOYEE, HR, ADMIN, COACH.

**Rate Limit:** 50 requests per minute  
**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Headers (Optional):**
- `X-Device-ID`: Device identifier for session tracking

**Response:** `200 OK`
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "EMPLOYEE",
    "companyId": "uuid",
    "isActive": true
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded

**Security Features:**
- Tracks device info (IP, User-Agent, Device ID)
- Stores refresh token in database for session management
- Rate limited to prevent brute force attacks
- Access tokens expire in 15 minutes
- Refresh tokens expire in 7 days

---

### 1.2 Get Current User
**GET** `/api/v1/auth/me`

Get currently authenticated user's information from JWT token.

**Headers:** `Authorization: Bearer {accessToken}`  
**Access:** Protected (All Roles)

**Response:** `200 OK`
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "EMPLOYEE",
  "companyId": "uuid"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired token

---

### 1.3 Refresh Access Token
**POST** `/api/v1/auth/refresh`

Generate new access token using refresh token. Allows users to stay logged in without re-entering credentials frequently.

**Access:** Public

**Request Body:**
```json
{
  "refreshToken": "refresh-token-string"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "new-jwt-access-token"
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid or expired refresh token

**Token Lifetimes:**
- Access Token: 15 minutes
- Refresh Token: 7 days

---

### 1.4 Logout
**POST** `/api/v1/auth/logout`

Logout user and revoke refresh token from database.

**Headers:** `Authorization: Bearer {accessToken}`  
**Access:** Protected (All Roles)

**Request Body:**
```json
{
  "refreshToken": "refresh-token-string"
}
```

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

**Note:** Revokes the refresh token in database. Client should delete stored tokens after receiving this response.

---

### 1.5 Get Active Sessions
**GET** `/api/v1/auth/sessions`

Get all active sessions for current user. Shows all devices where the user is logged in with details about each session.

**Headers:** `Authorization: Bearer {accessToken}`  
**Access:** Protected (All Roles)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "deviceId": "device-123",
    "deviceName": "Chrome on macOS",
    "ipAddress": "192.168.1.1",
    "location": "Mumbai, India",
    "userAgent": "Mozilla/5.0...",
    "lastActivity": "2025-12-27T10:00:00.000Z",
    "createdAt": "2025-12-25T08:00:00.000Z"
  }
]
```

**Use Cases:**
- View all active login sessions
- Identify suspicious activity
- Manage device access

---

### 1.6 Revoke All Sessions
**POST** `/api/v1/auth/sessions/revoke-all`

Logout from all devices by revoking all active sessions. Useful for security incidents or after password changes.

**Headers:** `Authorization: Bearer {accessToken}`  
**Access:** Protected (All Roles)

**Response:** `200 OK`
```json
{
  "message": "All sessions revoked successfully",
  "revokedCount": 3
}
```

**Use Cases:**
- After password change
- Security incident response
- Lost device scenario
- Suspicious activity detected

---

### 1.7 Change Password
**PATCH** `/api/v1/auth/me/password`

Change password for authenticated user. Requires current password verification.

**Headers:** `Authorization: Bearer {accessToken}`  
**Access:** Protected (All Roles)

**Request Body:**
```json
{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword456"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password changed successfully. All sessions have been revoked. Please log in again."
}
```

**Error Responses:**
- `401 Unauthorized` - Current password is incorrect
- `400 Bad Request` - New password doesn't meet requirements (min 8 characters)

**Security Note:** Automatically revokes all sessions after password change. User must log in again with new password on all devices.

---

### 1.8 Forgot Password
**POST** `/api/v1/auth/forgot-password`

Request password reset link via email. Generates a secure, single-use token with 15-minute expiry.

**Rate Limit:** 5 requests per 15 minutes  
**Access:** Public

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Response:** `200 OK`
```json
{
  "message": "If an account with that email exists, a password reset link has been sent."
}
```

**Security Features:**
- Always returns success message (prevents email enumeration)
- Token expires in 15 minutes
- Single-use token
- Rate limited to prevent spam
- Email sent only if account exists

---

### 1.9 Reset Password
**POST** `/api/v1/auth/reset-password`

Reset password using token received via email. Token is single-use and expires after 15 minutes.

**Rate Limit:** 10 requests per 15 minutes  
**Access:** Public

**Request Body:**
```json
{
  "token": "reset-token-from-email",
  "newPassword": "newSecurePassword123"
}
```

**Response:** `200 OK`
```json
{
  "message": "Password reset successfully. All sessions have been revoked. Please log in with your new password."
}
```

**Error Responses:**
- `401 Unauthorized` - Token is invalid, expired, or already used
- `400 Bad Request` - Password doesn't meet requirements

**Security Features:**
- Token must exist in database
- Token must not be used
- Token must not be expired (15 min)
- Single-use only
- All sessions are revoked after reset
- Password is hashed with bcrypt

---

## Health Check

### 2.1 Health Check
**GET** `/api/v1/health`

Check if the API is running.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "timestamp": "2025-12-17T10:00:00.000Z"
}
```

---

### 2.2 Database Health
**GET** `/api/v1/health/db`

Check database connection status.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "database": "connected"
}
```

---

### 2.3 Redis Health
**GET** `/api/v1/health/redis`

Check Redis connection status.

**Response:** `200 OK`
```json
{
  "status": "ok",
  "redis": "connected"
}
```

---

## Admin Portal

### 3.1 Create Company
**POST** `/api/v1/admin/companies`

Create a new company.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

**Request Body:**
```json
{
  "name": "Tech Corp",
  "domain": "techcorp.com",
  "address": "123 Main St",
  "contactEmail": "hr@techcorp.com"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "name": "Tech Corp",
  "domain": "techcorp.com",
  "createdAt": "2025-12-17T10:00:00.000Z"
}
```

---

### 3.2 Get All Companies
**GET** `/api/v1/admin/companies`

List all companies in the system.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "name": "Tech Corp",
    "domain": "techcorp.com",
    "employeeCount": 50,
    "createdAt": "2025-12-17T10:00:00.000Z"
  }
]
```

---

### 3.3 Get Company Details
**GET** `/api/v1/admin/companies/:companyId`

Get detailed information about a specific company.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Tech Corp",
  "domain": "techcorp.com",
  "address": "123 Main St",
  "contactEmail": "hr@techcorp.com",
  "employees": [],
  "hrs": []
}
```

---

### 3.4 Update Company Status
**PATCH** `/api/v1/admin/companies/:id/status`

Update company status (active/inactive).

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

**Request Body:**
```json
{
  "isActive": false
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "isActive": false,
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

---

### 3.5 Update Company Limits
**PATCH** `/api/v1/admin/companies/:id/limits`

Update company employee and HR limits.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

**Request Body:**
```json
{
  "maxEmployees": 500,
  "maxHrs": 10
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "maxEmployees": 500,
  "maxHrs": 10,
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

---

### 3.6 Create HR
**POST** `/api/v1/admin/hrs`

Create a new HR account.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

**Request Body:**
```json
{
  "email": "hr@techcorp.com",
  "password": "SecurePass123!",
  "companyId": "uuid",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "hr@techcorp.com",
  "role": "HR",
  "companyId": "uuid",
  "createdAt": "2025-12-19T10:00:00.000Z"
}
```

---

### 3.7 Get All HRs
**GET** `/api/v1/admin/hrs`

List all HR accounts in the system.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "email": "hr@techcorp.com",
    "role": "HR",
    "companyId": "uuid",
    "isActive": true,
    "company": {
      "id": "uuid",
      "name": "Tech Corp"
    },
    "createdAt": "2025-12-19T10:00:00.000Z"
  }
]
```

---

### 3.8 Get HR Details
**GET** `/api/v1/admin/hrs/:id`

Get detailed information about a specific HR account.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "hr@techcorp.com",
  "role": "HR",
  "companyId": "uuid",
  "isActive": true,
  "company": {
    "id": "uuid",
    "name": "Tech Corp",
    "domain": "techcorp.com"
  },
  "createdAt": "2025-12-19T10:00:00.000Z"
}
```

---

### 3.9 Update HR Status
**PATCH** `/api/v1/admin/hrs/:id/status`

Update HR account status (active/inactive). Inactive HRs cannot log in.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`  
**Access:** Protected (Admin only)

**Request Body:**
```json
{
  "isActive": false
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "isActive": false,
  "updatedAt": "2025-12-27T10:00:00.000Z"
}
```

---

## Coach Management (Admin)

### 3.10 Get All Coaches
**GET** `/api/v1/admin/coaches`

Returns list of all coaches with their profiles and statistics. Includes both active and inactive coaches.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`  
**Access:** Protected (Admin only)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "email": "coach@koshpal.com",
    "isActive": true,
    "role": "COACH",
    "coachProfile": {
      "firstName": "Sarah",
      "lastName": "Johnson",
      "bio": "Certified financial coach with 10 years experience",
      "expertise": ["Debt Management", "Investment Planning"],
      "phoneNumber": "+1234567890",
      "photoUrl": "https://...",
      "averageRating": 4.8,
      "totalRatings": 42
    },
    "statistics": {
      "totalSlots": 120,
      "totalConsultations": 95,
      "upcomingConsultations": 5
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### 3.11 Get Coach Details
**GET** `/api/v1/admin/coaches/:id`

Returns detailed information about a specific coach including:
- User account status
- Complete coach profile
- Detailed statistics (slots created, consultations conducted, ratings)

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`  
**Access:** Protected (Admin only)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "coach@koshpal.com",
  "isActive": true,
  "role": "COACH",
  "lastLogin": "2025-12-27T08:00:00.000Z",
  "coachProfile": {
    "id": "uuid",
    "firstName": "Sarah",
    "lastName": "Johnson",
    "bio": "Certified financial coach with 10 years experience",
    "expertise": ["Debt Management", "Investment Planning", "Retirement Planning"],
    "phoneNumber": "+1234567890",
    "photoUrl": "https://storage.example.com/coaches/sarah.jpg",
    "linkedinUrl": "https://linkedin.com/in/sarahjohnson",
    "certifications": ["CFP", "AFC"],
    "averageRating": 4.8,
    "totalRatings": 42,
    "yearsOfExperience": 10
  },
  "statistics": {
    "totalSlots": 120,
    "availableSlots": 15,
    "bookedSlots": 10,
    "totalConsultations": 95,
    "completedConsultations": 90,
    "cancelledConsultations": 5,
    "upcomingConsultations": 5,
    "totalMinutesConducted": 4500
  },
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-12-27T10:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Coach doesn't exist

---

### 3.12 Deactivate Coach
**PATCH** `/api/v1/admin/coaches/:id/deactivate`

Deactivates a coach account. Sets `isActive = false` for the coach user account.

**Important Effects:**
- Coach cannot log in (blocked by authentication guards)
- Coach cannot create new slots
- Coach cannot access any protected endpoints
- Existing consultations are NOT cancelled automatically
- Admin should handle consultation cancellations separately if needed

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`  
**Access:** Protected (Admin only)

**Request Body:**
```json
{
  "reason": "Performance issues" 
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "coach@koshpal.com",
  "isActive": false,
  "deactivatedAt": "2025-12-27T10:00:00.000Z",
  "deactivationReason": "Performance issues",
  "message": "Coach account deactivated successfully"
}
```

**Error Responses:**
- `404 Not Found` - Coach doesn't exist
- `400 Bad Request` - Coach already inactive

---

### 3.13 Reactivate Coach
**PATCH** `/api/v1/admin/coaches/:id/reactivate`

Reactivates a previously deactivated coach account. Sets `isActive = true`, allowing coach to log in and access the system again.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`  
**Access:** Protected (Admin only)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "coach@koshpal.com",
  "isActive": true,
  "reactivatedAt": "2025-12-27T10:00:00.000Z",
  "message": "Coach account reactivated successfully"
}
```

**Error Responses:**
- `404 Not Found` - Coach doesn't exist
- `400 Bad Request` - Coach already active

---

### 3.14 Get Platform Stats
**GET** `/api/v1/admin/stats`

Get platform-wide statistics for admin dashboard.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`  
**Access:** Protected (Admin only)

**Response:** `200 OK`
```json
{
  "totalCompanies": 50,
  "totalEmployees": 2500,
  "totalHrs": 75,
  "totalCoaches": 20,
  "activeCompanies": 48,
  "totalTransactions": 150000,
  "totalConsultations": 1200
}
```

---

## HR Management

### 4.1 Upload Employees
**POST** `/api/v1/hr/employees/upload`

Upload employees via CSV file.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Request:** `multipart/form-data`
- `file`: CSV file with employee data

**CSV Format:**
```csv
email,password,firstName,lastName,dateOfBirth,gender,phoneNumber,address,salary,position,department,hireDate
john@techcorp.com,Pass123!,John,Doe,1990-01-01,MALE,+1234567890,123 St,75000,Engineer,IT,2025-01-01
```

**Response:** `201 Created`
```json
{
  "message": "Upload started",
  "batchId": "uuid",
  "status": "PROCESSING"
}
```

**Note:** The upload is processed asynchronously via a queue. Check upload status using the batch ID.

---

### 4.2 Get All Uploads
**GET** `/api/v1/hr/uploads`

Get all employee upload batches for the HR's company.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "filename": "employees_2025.csv",
    "status": "COMPLETED",
    "totalRows": 50,
    "successCount": 48,
    "failureCount": 2,
    "uploadedBy": "hr@techcorp.com",
    "uploadedAt": "2025-12-19T10:00:00.000Z"
  }
]
```

**Status Values:**
- `PENDING`: Upload received, waiting to process
- `PROCESSING`: Currently processing rows
- `COMPLETED`: All rows processed
- `FAILED`: Upload failed

---

### 4.3 Get Upload Status
**GET** `/api/v1/hr/uploads/:batchId`

Get detailed status of a specific upload batch.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "filename": "employees_2025.csv",
  "status": "COMPLETED",
  "totalRows": 50,
  "successCount": 48,
  "failureCount": 2,
  "errorDetails": [
    {
      "row": 5,
      "email": "duplicate@techcorp.com",
      "error": "Email already exists"
    },
    {
      "row": 12,
      "email": "invalid@",
      "error": "Invalid email format"
    }
  ],
  "uploadedAt": "2025-12-19T10:00:00.000Z",
  "completedAt": "2025-12-19T10:05:00.000Z"
}
```

---

### 4.4 Get All Employees
**GET** `/api/v1/hr/employees`

List all employees in HR's company.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "email": "employee@techcorp.com",
    "isActive": true,
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "position": "Software Engineer",
      "department": "Engineering",
      "salary": 75000
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### 4.5 Get Employee Details
**GET** `/api/v1/hr/employees/:id`

Get detailed information about a specific employee.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "employee@techcorp.com",
  "isActive": true,
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "gender": "MALE",
    "phoneNumber": "+1234567890",
    "address": "123 St",
    "salary": 75000,
    "position": "Software Engineer",
    "department": "Engineering",
    "hireDate": "2025-01-01T00:00:00.000Z"
  },
  "accounts": [],
  "transactions": [],
  "createdAt": "2025-01-01T00:00:00.000Z"
}
```

---

### 4.6 Update Employee Status
**PATCH** `/api/v1/hr/employees/:id/status`

Update employee status (active/inactive).

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Request Body:**
```json
{
  "isActive": false
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "isActive": false,
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

---

### 4.7 Get Departments List
**GET** `/api/v1/hr/employees/departments/list`

Get list of all departments in the HR's company.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
[
  "Engineering",
  "Sales",
  "Marketing",
  "Human Resources",
  "Finance"
]
```

---

### 4.8 Get Company Insights Summary
**GET** `/api/v1/hr/insights/summary`

Get aggregated financial insights for all employees in the HR's company.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
{
  "totalEmployees": 50,
  "activeEmployees": 48,
  "totalSalaryExpenditure": 3750000,
  "averageSalary": 75000,
  "totalTransactions": 5000,
  "totalIncome": 3750000,
  "totalExpenses": 2500000,
  "averageSavingsRate": 33.33,
  "topSpendingCategories": [
    {
      "category": "Groceries",
      "totalAmount": 400000,
      "percentage": 16
    }
  ]
}
```

---

### 4.9 Get Dashboard Stats
**GET** `/api/v1/hr/dashboard/stats`

Get key statistics for HR dashboard.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
{
  "totalEmployees": 50,
  "activeEmployees": 48,
  "financiallyHealthyEmployees": 30,
  "atRiskEmployees": 15,
  "programParticipation": 85.5,
  "averageSavingsRate": 25.3,
  "totalConsultationsThisMonth": 45
}
```

---

### 4.10 Get Financial Health Distribution
**GET** `/api/v1/hr/dashboard/financial-health`

Get distribution of employees by financial health status.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
{
  "healthy": 30,
  "moderate": 15,
  "atRisk": 5,
  "total": 50
}
```

---

### 4.11 Get Participation by Department
**GET** `/api/v1/hr/dashboard/participation-by-department`

Get program participation statistics broken down by department.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
[
  {
    "department": "Engineering",
    "totalEmployees": 20,
    "activeParticipants": 18,
    "participationRate": 90.0
  },
  {
    "department": "Sales",
    "totalEmployees": 15,
    "activeParticipants": 12,
    "participationRate": 80.0
  }
]
```

---

### 4.12 Get Dashboard Alerts
**GET** `/api/v1/hr/dashboard/alerts`

Get important alerts and notifications for HR dashboard.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
[
  {
    "type": "WARNING",
    "message": "5 employees showing declining savings rate",
    "priority": "HIGH",
    "timestamp": "2025-12-19T10:00:00.000Z"
  },
  {
    "type": "INFO",
    "message": "Upload batch completed successfully",
    "priority": "MEDIUM",
    "timestamp": "2025-12-19T09:30:00.000Z"
  }
]
```

---

### 4.13 Get HR Profile
**GET** `/api/v1/hr/profile`

Get HR's own profile information.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "hr@techcorp.com",
  "fullName": "John Doe",
  "phone": "+1234567890",
  "designation": "HR Manager",
  "companyId": "uuid",
  "company": {
    "name": "Tech Corp",
    "domain": "techcorp.com"
  }
}
```

---

### 4.14 Update HR Profile
**PATCH** `/api/v1/hr/profile`

Update HR's profile information.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Request Body:**
```json
{
  "fullName": "John Smith",
  "phone": "+1234567899",
  "designation": "Senior HR Manager"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "fullName": "John Smith",
  "phone": "+1234567899",
  "designation": "Senior HR Manager"
}
```

---

## Employee Portal

All employee-specific endpoints are located under `/api/v1/employee` route.

### 5.1 Get My Profile (Enhanced)
**GET** `/api/v1/employee/me`

Get comprehensive employee profile with full data including user details, employee profile, company information, and statistics.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
{
  "user": {
    "id": "uuid",
    "email": "employee@techcorp.com",
    "role": "EMPLOYEE",
    "isActive": true,
    "lastLogin": "2025-12-27T08:00:00.000Z",
    "createdAt": "2025-01-01T00:00:00.000Z"
  },
  "profile": {
    "id": "uuid",
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01T00:00:00.000Z",
    "gender": "MALE",
    "phoneNumber": "+1234567890",
    "address": "123 Main St, Mumbai",
    "salary": 75000,
    "position": "Software Engineer",
    "department": "Engineering",
    "hireDate": "2025-01-01T00:00:00.000Z"
  },
  "company": {
    "id": "uuid",
    "name": "Tech Corp",
    "domain": "techcorp.com"
  },
  "statistics": {
    "totalAccounts": 3,
    "totalBalance": 125000,
    "activeGoals": 2,
    "completedGoals": 1,
    "goalsProgress": 65.5,
    "totalConsultations": 5,
    "upcomingConsultations": 1,
    "completedConsultations": 4
  }
}
```

**Error Responses:**
- `404 Not Found` - Employee profile doesn't exist
- `401 Unauthorized` - Invalid token

---

## Accounts Management

### 5.2 Get My Accounts
**GET** `/api/v1/employee/accounts`

Get all financial accounts for logged-in employee.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "accountName": "HDFC Savings",
    "provider": "HDFC Bank",
    "maskedAccountNo": "****1234",
    "accountType": "SAVINGS",
    "balance": 50000,
    "currency": "INR",
    "isActive": true,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-12-27T00:00:00.000Z"
  },
  {
    "id": "uuid2",
    "accountName": "ICICI Credit Card",
    "provider": "ICICI Bank",
    "maskedAccountNo": "****5678",
    "accountType": "CREDIT_CARD",
    "balance": -5000,
    "creditLimit": 100000,
    "currency": "INR",
    "isActive": true,
    "createdAt": "2025-02-01T00:00:00.000Z"
  }
]
```

**Account Types:**
- `SAVINGS` - Savings account
- `CURRENT` - Current account
- `CREDIT_CARD` - Credit card
- `WALLET` - Digital wallet
- `INVESTMENT` - Investment account

---

### 5.3 Create Account
**POST** `/api/v1/employee/accounts`

Create a new financial account for the employee.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Request Body:**
```json
{
  "accountName": "ICICI Savings",
  "provider": "ICICI Bank",
  "maskedAccountNo": "****5678",
  "accountType": "SAVINGS",
  "balance": 75000,
  "currency": "INR",
  "creditLimit": null
}
```

**Validation Rules:**
- `accountName`: Required, max 100 characters
- `provider`: Required, max 100 characters
- `maskedAccountNo`: Required, format: ****XXXX
- `accountType`: Required, one of: SAVINGS, CURRENT, CREDIT_CARD, WALLET, INVESTMENT
- `balance`: Required, number
- `currency`: Optional, default INR
- `creditLimit`: Required for CREDIT_CARD type

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "accountName": "ICICI Savings",
  "provider": "ICICI Bank",
  "maskedAccountNo": "****5678",
  "accountType": "SAVINGS",
  "balance": 75000,
  "currency": "INR",
  "createdAt": "2025-12-27T00:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `409 Conflict` - Account with same details already exists

---

### 5.4 Update Account
**PATCH** `/api/v1/employee/accounts/:id`

Update an existing account. Only the employee who owns the account can update it.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Request Body:**
```json
{
  "accountName": "ICICI Salary Account",
  "balance": 80000,
  "isActive": true
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "accountName": "ICICI Salary Account",
  "balance": 80000,
  "isActive": true,
  "updatedAt": "2025-12-27T00:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Account doesn't exist or doesn't belong to user
- `400 Bad Request` - Validation error

---

### 5.5 Delete Account
**DELETE** `/api/v1/employee/accounts/:id`

Delete an account. This will also delete all associated transactions.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

**Warning:** This action is irreversible and will delete all transactions associated with this account.

**Error Responses:**
- `404 Not Found` - Account doesn't exist or doesn't belong to user

---

## Transactions Management

### 5.6 Get My Transactions
**GET** `/api/v1/employee/transactions`

Get all transactions for logged-in employee with optional filters.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Query Parameters:**
- `accountId` (optional): Filter by account ID (UUID)
- `type` (optional): Filter by type - `INCOME` or `EXPENSE`
- `category` (optional): Filter by category (string)

**Response:** `200 OK`
```json
{
  "transactions": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "account": {
        "accountName": "HDFC Savings",
        "provider": "HDFC Bank"
      },
      "amount": 1500,
      "type": "EXPENSE",
      "category": "Food & Dining",
      "subCategory": "Groceries",
      "description": "Weekly shopping at Big Bazaar",
      "transactionDate": "2025-12-25T10:30:00.000Z",
      "source": "BANK",
      "merchantName": "Big Bazaar",
      "location": "Mumbai",
      "paymentMethod": "DEBIT_CARD",
      "createdAt": "2025-12-25T10:35:00.000Z"
    },
    {
      "id": "uuid2",
      "accountId": "uuid",
      "amount": 50000,
      "type": "INCOME",
      "category": "Salary",
      "description": "December Salary",
      "transactionDate": "2025-12-01T00:00:00.000Z",
      "source": "BANK",
      "createdAt": "2025-12-01T00:05:00.000Z"
    }
  ],
  "totalCount": 145,
  "summary": {
    "totalIncome": 50000,
    "totalExpenses": 28500,
    "netSavings": 21500
  }
}
```

**Transaction Types:**
- `INCOME` - Money received
- `EXPENSE` - Money spent

**Transaction Sources:**
- `MANUAL` - Manually added by user
- `BANK` - Imported from bank
- `SYSTEM` - System generated

---

### 5.7 Create Transaction
**POST** `/api/v1/employee/transactions`

Create a new transaction for the employee.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Request Body:**
```json
{
  "accountId": "uuid",
  "amount": 2000,
  "type": "EXPENSE",
  "category": "Food & Dining",
  "subCategory": "Restaurant",
  "description": "Dinner at Mainland China",
  "transactionDate": "2025-12-26T19:30:00.000Z",
  "source": "MANUAL",
  "merchantName": "Mainland China",
  "location": "Powai, Mumbai",
  "paymentMethod": "CREDIT_CARD"
}
```

**Validation Rules:**
- `accountId`: Required, must be user's account
- `amount`: Required, positive number
- `type`: Required, INCOME or EXPENSE
- `category`: Required, max 50 characters
- `subCategory`: Optional, max 50 characters
- `description`: Optional, max 500 characters
- `transactionDate`: Required, ISO 8601 date
- `source`: Required, MANUAL, BANK, or SYSTEM

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "accountId": "uuid",
  "amount": 2000,
  "type": "EXPENSE",
  "category": "Food & Dining",
  "subCategory": "Restaurant",
  "description": "Dinner at Mainland China",
  "transactionDate": "2025-12-26T19:30:00.000Z",
  "source": "MANUAL",
  "createdAt": "2025-12-27T00:00:00.000Z"
}
```

**Error Responses:**
- `400 Bad Request` - Validation error
- `404 Not Found` - Account doesn't exist

---

### 5.8 Get Transaction Details
**GET** `/api/v1/employee/transactions/:id`

Get specific transaction details by ID.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "accountId": "uuid",
  "account": {
    "id": "uuid",
    "accountName": "HDFC Savings",
    "provider": "HDFC Bank",
    "accountType": "SAVINGS"
  },
  "amount": 1500,
  "type": "EXPENSE",
  "category": "Food & Dining",
  "subCategory": "Groceries",
  "description": "Weekly shopping",
  "transactionDate": "2025-12-25T10:30:00.000Z",
  "source": "BANK",
  "merchantName": "Big Bazaar",
  "location": "Mumbai",
  "paymentMethod": "DEBIT_CARD",
  "createdAt": "2025-12-25T10:35:00.000Z",
  "updatedAt": "2025-12-25T10:35:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Transaction doesn't exist or doesn't belong to user

---

### 5.9 Delete Transaction
**DELETE** `/api/v1/employee/transactions/:id`

Delete a transaction. Only manually created transactions can be deleted.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
{
  "message": "Transaction deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Transaction doesn't exist or doesn't belong to user
- `400 Bad Request` - Cannot delete system or bank-imported transactions

---

## Insights & Budget

### 5.10 Get Latest Monthly Summary
**GET** `/api/v1/employee/insights/summary`

Get the most recent monthly financial summary for the employee.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "companyId": "uuid",
  "year": 2025,
  "month": 12,
  "totalIncome": 75000,
  "totalExpenses": 45000,
  "savingsAmount": 30000,
  "savingsRate": 40.0,
  "budget": 50000,
  "budgetUtilization": 90.0,
  "spendingByCategory": {
    "Food & Dining": 12000,
    "Transport": 8000,
    "Shopping": 10000,
    "Bills & Utilities": 8000,
    "Entertainment": 5000,
    "Healthcare": 2000
  },
  "topExpenseCategories": [
    {
      "category": "Food & Dining",
      "amount": 12000,
      "percentage": 26.67
    },
    {
      "category": "Shopping",
      "amount": 10000,
      "percentage": 22.22
    }
  ],
  "recommendations": [
    "Great job! Your savings rate is above 30%",
    "Consider reducing discretionary spending in Shopping category"
  ],
  "createdAt": "2025-12-27T00:00:00.000Z"
}
```

**Use Cases:**
- Dashboard summary display
- Financial health overview
- Monthly spending analysis

---

### 5.11 Get Category Breakdown
**GET** `/api/v1/employee/insights/categories`

Get detailed spending breakdown by category for a specific month or current month.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Query Parameters:**
- `month` (optional): Month number (1-12)
- `year` (optional): Year (e.g., 2025)

**Response:** `200 OK`
```json
{
  "month": 12,
  "year": 2025,
  "totalExpenses": 45000,
  "categories": [
    {
      "category": "Food & Dining",
      "subCategories": {
        "Groceries": 7000,
        "Restaurant": 5000
      },
      "total": 12000,
      "percentage": 26.67,
      "transactionCount": 28,
      "averagePerTransaction": 428.57
    },
    {
      "category": "Transport",
      "subCategories": {
        "Fuel": 5000,
        "Public Transport": 3000
      },
      "total": 8000,
      "percentage": 17.78,
      "transactionCount": 15,
      "averagePerTransaction": 533.33
    }
  ],
  "topMerchants": [
    {
      "merchantName": "Big Bazaar",
      "amount": 4500,
      "transactionCount": 6
    }
  ]
}
```

---

### 5.12 Get Spending Trends
**GET** `/api/v1/employee/insights/trend`

Get spending trends over multiple months for trend analysis and forecasting.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Query Parameters:**
- `months` (optional): Number of months to include (default: 6, max: 24)

**Response:** `200 OK`
```json
{
  "period": {
    "months": 6,
    "from": "2025-07-01",
    "to": "2025-12-31"
  },
  "monthlyData": [
    {
      "month": 7,
      "year": 2025,
      "income": 75000,
      "expenses": 42000,
      "savings": 33000,
      "savingsRate": 44.0
    },
    {
      "month": 8,
      "year": 2025,
      "income": 75000,
      "expenses": 45000,
      "savings": 30000,
      "savingsRate": 40.0
    }
  ],
  "averages": {
    "avgIncome": 75000,
    "avgExpenses": 43500,
    "avgSavings": 31500,
    "avgSavingsRate": 42.0
  },
  "trends": {
    "incomeChange": "+2.5%",
    "expenseChange": "+5.2%",
    "savingsChange": "-3.1%"
  },
  "categoryTrends": [
    {
      "category": "Food & Dining",
      "monthlyAmounts": [10000, 11000, 12000, 11500, 12500, 12000],
      "trend": "INCREASING",
      "changePercentage": 20.0
    }
  ]
}
```

---

## Insights API (Additional Endpoints)

The Insights API provides comprehensive financial analytics. These endpoints are available at `/api/v1/insights`.

### 5.13 Get Monthly Summaries
**GET** `/api/v1/insights/monthly`

Get all monthly summaries for a specific year and month, or all summaries.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`, `ADMIN`  
**Access:** Protected

**Query Parameters:**
- `year` (optional): Filter by year (e.g., 2025)
- `month` (optional): Filter by month (1-12)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "year": 2025,
    "month": 12,
    "totalIncome": 75000,
    "totalExpenses": 45000,
    "savingsAmount": 30000,
    "savingsRate": 40.0,
    "budget": 50000,
    "createdAt": "2025-12-27T00:00:00.000Z"
  }
]
```

---

### 5.14 Get Yearly Summary
**GET** `/api/v1/insights/monthly/year/:year`

Get aggregated financial summary for an entire year.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`, `ADMIN`  
**Access:** Protected

**Query Parameters:**
- `year`: Year to get summary for (path parameter)

**Response:** `200 OK`
```json
{
  "year": 2025,
  "months": 12,
  "totalIncome": 900000,
  "totalExpenses": 540000,
  "totalSavings": 360000,
  "averageSavingsRate": 40.0,
  "monthlyData": [
    {
      "month": 1,
      "income": 75000,
      "expenses": 45000,
      "savings": 30000
    }
  ],
  "topExpenseCategories": [
    {
      "category": "Food & Dining",
      "amount": 144000,
      "percentage": 26.67
    }
  ]
}
```

---

### 5.15 Generate Monthly Summary
**POST** `/api/v1/insights/generate`

Manually trigger generation of monthly financial summary for a specific month.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`, `ADMIN`  
**Access:** Protected

**Request Body:**
```json
{
  "month": 12,
  "year": 2025
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "companyId": "uuid",
  "year": 2025,
  "month": 12,
  "totalIncome": 75000,
  "totalExpenses": 45000,
  "savingsAmount": 30000,
  "savingsRate": 40.0,
  "message": "Monthly summary generated successfully"
}
```

**Use Cases:**
- Generate summary for past months
- Recalculate summary after transaction corrections
- Admin generating summaries for employees

---

### 5.16 Update Budget
**PATCH** `/api/v1/insights/budget`

Set or update monthly budget for the employee.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`, `ADMIN`  
**Access:** Protected

**Request Body:**
```json
{
  "month": 12,
  "year": 2025,
  "budget": 50000
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "month": 12,
  "year": 2025,
  "budget": 50000,
  "totalExpenses": 45000,
  "budgetUtilization": 90.0,
  "remainingBudget": 5000,
  "message": "Budget updated successfully"
}
```

---

### 5.17 Get Budget
**GET** `/api/v1/insights/budget`

Get budget information for a specific month.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`, `ADMIN`  
**Access:** Protected

**Query Parameters:**
- `month`: Month number (1-12) - Required
- `year`: Year (e.g., 2025) - Required

**Response:** `200 OK`
```json
{
  "month": 12,
  "year": 2025,
  "budget": 50000,
  "totalExpenses": 45000,
  "budgetUtilization": 90.0,
  "remainingBudget": 5000,
  "isOverBudget": false,
  "daysRemaining": 4,
  "projectedSpending": 48000,
  "categoryBudgets": [
    {
      "category": "Food & Dining",
      "allocated": 15000,
      "spent": 12000,
      "remaining": 3000
    }
  ]
}
```

---

## Financial Goals

All financial goals endpoints are located under `/api/v1/employee/goals` route.

### 5.18 Get My Goals
**GET** `/api/v1/employee/goals`

Get all financial goals for the logged-in employee.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "Emergency Fund",
    "description": "Build 6 months of emergency savings",
    "targetAmount": 450000,
    "currentAmount": 200000,
    "targetDate": "2026-06-30T00:00:00.000Z",
    "category": "SAVINGS",
    "priority": "HIGH",
    "status": "IN_PROGRESS",
    "progress": 44.44,
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-12-27T00:00:00.000Z"
  },
  {
    "id": "uuid2",
    "title": "Home Down Payment",
    "targetAmount": 2000000,
    "currentAmount": 500000,
    "targetDate": "2027-12-31T00:00:00.000Z",
    "category": "INVESTMENT",
    "priority": "MEDIUM",
    "status": "IN_PROGRESS",
    "progress": 25.0
  }
]
```

**Goal Categories:**
- `SAVINGS` - General savings goal
- `INVESTMENT` - Investment goal
- `DEBT_REPAYMENT` - Debt payoff goal
- `MAJOR_PURCHASE` - Large purchase goal
- `RETIREMENT` - Retirement savings
- `EDUCATION` - Education fund

**Goal Status:**
- `NOT_STARTED` - Goal created but no progress
- `IN_PROGRESS` - Actively working on goal
- `COMPLETED` - Target achieved
- `CANCELLED` - Goal cancelled

**Priority Levels:**
- `HIGH` - Top priority
- `MEDIUM` - Moderate priority
- `LOW` - Lower priority

---

### 5.19 Create Goal
**POST** `/api/v1/employee/goals`

Create a new financial goal.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Request Body:**
```json
{
  "title": "Vacation Fund",
  "description": "Save for Europe trip in summer 2026",
  "targetAmount": 300000,
  "currentAmount": 0,
  "targetDate": "2026-07-01T00:00:00.000Z",
  "category": "SAVINGS",
  "priority": "MEDIUM"
}
```

**Validation Rules:**
- `title`: Required, max 100 characters
- `description`: Optional, max 500 characters
- `targetAmount`: Required, positive number
- `currentAmount`: Optional, defaults to 0
- `targetDate`: Required, future date
- `category`: Required
- `priority`: Required

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Vacation Fund",
  "description": "Save for Europe trip in summer 2026",
  "targetAmount": 300000,
  "currentAmount": 0,
  "targetDate": "2026-07-01T00:00:00.000Z",
  "category": "SAVINGS",
  "priority": "MEDIUM",
  "status": "NOT_STARTED",
  "progress": 0,
  "createdAt": "2025-12-27T00:00:00.000Z"
}
```

---

### 5.20 Update Goal
**PUT** `/api/v1/employee/goals/:goalId`

Update an existing financial goal.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Request Body:**
```json
{
  "title": "Vacation Fund - Updated",
  "currentAmount": 50000,
  "targetAmount": 350000,
  "targetDate": "2026-08-01T00:00:00.000Z",
  "priority": "HIGH",
  "status": "IN_PROGRESS"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "Vacation Fund - Updated",
  "currentAmount": 50000,
  "targetAmount": 350000,
  "targetDate": "2026-08-01T00:00:00.000Z",
  "priority": "HIGH",
  "status": "IN_PROGRESS",
  "progress": 14.29,
  "updatedAt": "2025-12-27T00:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Goal doesn't exist or doesn't belong to user
- `400 Bad Request` - Validation error

---

### 5.21 Delete Goal
**DELETE** `/api/v1/employee/goals/:goalId`

Delete a financial goal.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
{
  "message": "Goal deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Goal doesn't exist or doesn't belong to user

**Response:** `200 OK`
```json
{
  "trends": [
    {
      "month": "2025-07",
      "totalIncome": 50000,
      "totalExpenses": 28000,
      "savings": 22000,
      "savingsRate": 44.0
    },
    {
      "month": "2025-08",
      "totalIncome": 50000,
      "totalExpenses": 32000,
      "savings": 18000,
      "savingsRate": 36.0
    }
  ]
}
```

---

## Accounts

### 5.1 Create Account
**POST** `/api/v1/accounts`

Create a new financial account.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Request Body:**
```json
{
  "accountName": "HDFC Savings",
  "provider": "HDFC Bank",
  "maskedAccountNo": "****1234",
  "accountType": "SAVINGS",
  "balance": 50000
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "accountName": "HDFC Savings",
  "provider": "HDFC Bank",
  "maskedAccountNo": "****1234",
  "accountType": "SAVINGS",
  "balance": 50000,
  "createdAt": "2025-12-19T00:00:00.000Z"
}
```

**Error Responses:**
- `409 Conflict` - Account with same provider and masked account number already exists for user
- `400 Bad Request` - Invalid account data

---

### 5.2 Get My Accounts
**GET** `/api/v1/accounts`

Get all accounts for logged-in user.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "accountName": "HDFC Savings",
    "provider": "HDFC Bank",
    "maskedAccountNo": "****1234",
    "accountType": "SAVINGS",
    "balance": 50000,
    "createdAt": "2025-12-19T00:00:00.000Z",
    "updatedAt": "2025-12-19T00:00:00.000Z"
  }
]
```

---

### 5.3 Get Account by ID
**GET** `/api/v1/accounts/:id`

Get specific account details.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "accountName": "HDFC Savings",
  "provider": "HDFC Bank",
  "maskedAccountNo": "****1234",
  "accountType": "SAVINGS",
  "balance": 50000,
  "createdAt": "2025-12-19T00:00:00.000Z",
  "updatedAt": "2025-12-19T00:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Account not found or not owned by user
- `403 Forbidden` - Not authorized to access this account

---

### 5.4 Update Account
**PATCH** `/api/v1/accounts/:id`

Update an existing account.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Request Body:**
```json
{
  "accountName": "HDFC Premium Savings",
  "balance": 55000
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "accountName": "HDFC Premium Savings",
  "balance": 55000,
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Account not found or not owned by user
- `403 Forbidden` - Not authorized to update this account

---

### 5.5 Delete Account
**DELETE** `/api/v1/accounts/:id`

Delete an account.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Response:** `200 OK`
```json
{
  "message": "Account deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Account not found or not owned by user
- `403 Forbidden` - Not authorized to delete this account

**Note:** Deleting an account will set all associated transactions' `accountId` to `null`.

---

## Financial Goals

### 6.1 Get My Goals
**GET** `/api/v1/employee/goals`

Get all financial goals for logged-in employee.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "Emergency Fund",
    "targetAmount": 100000,
    "currentAmount": 50000,
    "deadline": "2025-12-31T00:00:00.000Z",
    "category": "SAVINGS",
    "status": "IN_PROGRESS",
    "progress": 50.0,
    "description": "Build 6-month emergency fund",
    "createdAt": "2025-01-01T00:00:00.000Z",
    "updatedAt": "2025-12-19T00:00:00.000Z"
  },
  {
    "id": "uuid",
    "userId": "uuid",
    "title": "Vacation Fund",
    "targetAmount": 50000,
    "currentAmount": 20000,
    "deadline": "2025-06-30T00:00:00.000Z",
    "category": "LIFESTYLE",
    "status": "IN_PROGRESS",
    "progress": 40.0,
    "description": "Summer vacation to Europe",
    "createdAt": "2025-03-01T00:00:00.000Z",
    "updatedAt": "2025-12-19T00:00:00.000Z"
  }
]
```

**Goal Categories:**
- `SAVINGS`: Emergency fund, general savings
- `DEBT_PAYOFF`: Debt repayment goals
- `INVESTMENT`: Investment targets
- `RETIREMENT`: Retirement savings
- `EDUCATION`: Education fund
- `LIFESTYLE`: Vacation, car, home improvement
- `OTHER`: Miscellaneous goals

**Goal Status:**
- `NOT_STARTED`: Goal created but no progress
- `IN_PROGRESS`: Actively working towards goal
- `COMPLETED`: Goal achieved
- `CANCELLED`: Goal abandoned

---

### 6.2 Create Goal
**POST** `/api/v1/employee/goals`

Create a new financial goal.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Request Body:**
```json
{
  "title": "Vacation Fund",
  "targetAmount": 50000,
  "currentAmount": 10000,
  "deadline": "2025-06-30",
  "category": "LIFESTYLE",
  "description": "Summer vacation to Europe"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "title": "Vacation Fund",
  "targetAmount": 50000,
  "currentAmount": 10000,
  "deadline": "2025-06-30T00:00:00.000Z",
  "category": "LIFESTYLE",
  "status": "IN_PROGRESS",
  "progress": 20.0,
  "description": "Summer vacation to Europe",
  "createdAt": "2025-12-19T10:00:00.000Z"
}
```

**Validation Rules:**
- `title`: Required, 3-100 characters
- `targetAmount`: Required, must be positive number
- `currentAmount`: Optional, default 0, must be >= 0
- `deadline`: Optional, must be future date
- `category`: Required, must be valid category
- `description`: Optional, max 500 characters

---

### 6.3 Update Goal
**PUT** `/api/v1/employee/goals/:goalId`

Update an existing financial goal.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Request Body:**
```json
{
  "title": "European Vacation Fund",
  "currentAmount": 25000,
  "targetAmount": 60000,
  "deadline": "2025-07-31",
  "description": "Updated vacation plan"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "title": "European Vacation Fund",
  "currentAmount": 25000,
  "targetAmount": 60000,
  "deadline": "2025-07-31T00:00:00.000Z",
  "progress": 41.67,
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

**Note:** Progress is automatically calculated as `(currentAmount / targetAmount) * 100`

**Error Responses:**
- `404 Not Found` - Goal not found or doesn't belong to user
- `400 Bad Request` - Invalid data (e.g., currentAmount > targetAmount)

---

### 6.4 Delete Goal
**DELETE** `/api/v1/employee/goals/:goalId`

Delete a financial goal.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Response:** `200 OK`
```json
{
  "message": "Goal deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Goal not found or doesn't belong to user

---

### 6.5 Get Goal Statistics
**GET** `/api/v1/employee/goals/stats`

Get statistics about user's financial goals.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Response:** `200 OK`
```json
{
  "totalGoals": 5,
  "inProgress": 3,
  "completed": 2,
  "cancelled": 0,
  "totalTargetAmount": 500000,
  "totalCurrentAmount": 250000,
  "overallProgress": 50.0,
  "goalsByCategory": {
    "SAVINGS": 2,
    "LIFESTYLE": 1,
    "DEBT_PAYOFF": 1,
    "RETIREMENT": 1
  },
  "upcomingDeadlines": [
    {
      "goalId": "uuid",
      "title": "Vacation Fund",
      "deadline": "2025-06-30T00:00:00.000Z",
      "daysRemaining": 193
    }
  ]
}
```

---

## Transactions

### 7.1 Get All Transactions
**GET** `/api/v1/transactions`

Get all transactions for logged-in user.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Query Parameters:**
- `accountId` (optional): Filter by account ID
- `type` (optional): Filter by type (INCOME, EXPENSE)
- `category` (optional): Filter by category (partial match)
- `limit` (optional): Limit results (default: 50)
- `skip` (optional): Skip results for pagination (default: 0)

**Response:** `200 OK`
```json
{
  "transactions": [
    {
      "id": "uuid",
      "accountId": "uuid",
      "amount": 1500,
      "type": "EXPENSE",
      "category": "Food",
      "subCategory": "Groceries",
      "description": "Weekly shopping",
      "transactionDate": "2025-12-15T00:00:00.000Z",
      "source": "BANK",
      "merchant": "Amazon",
      "bank": "HDFC",
      "maskedAccountNo": "XXXX1234",
      "createdAt": "2025-12-15T10:00:00.000Z"
    }
  ],
  "total": 150,
  "page": 1,
  "limit": 50
}
```

---

### 7.2 Create Transaction ✨ ENHANCED
**POST** `/api/v1/transactions`

Create a new transaction. **accountId is now OPTIONAL** - transactions can exist without accounts.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Request Body (with explicit account):**
```json
{
  "accountId": "uuid",
  "amount": 1500,
  "type": "EXPENSE",
  "category": "Food",
  "subCategory": "Groceries",
  "description": "Weekly shopping",
  "transactionDate": "2025-12-15T10:00:00.000Z",
  "source": "BANK"
}
```

**Request Body (without account - ✨ NEW):**
```json
{
  "amount": 500,
  "type": "EXPENSE",
  "category": "Food",
  "description": "Cash payment at restaurant",
  "transactionDate": "2025-12-15T18:30:00.000Z",
  "source": "MANUAL"
}
```

**Request Body (with metadata for auto-account creation - ✨ NEW):**
```json
{
  "amount": 5000,
  "type": "EXPENSE",
  "category": "Shopping",
  "subCategory": "Electronics",
  "description": "Card payment via SMS",
  "bank": "HDFC",
  "maskedAccountNo": "XXXX1234",
  "merchant": "Amazon",
  "provider": "BANK",
  "source": "MOBILE",
  "transactionDate": "2025-12-16T14:20:00.000Z"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "accountId": "uuid or null",
  "amount": 1500,
  "type": "EXPENSE",
  "category": "Food",
  "subCategory": "Groceries",
  "description": "Weekly shopping",
  "transactionDate": "2025-12-15T00:00:00.000Z",
  "source": "BANK",
  "bank": "HDFC",
  "maskedAccountNo": "XXXX1234",
  "merchant": null,
  "createdAt": "2025-12-15T10:00:00.000Z"
}
```

**Smart Account Matching Logic:**
1. **Explicit accountId provided** → Validates and uses that account
2. **Metadata provided (bank + maskedAccountNo + provider)** → Matches existing account or auto-creates new one
3. **No account info** → Creates transaction with accountId=null
4. **Never fails** → Transaction always created even without account

---

### 7.3 Bulk Create Transactions ✨ ENHANCED
**POST** `/api/v1/transactions/bulk`

Create multiple transactions in a single request. Supports mixed scenarios (with/without accounts).

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Request Body:**
```json
{
  "transactions": [
    {
      "accountId": "uuid",
      "amount": 10000,
      "type": "INCOME",
      "category": "Salary",
      "source": "BANK",
      "description": "Explicit account ID",
      "transactionDate": "2025-12-01T00:00:00.000Z"
    },
    {
      "amount": 2500,
      "type": "EXPENSE",
      "category": "Shopping",
      "source": "MOBILE",
      "description": "SMS transaction - auto-create",
      "bank": "ICICI",
      "maskedAccountNo": "XXXX5678",
      "provider": "BANK",
      "transactionDate": "2025-12-10T00:00:00.000Z"
    },
    {
      "amount": 800,
      "type": "EXPENSE",
      "category": "Food",
      "source": "MANUAL",
      "description": "Cash payment - no account",
      "transactionDate": "2025-12-11T00:00:00.000Z"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "message": "Successfully created 3 transactions",
  "count": 3,
  "transactions": [...],
  "accountsLinked": 2,
  "accountsUnlinked": 1
}
```

---

### 7.4 Get Transaction by ID
**GET** `/api/v1/transactions/:transactionId`

Get details of a specific transaction.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "accountId": "uuid",
  "amount": 1500,
  "type": "EXPENSE",
  "category": "Food",
  "description": "Weekly shopping",
  "transactionDate": "2025-12-15T00:00:00.000Z",
  "source": "BANK",
  "createdAt": "2025-12-15T10:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Transaction not found

---

### 7.5 Update Transaction
**PATCH** `/api/v1/transactions/:transactionId`

Update an existing transaction.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Request Body:**
```json
{
  "amount": 1600,
  "category": "Food & Dining",
  "subCategory": "Fine Dining",
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "amount": 1600,
  "category": "Food & Dining",
  "subCategory": "Fine Dining",
  "description": "Updated description",
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Transaction not found
- `403 Forbidden` - Not authorized to update this transaction

---

### 7.6 Delete Transaction
**DELETE** `/api/v1/transactions/:transactionId`

Delete a transaction.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Response:** `200 OK`
```json
{
  "message": "Transaction deleted successfully"
}
```

**Error Responses:**
- `404 Not Found` - Transaction not found
- `403 Forbidden` - Not authorized to delete this transaction

---

## Insights & Budget

### 8.1 Get Monthly Summaries
**GET** `/api/v1/insights/monthly`

Get monthly financial summaries with optional filtering.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Query Parameters:**
- `year` (optional): Filter by year
- `month` (optional): Filter by month (1-12)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "userId": "uuid",
    "year": 2025,
    "month": 12,
    "totalIncome": 50000,
    "totalExpenses": 30000,
    "savingsAmount": 20000,
    "savingsRate": 40,
    "budget": 35000,
    "spendingByCategory": {
      "Groceries": 8000,
      "Transport": 5000
    }
  }
]
```

---

### 8.2 Get Latest Monthly Summary
**GET** `/api/v1/insights/monthly/latest`

Get the most recent monthly summary for logged-in user.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "year": 2025,
  "month": 12,
  "totalIncome": 50000,
  "totalExpenses": 30000,
  "savingsAmount": 20000,
  "savingsRate": 40,
  "budget": 35000,
  "spendingByCategory": {
    "Groceries": 8000,
    "Transport": 5000,
    "Entertainment": 3000
  },
  "createdAt": "2025-12-01T00:00:00.000Z",
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

**Response when no data:** `200 OK`
```json
{
  "year": 2025,
  "month": 12,
  "totalIncome": 0,
  "totalExpenses": 0,
  "savingsAmount": 0,
  "savingsRate": 0,
  "budget": null,
  "spendingByCategory": {}
}
```

---

### 8.3 Get Yearly Summary
**GET** `/api/v1/insights/monthly/year/:year`

Get aggregated summary for an entire year.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Path Parameters:**
- `year`: Year (e.g., 2025)

**Response:** `200 OK`
```json
{
  "year": 2025,
  "totalIncome": 600000,
  "totalExpenses": 360000,
  "totalSavings": 240000,
  "averageSavingsRate": 40.0,
  "monthlyBreakdown": [
    {
      "month": 1,
      "income": 50000,
      "expenses": 30000,
      "savings": 20000
    }
  ]
}
```

---

### 8.4 Get Category Breakdown
**GET** `/api/v1/insights/category-breakdown`

Get detailed spending breakdown by category.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Query Parameters:**
- `year` (optional): Filter by year
- `month` (optional): Filter by month (1-12)

**Response:** `200 OK`
```json
{
  "year": 2025,
  "month": 12,
  "categories": [
    {
      "category": "Food",
      "subcategories": {
        "Groceries": 8000,
        "Dining": 5000
      },
      "total": 13000,
      "percentage": 43.33,
      "transactionCount": 25
    },
    {
      "category": "Transport",
      "subcategories": {
        "Fuel": 3000,
        "Public Transport": 2000
      },
      "total": 5000,
      "percentage": 16.67,
      "transactionCount": 15
    }
  ],
  "totalExpenses": 30000
}
```

---

### 8.5 Get Spending Trends
**GET** `/api/v1/insights/trends`

Get spending trends over multiple months.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Query Parameters:**
- `months` (optional): Number of months to include (default: 6, max: 24)

**Response:** `200 OK`
```json
{
  "period": "Last 6 months",
  "trends": [
    {
      "month": "2025-07",
      "monthName": "July 2025",
      "totalIncome": 50000,
      "totalExpenses": 28000,
      "savings": 22000,
      "savingsRate": 44.0,
      "topCategory": "Food",
      "topCategoryAmount": 9000
    },
    {
      "month": "2025-08",
      "monthName": "August 2025",
      "totalIncome": 50000,
      "totalExpenses": 32000,
      "savings": 18000,
      "savingsRate": 36.0,
      "topCategory": "Shopping",
      "topCategoryAmount": 12000
    }
  ],
  "averageSavingsRate": 38.5,
  "trendDirection": "IMPROVING"
}
```

---

### 8.6 Generate/Refresh Monthly Summary
**POST** `/api/v1/insights/generate`

Generate or refresh monthly summary from transactions.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Request Body:**
```json
{
  "year": 2025,
  "month": 12,
  "budget": 35000
}
```

**Response:** `201 Created`
```json
{
  "message": "Monthly summary generated successfully",
  "summary": {
    "id": "uuid",
    "year": 2025,
    "month": 12,
    "totalIncome": 50000,
    "totalExpenses": 30000,
    "savingsAmount": 20000,
    "savingsRate": 40,
    "budget": 35000
  }
}
```

**Note:** This endpoint recalculates all metrics from actual transaction data and updates or creates the monthly summary.

---

### 8.7 Update Monthly Budget
**PATCH** `/api/v1/insights/budget`

Set or update monthly budget.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Request Body:**
```json
{
  "year": 2025,
  "month": 12,
  "budget": 35000
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "year": 2025,
  "month": 12,
  "budget": 35000,
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

**Note:** If monthly summary doesn't exist, it will be created with the budget value.

---

### 8.8 Get Monthly Budget
**GET** `/api/v1/insights/budget`

Get budget for a specific month.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Query Parameters:**
- `month` (required): Month (1-12)
- `year` (required): Year (e.g., 2025)

**Response:** `200 OK`
```json
{
  "year": 2025,
  "month": 12,
  "budget": 35000,
  "spent": 30000,
  "remaining": 5000,
  "percentageUsed": 85.71
}
```

---

## Coach Portal

All coach-specific endpoints are located under `/api/v1/coach` route. All endpoints require COACH role authentication.

### 10.1 Create Availability Slots
**POST** `/api/v1/coach/slots`

Create multiple time slots for a specific date when the coach is available for consultations. Each slot represents a 1-hour time window.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`  
**Access:** Protected (Coach only)

**Request Body:**
```json
{
  "date": "2025-12-30",
  "timeSlots": [
    {
      "startTime": "09:00",
      "endTime": "10:00"
    },
    {
      "startTime": "10:00",
      "endTime": "11:00"
    },
    {
      "startTime": "14:00",
      "endTime": "15:00"
    }
  ]
}
```

**Validation Rules:**
- `date`: Required, format YYYY-MM-DD, must be today or future date
- `timeSlots`: Required, array of time slots
  - `startTime`: Required, format HH:MM (24-hour)
  - `endTime`: Required, format HH:MM (24-hour)
  - Must not overlap with existing slots
  - End time must be after start time
  - Typical slot duration: 60 minutes

**Response:** `201 Created`
```json
{
  "message": "3 slots created successfully",
  "count": 3,
  "date": "2025-12-30",
  "slots": [
    {
      "id": "uuid1",
      "coachId": "uuid",
      "date": "2025-12-30T00:00:00.000Z",
      "startTime": "2025-12-30T09:00:00.000Z",
      "endTime": "2025-12-30T10:00:00.000Z",
      "status": "AVAILABLE",
      "createdAt": "2025-12-27T10:00:00.000Z"
    },
    {
      "id": "uuid2",
      "coachId": "uuid",
      "date": "2025-12-30T00:00:00.000Z",
      "startTime": "2025-12-30T10:00:00.000Z",
      "endTime": "2025-12-30T11:00:00.000Z",
      "status": "AVAILABLE",
      "createdAt": "2025-12-27T10:00:00.000Z"
    },
    {
      "id": "uuid3",
      "coachId": "uuid",
      "date": "2025-12-30T00:00:00.000Z",
      "startTime": "2025-12-30T14:00:00.000Z",
      "endTime": "2025-12-30T15:00:00.000Z",
      "status": "AVAILABLE",
      "createdAt": "2025-12-27T10:00:00.000Z"
    }
  ]
}
```

**Slot Status Values:**
- `AVAILABLE` - Slot is open for booking
- `BOOKED` - Slot has been booked by an employee
- `CANCELLED` - Slot was cancelled

**Error Responses:**
- `400 Bad Request` - Invalid time format, overlapping slots, or past date
- `409 Conflict` - Slot already exists for that time

---

### 10.2 Get My Slots
**GET** `/api/v1/coach/slots`

Retrieve all slots created by the coach. Can be filtered by date to see availability for a specific day.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`  
**Access:** Protected (Coach only)

**Query Parameters:**
- `date` (optional): Filter by specific date in YYYY-MM-DD format

**Response:** `200 OK`
```json
[
  {
    "id": "uuid1",
    "coachId": "uuid",
    "date": "2025-12-30T00:00:00.000Z",
    "startTime": "2025-12-30T09:00:00.000Z",
    "endTime": "2025-12-30T10:00:00.000Z",
    "status": "AVAILABLE",
    "createdAt": "2025-12-27T10:00:00.000Z",
    "updatedAt": "2025-12-27T10:00:00.000Z"
  },
  {
    "id": "uuid2",
    "coachId": "uuid",
    "date": "2025-12-30T00:00:00.000Z",
    "startTime": "2025-12-30T10:00:00.000Z",
    "endTime": "2025-12-30T11:00:00.000Z",
    "status": "BOOKED",
    "consultation": {
      "id": "consultationUuid",
      "employeeName": "John Doe",
      "employeeEmail": "john.doe@techcorp.com",
      "bookedAt": "2025-12-28T14:30:00.000Z"
    },
    "createdAt": "2025-12-27T10:00:00.000Z",
    "updatedAt": "2025-12-28T14:30:00.000Z"
  }
]
```

---

### 10.3 Get My Consultations
**GET** `/api/v1/coach/consultations`

Retrieve all consultations booked with the coach. Supports filtering by time period for better organization.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`  
**Access:** Protected (Coach only)

**Query Parameters:**
- `filter` (optional): Filter consultations by time period
  - `past` - Consultations that have ended (endTime < now)
  - `upcoming` - Future consultations (startTime >= now)
  - `thisMonth` - Consultations in current calendar month
  - No filter - All consultations

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "slotId": "uuid",
    "employeeId": "uuid",
    "coachId": "uuid",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "status": "CONFIRMED",
    "notes": "Discuss investment strategies and retirement planning",
    "bookedAt": "2025-12-28T14:30:00.000Z",
    "cancelledAt": null,
    "cancellationReason": null,
    "slot": {
      "id": "uuid",
      "date": "2025-12-30T00:00:00.000Z",
      "startTime": "2025-12-30T09:00:00.000Z",
      "endTime": "2025-12-30T10:00:00.000Z"
    },
    "employee": {
      "id": "uuid",
      "email": "john.doe@techcorp.com",
      "profile": {
        "firstName": "John",
        "lastName": "Doe",
        "phoneNumber": "+1234567890",
        "position": "Software Engineer",
        "department": "Engineering"
      },
      "company": {
        "name": "Tech Corp",
        "domain": "techcorp.com"
      }
    },
    "createdAt": "2025-12-28T14:30:00.000Z",
    "updatedAt": "2025-12-28T14:30:00.000Z"
  }
]
```

**Consultation Status:**
- `CONFIRMED` - Booking confirmed
- `COMPLETED` - Session completed
- `CANCELLED` - Booking cancelled (by coach or employee)
- `NO_SHOW` - Employee didn't attend

---

### 10.4 Get Consultation Statistics
**GET** `/api/v1/coach/consultations/stats`

Get comprehensive statistics about the coach's consultation activity. Useful for coach dashboard and performance tracking.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`  
**Access:** Protected (Coach only)

**Response:** `200 OK`
```json
{
  "total": 150,
  "past": 135,
  "upcoming": 15,
  "thisMonth": 25,
  "confirmed": 140,
  "cancelled": 10,
  "completed": 130,
  "noShow": 5,
  "averageRating": 4.7,
  "totalRatings": 125,
  "totalMinutesConducted": 8100,
  "thisMonthStats": {
    "consultations": 25,
    "minutes": 1500,
    "uniqueEmployees": 22
  },
  "recentActivity": {
    "last7Days": 8,
    "last30Days": 25,
    "last90Days": 65
  }
}
```

---

### 10.5 Cancel Consultation (Coach)
**PATCH** `/api/v1/coach/consultations/:id/cancel`

Cancel a scheduled consultation. The time slot automatically becomes AVAILABLE again after cancellation.

**Rate Limit:** 20 cancellations per hour  
**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`  
**Access:** Protected (Coach only)

**Request Body:**
```json
{
  "reason": "Personal emergency" 
}
```

**Response:** `200 OK`
```json
{
  "message": "Consultation cancelled successfully",
  "consultation": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelledAt": "2025-12-27T10:30:00.000Z",
    "cancellationReason": "Personal emergency",
    "refundedAt": null
  },
  "slot": {
    "id": "uuid",
    "status": "AVAILABLE"
  },
  "notificationsSent": {
    "employee": true,
    "coach": true
  }
}
```

**Business Rules:**
- Can only cancel CONFIRMED consultations
- Cannot cancel past or ongoing consultations
- Slot status automatically changes to AVAILABLE
- Both employee and coach receive email notifications
- Cancellation history is preserved for auditing

**Error Responses:**
- `404 Not Found` - Consultation doesn't exist or doesn't belong to coach
- `400 Bad Request` - Consultation already cancelled or in the past
- `429 Too Many Requests` - Rate limit exceeded (20/hour)

---

## Employee Consultations

All employee consultation endpoints are located under `/api/v1/employee` route.

### 11.1 Get All Coaches
**GET** `/api/v1/employee/coaches`

Get list of all active coaches with their complete profiles, expertise, and ratings.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "email": "sarah.johnson@koshpal.com",
    "coachProfile": {
      "id": "uuid",
      "firstName": "Sarah",
      "lastName": "Johnson",
      "bio": "Certified financial coach with over 10 years of experience helping individuals achieve their financial goals",
      "expertise": ["Debt Management", "Investment Planning", "Retirement Planning", "Tax Planning"],
      "phoneNumber": "+91-9876543210",
      "photoUrl": "https://storage.koshpal.com/coaches/sarah-johnson.jpg",
      "linkedinUrl": "https://linkedin.com/in/sarahjohnson",
      "certifications": ["CFP", "AFC", "CFA Level II"],
      "yearsOfExperience": 10,
      "averageRating": 4.8,
      "totalRatings": 127,
      "totalConsultations": 245
    },
    "availability": {
      "nextAvailableDate": "2025-12-30",
      "availableSlotsCount": 8
    }
  },
  {
    "id": "uuid2",
    "email": "mike.chen@koshpal.com",
    "coachProfile": {
      "id": "uuid2",
      "firstName": "Mike",
      "lastName": "Chen",
      "bio": "Specialized in helping young professionals start their investment journey",
      "expertise": ["Investment Planning", "Wealth Building", "Financial Literacy"],
      "phoneNumber": "+91-9876543211",
      "photoUrl": "https://storage.koshpal.com/coaches/mike-chen.jpg",
      "yearsOfExperience": 7,
      "averageRating": 4.6,
      "totalRatings": 89,
      "totalConsultations": 178
    }
  }
]
```

---

### 11.2 Get Coach Available Slots
**GET** `/api/v1/employee/coaches/:coachId/slots`

Get all available time slots for a specific coach on a particular date.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Query Parameters:**
- `date`: Required, format YYYY-MM-DD

**Response:** `200 OK`
```json
[
  {
    "id": "uuid1",
    "coachId": "uuid",
    "date": "2025-12-30T00:00:00.000Z",
    "startTime": "2025-12-30T09:00:00.000Z",
    "endTime": "2025-12-30T10:00:00.000Z",
    "status": "AVAILABLE"
  },
  {
    "id": "uuid2",
    "coachId": "uuid",
    "date": "2025-12-30T00:00:00.000Z",
    "startTime": "2025-12-30T10:00:00.000Z",
    "endTime": "2025-12-30T11:00:00.000Z",
    "status": "AVAILABLE"
  }
]
```

**Error Responses:**
- `400 Bad Request` - Date parameter missing or invalid format
- `404 Not Found` - Coach doesn't exist

---

### 11.3 Get Aggregated Coach Slots
**GET** `/api/v1/employee/coaches/slots`

Get all active coaches with their available slots for a given date in a single request. Optimized endpoint to prevent throttling issues when loading coach availability screens.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)  
**Rate Limit:** 50 requests per 10 seconds

**Query Parameters:**
- `date`: Required, format YYYY-MM-DD

**Response:** `200 OK`
```json
[
  {
    "coachId": "uuid",
    "coachName": "Sarah Johnson",
    "coachEmail": "sarah.johnson@koshpal.com",
    "expertise": ["Debt Management", "Investment Planning", "Retirement Planning"],
    "averageRating": 4.8,
    "totalRatings": 127,
    "photoUrl": "https://storage.koshpal.com/coaches/sarah-johnson.jpg",
    "slots": [
      {
        "slotId": "uuid1",
        "startTime": "2025-12-30T09:00:00.000Z",
        "endTime": "2025-12-30T10:00:00.000Z"
      },
      {
        "slotId": "uuid2",
        "startTime": "2025-12-30T14:00:00.000Z",
        "endTime": "2025-12-30T15:00:00.000Z"
      }
    ],
    "totalAvailableSlots": 2
  },
  {
    "coachId": "uuid2",
    "coachName": "Mike Chen",
    "coachEmail": "mike.chen@koshpal.com",
    "expertise": ["Investment Planning", "Wealth Building"],
    "averageRating": 4.6,
    "totalRatings": 89,
    "slots": [
      {
        "slotId": "uuid3",
        "startTime": "2025-12-30T10:00:00.000Z",
        "endTime": "2025-12-30T11:00:00.000Z"
      }
    ],
    "totalAvailableSlots": 1
  }
]
```

**Performance Note:** This endpoint uses a single optimized database query with proper indexing, eliminating N+1 query problems.

**Error Responses:**
- `400 Bad Request` - Date parameter missing, invalid format, or invalid date

---

### 11.4 Book Consultation
**POST** `/api/v1/employee/consultations/book`

Book a consultation session with a coach for a specific time slot. Automatically generates a Google Meet link and sends email notifications.

**Rate Limit:** 10 bookings per minute  
**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Request Body:**
```json
{
  "slotId": "uuid",
  "notes": "I want to discuss debt repayment strategies and creating an emergency fund"
}
```

**Validation Rules:**
- `slotId`: Required, must be valid UUID of an AVAILABLE slot
- `notes`: Optional, max 1000 characters

**Response:** `201 Created`
```json
{
  "message": "Consultation booked successfully",
  "consultation": {
    "id": "uuid",
    "slotId": "uuid",
    "employeeId": "uuid",
    "coachId": "uuid",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "status": "CONFIRMED",
    "notes": "I want to discuss debt repayment strategies and creating an emergency fund",
    "bookedAt": "2025-12-27T11:00:00.000Z"
  },
  "slot": {
    "id": "uuid",
    "date": "2025-12-30T00:00:00.000Z",
    "startTime": "2025-12-30T09:00:00.000Z",
    "endTime": "2025-12-30T10:00:00.000Z",
    "status": "BOOKED"
  },
  "coach": {
    "name": "Sarah Johnson",
    "email": "sarah.johnson@koshpal.com"
  },
  "notificationsSent": {
    "employee": true,
    "coach": true
  }
}
```

**Business Logic:**
- Slot status changes from AVAILABLE to BOOKED
- Google Meet link auto-generated
- Confirmation emails sent to both employee and coach
- Calendar invites sent (if calendar integration enabled)

**Error Responses:**
- `400 Bad Request` - Slot already booked, slot in past, or invalid slot
- `404 Not Found` - Slot doesn't exist
- `429 Too Many Requests` - Rate limit exceeded (10/minute)

---

### 11.5 Get My Consultations
**GET** `/api/v1/employee/consultations`

Get all consultations for the logged-in employee with optional filters.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Query Parameters:**
- `filter` (optional): Filter by time period
  - `past` - Consultations that have ended
  - `upcoming` - Future consultations
  - `thisWeek` - Consultations in current week (Sun-Sat)
  - `thisMonth` - Consultations in current month
  - No filter - All consultations

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "slotId": "uuid",
    "meetingLink": "https://meet.google.com/abc-defg-hij",
    "status": "CONFIRMED",
    "notes": "Discuss debt repayment strategies",
    "bookedAt": "2025-12-27T11:00:00.000Z",
    "slot": {
      "id": "uuid",
      "date": "2025-12-30T00:00:00.000Z",
      "startTime": "2025-12-30T09:00:00.000Z",
      "endTime": "2025-12-30T10:00:00.000Z"
    },
    "coach": {
      "id": "uuid",
      "email": "sarah.johnson@koshpal.com",
      "coachProfile": {
        "firstName": "Sarah",
        "lastName": "Johnson",
        "phoneNumber": "+91-9876543210",
        "photoUrl": "https://storage.koshpal.com/coaches/sarah-johnson.jpg",
        "expertise": ["Debt Management", "Investment Planning"],
        "averageRating": 4.8
      }
    },
    "createdAt": "2025-12-27T11:00:00.000Z"
  }
]
```

---

### 11.6 Get Consultation Statistics
**GET** `/api/v1/employee/consultations/stats`

Get comprehensive statistics about employee's consultation history.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
{
  "total": 12,
  "past": 10,
  "upcoming": 2,
  "thisWeek": 1,
  "thisMonth": 3,
  "confirmed": 11,
  "cancelled": 1,
  "completed": 9,
  "totalMinutesBooked": 720,
  "coachesConsulted": 3,
  "mostConsultedCoach": {
    "name": "Sarah Johnson",
    "consultations": 6
  },
  "upcomingNext": {
    "id": "uuid",
    "coachName": "Sarah Johnson",
    "date": "2025-12-30T09:00:00.000Z"
  }
}
```

---

### 11.7 Get Latest Consultation
**GET** `/api/v1/employee/consultations/latest`

Get the most recently booked consultation. Useful for dashboard widgets showing upcoming session.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "meetingLink": "https://meet.google.com/abc-defg-hij",
  "status": "CONFIRMED",
  "slot": {
    "date": "2025-12-30T00:00:00.000Z",
    "startTime": "2025-12-30T09:00:00.000Z",
    "endTime": "2025-12-30T10:00:00.000Z"
  },
  "coach": {
    "name": "Sarah Johnson",
    "email": "sarah.johnson@koshpal.com",
    "photoUrl": "https://storage.koshpal.com/coaches/sarah-johnson.jpg"
  },
  "bookedAt": "2025-12-27T11:00:00.000Z"
}
```

**Returns:** `null` if no consultations exist

---

### 11.8 Get Consultation Details
**GET** `/api/v1/employee/consultations/:id`

Get detailed information about a specific consultation by ID.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "slotId": "uuid",
  "employeeId": "uuid",
  "coachId": "uuid",
  "meetingLink": "https://meet.google.com/abc-defg-hij",
  "status": "CONFIRMED",
  "notes": "Discuss debt repayment strategies and emergency fund planning",
  "bookedAt": "2025-12-27T11:00:00.000Z",
  "cancelledAt": null,
  "cancellationReason": null,
  "slot": {
    "id": "uuid",
    "date": "2025-12-30T00:00:00.000Z",
    "startTime": "2025-12-30T09:00:00.000Z",
    "endTime": "2025-12-30T10:00:00.000Z"
  },
  "coach": {
    "id": "uuid",
    "email": "sarah.johnson@koshpal.com",
    "coachProfile": {
      "firstName": "Sarah",
      "lastName": "Johnson",
      "bio": "Certified financial coach with over 10 years of experience",
      "expertise": ["Debt Management", "Investment Planning", "Retirement Planning"],
      "phoneNumber": "+91-9876543210",
      "photoUrl": "https://storage.koshpal.com/coaches/sarah-johnson.jpg",
      "linkedinUrl": "https://linkedin.com/in/sarahjohnson",
      "certifications": ["CFP", "AFC"],
      "yearsOfExperience": 10,
      "averageRating": 4.8,
      "totalRatings": 127
    }
  },
  "createdAt": "2025-12-27T11:00:00.000Z",
  "updatedAt": "2025-12-27T11:00:00.000Z"
}
```

**Error Responses:**
- `404 Not Found` - Consultation doesn't exist or doesn't belong to user

---

### 11.9 Cancel Consultation (Employee)
**PATCH** `/api/v1/employee/consultations/:id/cancel`

Cancel a scheduled consultation. The coach's time slot automatically becomes AVAILABLE again.

**Rate Limit:** 20 cancellations per hour  
**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`  
**Access:** Protected (Employee only)

**Request Body:**
```json
{
  "reason": "Schedule conflict" 
}
```

**Response:** `200 OK`
```json
{
  "message": "Consultation cancelled successfully",
  "consultation": {
    "id": "uuid",
    "status": "CANCELLED",
    "cancelledAt": "2025-12-27T12:00:00.000Z",
    "cancellationReason": "Schedule conflict"
  },
  "slot": {
    "id": "uuid",
    "status": "AVAILABLE"
  },
  "notificationsSent": {
    "employee": true,
    "coach": true
  }
}
```

**Business Rules:**
- Can only cancel CONFIRMED consultations
- Cannot cancel past or ongoing consultations
- Slot status automatically changes to AVAILABLE
- Both employee and coach receive email notifications
- Cancellation history preserved for record-keeping

**Error Responses:**
- `404 Not Found` - Consultation doesn't exist or doesn't belong to user
- `400 Bad Request` - Consultation already cancelled or in the past
- `429 Too Many Requests` - Rate limit exceeded (20/hour)

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`

**Response:** `200 OK`
```json
{
  "total": 50,
  "past": 30,
  "upcoming": 20,
  "thisMonth": 10,
  "confirmed": 45,
  "cancelled": 5,
  "averageRating": 4.5,
  "totalMinutes": 3000,
  "totalHours": 50.0
}
```

---

### 9.7 Get Coach Profile
**GET** `/api/v1/coach/profile`

Get coach's own profile information.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "fullName": "Dr. Jane Smith",
  "expertise": ["Investment Planning", "Tax Planning", "Retirement Planning"],
  "bio": "Certified financial planner with 10 years of experience helping individuals achieve their financial goals.",
  "rating": 4.5,
  "successRate": 95,
  "clientsHelped": 150,
  "location": "Mumbai, India",
  "languages": ["English", "Hindi", "Marathi"],
  "profilePhoto": "https://example.com/photo.jpg",
  "certifications": ["CFP", "CFA Level 2"],
  "yearsOfExperience": 10
}
```

---

### 9.8 Update Coach Profile
**PATCH** `/api/v1/coach/profile`

Update coach profile information.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`

**Request Body:**
```json
{
  "fullName": "Dr. Jane Smith",
  "expertise": ["Investment Planning", "Tax Planning", "Retirement Planning"],
  "bio": "Certified financial planner with 10 years of experience",
  "profilePhoto": "https://example.com/photo.jpg",
  "location": "Mumbai, India",
  "languages": ["English", "Hindi", "Marathi"],
  "certifications": ["CFP", "CFA Level 2"]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "fullName": "Dr. Jane Smith",
  "expertise": ["Investment Planning", "Tax Planning", "Retirement Planning"],
  "bio": "Certified financial planner with 10 years of experience",
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

---

## Employee Consultations

### 10.1 Get All Coaches
**GET** `/api/v1/employee/coaches`

Get list of all available coaches.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "email": "coach@koshpal.com",
    "fullName": "Dr. Jane Smith",
    "expertise": ["Investment Planning", "Tax Planning", "Debt Management"],
    "bio": "Certified financial planner with 10 years of experience",
    "rating": 4.5,
    "successRate": 95,
    "clientsHelped": 150,
    "location": "Mumbai, India",
    "languages": ["English", "Hindi", "Marathi"],
    "profilePhoto": "https://example.com/photo.jpg",
    "certifications": ["CFP", "CFA Level 2"],
    "yearsOfExperience": 10
  }
]
```

---

### 10.2 Get Aggregated Coach Slots
**GET** `/api/v1/employee/coaches/slots`

Get all active coaches with their available slots for a specific date in a single request. 
This endpoint is optimized for bulk data retrieval to prevent throttling issues.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Query Parameters:**
- `date` (required): Date in YYYY-MM-DD format

**Response:** `200 OK`
```json
[
  {
    "coachId": "uuid",
    "coachName": "Dr. Jane Smith",
    "coachEmail": "coach@koshpal.com",
    "expertise": ["Investment Planning", "Tax Planning"],
    "rating": 4.5,
    "profilePhoto": "https://example.com/photo.jpg",
    "slots": [
      {
        "slotId": "uuid",
        "startTime": "2025-12-22T10:00:00.000Z",
        "endTime": "2025-12-22T11:00:00.000Z",
        "status": "AVAILABLE"
      },
      {
        "slotId": "uuid",
        "startTime": "2025-12-22T14:00:00.000Z",
        "endTime": "2025-12-22T15:00:00.000Z",
        "status": "AVAILABLE"
      }
    ]
  }
]
```

**Error Responses:**
- `400 Bad Request` - Date parameter missing or invalid format

**Rate Limit:** 50 requests per 10 seconds (optimized for this endpoint)

---

### 10.3 Get Coach Slots
**GET** `/api/v1/employee/coaches/:coachId/slots`

Get available slots for a specific coach.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Query Parameters:**
- `date` (optional): Filter by specific date (YYYY-MM-DD)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "coachId": "uuid",
    "date": "2025-12-20T00:00:00.000Z",
    "startTime": "2025-12-20T09:00:00.000Z",
    "endTime": "2025-12-20T10:00:00.000Z",
    "status": "AVAILABLE"
  },
  {
    "id": "uuid",
    "coachId": "uuid",
    "date": "2025-12-20T00:00:00.000Z",
    "startTime": "2025-12-20T10:00:00.000Z",
    "endTime": "2025-12-20T11:00:00.000Z",
    "status": "AVAILABLE"
  }
]
```

---

### 10.4 Book Consultation
**POST** `/api/v1/employee/consultations/book`

Book a consultation with a coach.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Request Body:**
```json
{
  "slotId": "uuid",
  "notes": "Want to discuss investment options and tax planning strategies"
}
```

**Response:** `201 Created`
```json
{
  "message": "Consultation booked successfully",
  "booking": {
    "id": "uuid",
    "meetingLink": "https://meet.google.com/abc-xyz",
    "slot": {
      "date": "2025-12-20T00:00:00.000Z",
      "startTime": "2025-12-20T09:00:00.000Z",
      "endTime": "2025-12-20T10:00:00.000Z"
    },
    "coach": {
      "fullName": "Dr. Jane Smith",
      "email": "coach@koshpal.com"
    },
    "status": "CONFIRMED",
    "bookedAt": "2025-12-19T10:00:00.000Z"
  }
}
```

**Error Responses:**
- `400 Bad Request` - Slot already booked or invalid slot ID
- `404 Not Found` - Slot not found
- `409 Conflict` - You already have a booking for this time

**Rate Limit:** 10 requests per minute (prevents abuse)

**Note:** Automatically generates Google Meet link and sends email notifications to both employee and coach.

---

### 10.5 Get My Consultations
**GET** `/api/v1/employee/consultations`

Get all consultations for logged-in employee.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Query Parameters:**
- `filter` (optional): Filter consultations
  - `past`: Past consultations (end time < now)
  - `upcoming`: Upcoming consultations (start time >= now)
  - `thisWeek`: This week's consultations (Sun-Sat)
  - `thisMonth`: This month's consultations
  - Default: All consultations

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "meetingLink": "https://meet.google.com/abc-xyz",
    "status": "CONFIRMED",
    "notes": "Discuss investment options",
    "bookedAt": "2025-12-15T10:00:00.000Z",
    "slot": {
      "id": "uuid",
      "date": "2025-12-20T00:00:00.000Z",
      "startTime": "2025-12-20T09:00:00.000Z",
      "endTime": "2025-12-20T10:00:00.000Z",
      "status": "BOOKED"
    },
    "coach": {
      "id": "uuid",
      "email": "coach@koshpal.com",
      "fullName": "Dr. Jane Smith",
      "expertise": ["Investment Planning", "Tax Planning"],
      "rating": 4.5,
      "location": "Mumbai, India",
      "profilePhoto": "https://example.com/photo.jpg"
    }
  }
]
```

---

### 10.6 Get Consultation Details
**GET** `/api/v1/employee/consultations/:id`

Get detailed information about a specific consultation.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "meetingLink": "https://meet.google.com/abc-xyz",
  "status": "CONFIRMED",
  "notes": "Discuss investment options and tax planning",
  "bookedAt": "2025-12-15T10:00:00.000Z",
  "slot": {
    "id": "uuid",
    "date": "2025-12-20T00:00:00.000Z",
    "startTime": "2025-12-20T09:00:00.000Z",
    "endTime": "2025-12-20T10:00:00.000Z"
  },
  "coach": {
    "id": "uuid",
    "email": "coach@koshpal.com",
    "fullName": "Dr. Jane Smith",
    "expertise": ["Investment Planning", "Tax Planning"],
    "bio": "Certified financial planner with 10 years of experience",
    "rating": 4.5,
    "location": "Mumbai, India",
    "languages": ["English", "Hindi"],
    "profilePhoto": "https://example.com/photo.jpg"
  }
}
```

**Error Responses:**
- `404 Not Found` - Consultation not found or doesn't belong to user

---

### 10.7 Get Consultation Stats
**GET** `/api/v1/employee/consultations/stats`

Get consultation statistics for logged-in employee.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Response:** `200 OK`
```json
{
  "total": 10,
  "past": 5,
  "upcoming": 5,
  "thisWeek": 2,
  "thisMonth": 4,
  "minutesBooked": 600,
  "hoursBooked": 10.0,
  "confirmed": 8,
  "cancelled": 2,
  "averageSessionDuration": 60
}
```

---

### 10.8 Get Latest Consultation
**GET** `/api/v1/employee/consultations/latest`

Get the most recently booked consultation.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "meetingLink": "https://meet.google.com/abc-xyz",
  "status": "CONFIRMED",
  "bookedAt": "2025-12-15T10:00:00.000Z",
  "slot": {
    "id": "uuid",
    "date": "2025-12-20T00:00:00.000Z",
    "startTime": "2025-12-20T09:00:00.000Z",
    "endTime": "2025-12-20T10:00:00.000Z",
    "status": "BOOKED"
  },
  "coach": {
    "id": "uuid",
    "email": "coach@koshpal.com",
    "fullName": "Dr. Jane Smith",
    "expertise": ["Investment Planning"],
    "rating": 4.5,
    "location": "Mumbai, India",
    "profilePhoto": "https://example.com/photo.jpg"
  }
}
```

**Response when no consultations:** `200 OK`
```json
null
```

**Note:** Returns `null` if employee has no consultations.

---

## Error Responses

### Standard Error Format
```json
{
  "statusCode": 400,
  "message": "Error message",
  "error": "Bad Request"
}
```

### Common Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (duplicate)
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error

---

## Rate Limits

### Global Rate Limits
- **Default:** 2000 requests per minute per IP
- **Authentication endpoints:** 100 requests per minute
- **Login endpoint:** 50 attempts per minute (brute force protection)
- **Consultation booking:** 10 requests per minute per user
- **Coach slots aggregated endpoint:** 50 requests per 10 seconds

### Rate Limit Headers
All API responses include rate limit information:
```
X-RateLimit-Limit: 2000
X-RateLimit-Remaining: 1995
X-RateLimit-Reset: 1640000000
```

### Rate Limit Exceeded Response
**Status:** `429 Too Many Requests`
```json
{
  "statusCode": 429,
  "message": "Too many requests, please try again later",
  "error": "Too Many Requests"
}
```

---

## Data Models

### User Roles
- `ADMIN`: Platform administrator with full access
- `HR`: Company HR with employee management capabilities
- `EMPLOYEE`: Individual user with personal finance features
- `COACH`: Financial coach with consultation capabilities

### Account Types
- `SAVINGS`: Savings account
- `CURRENT`: Current/checking account
- `CREDIT_CARD`: Credit card account
- `WALLET`: Digital wallet
- `INVESTMENT`: Investment account

### Transaction Types
- `INCOME`: Money received
- `EXPENSE`: Money spent

### Transaction Sources
- `BANK`: Bank transaction (auto-imported)
- `MANUAL`: Manually entered
- `MOBILE`: From mobile SMS parsing
- `EMAIL`: From email parsing
- `API`: Via API integration

### Consultation Status
- `PENDING`: Consultation requested
- `CONFIRMED`: Consultation confirmed
- `CANCELLED`: Consultation cancelled
- `COMPLETED`: Consultation completed

### Slot Status
- `AVAILABLE`: Slot available for booking
- `BOOKED`: Slot booked by an employee
- `CANCELLED`: Slot cancelled by coach

### Upload Batch Status
- `PENDING`: Upload received, waiting to process
- `PROCESSING`: Currently processing rows
- `COMPLETED`: All rows processed
- `FAILED`: Upload failed

---

## Validation Rules

### Password Requirements
- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number
- Special characters recommended but not required

### Email Format
- Must be a valid email address
- Domain validation enabled
- Max length: 255 characters

### Phone Number Format
- International format preferred: +[country code][number]
- Example: +919876543210
- Min length: 10 digits
- Max length: 15 digits

### Date Formats
- **Dates:** YYYY-MM-DD (ISO 8601)
- **DateTime:** YYYY-MM-DDTHH:mm:ss.sssZ (ISO 8601 with timezone)
- **Time:** HH:mm (24-hour format)

### Financial Values
- Amounts: Decimal with 2 decimal places
- Currency: INR (Indian Rupees) by default
- Negative values not allowed for amounts
- Max amount: 99,999,999.99

### File Uploads
- **CSV files:** Max 10MB
- **Profile photos:** Max 5MB
- **Allowed image formats:** JPG, PNG, WEBP
- **CSV columns:** Must match expected format exactly

---

## Error Handling

### Standard Error Response Format
```json
{
  "statusCode": 400,
  "message": "Detailed error message",
  "error": "Bad Request",
  "timestamp": "2025-12-19T10:00:00.000Z",
  "path": "/api/v1/resource"
}
```

### Validation Error Response
```json
{
  "statusCode": 400,
  "message": [
    "email must be a valid email address",
    "password must be longer than or equal to 8 characters"
  ],
  "error": "Bad Request"
}
```

### Common HTTP Status Codes
- `200 OK`: Request successful
- `201 Created`: Resource created successfully
- `204 No Content`: Request successful with no response body
- `400 Bad Request`: Invalid request data or validation error
- `401 Unauthorized`: Authentication required or invalid token
- `403 Forbidden`: Insufficient permissions for the action
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource conflict (e.g., duplicate entry)
- `422 Unprocessable Entity`: Semantic validation error
- `429 Too Many Requests`: Rate limit exceeded
- `500 Internal Server Error`: Server error (logged for investigation)
- `503 Service Unavailable`: Service temporarily unavailable

### Error Codes by Category

#### Authentication Errors (401)
- `INVALID_CREDENTIALS`: Email or password incorrect
- `TOKEN_EXPIRED`: JWT token has expired
- `INVALID_TOKEN`: JWT token is malformed or invalid
- `SESSION_REVOKED`: Refresh token has been revoked

#### Authorization Errors (403)
- `INSUFFICIENT_PERMISSIONS`: User lacks required role
- `COMPANY_MISMATCH`: Resource belongs to different company
- `ACCOUNT_DISABLED`: User account is inactive

#### Validation Errors (400)
- `MISSING_REQUIRED_FIELD`: Required field not provided
- `INVALID_FORMAT`: Data format is incorrect
- `VALUE_OUT_OF_RANGE`: Value exceeds allowed range

#### Resource Errors (404)
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `USER_NOT_FOUND`: User not found
- `ACCOUNT_NOT_FOUND`: Account not found

#### Conflict Errors (409)
- `DUPLICATE_EMAIL`: Email already registered
- `SLOT_ALREADY_BOOKED`: Time slot already booked
- `DUPLICATE_ACCOUNT`: Account with same details exists

---

## Security Features

### JWT Tokens
- **Access Token Expiry:** 15 minutes
- **Refresh Token Expiry:** 7 days
- **Algorithm:** HS256
- **Issuer:** koshpal-api
- Tokens include: userId, email, role, companyId

### Session Management
- Device tracking (IP, User-Agent, Device ID)
- Multiple concurrent sessions supported
- Session revocation on password change
- Manual session revocation available

### Data Protection
- Passwords hashed with bcrypt (10 rounds)
- Account numbers always masked (****XXXX)
- Sensitive data encrypted at rest
- HTTPS required for all endpoints

### Request Security
- CORS enabled for allowed origins
- CSRF protection enabled
- SQL injection prevention via Prisma ORM
- XSS protection via input sanitization
- Rate limiting on all endpoints

---

## Best Practices

### Authentication
1. Store tokens securely (httpOnly cookies or secure storage)
2. Refresh tokens before they expire
3. Clear tokens on logout
4. Never expose tokens in URLs or logs
5. Use HTTPS for all API calls

### Pagination & Performance
1. Use pagination for large datasets
2. Limit query results to necessary data
3. Use filters to reduce response size
4. Cache frequently accessed data client-side
5. Use aggregated endpoints when available (e.g., `/employee/coaches/slots`)

### Error Handling
1. Always check response status codes
2. Display user-friendly error messages
3. Log errors for debugging
4. Implement retry logic for network errors
5. Handle token expiration gracefully

### Transaction Management
1. Provide `accountId` when known for better tracking
2. Include metadata (bank, maskedAccountNo) for auto-matching
3. Transactions without accounts are acceptable
4. Use bulk endpoints for multiple transactions
5. Keep transaction descriptions clear and consistent

### Data Consistency
1. Regenerate insights after bulk transaction updates
2. Verify account ownership before operations
3. Validate date ranges before querying
4. Use UTC timezone for all datetime values
5. Keep budget values realistic and updated

---

## Webhooks & Background Jobs

### Background Job Processing
The API uses Bull Queue for asynchronous processing:

#### Employee Upload Worker
- Processes CSV uploads asynchronously
- Validates each row before insertion
- Provides detailed error reporting
- Updates batch status in real-time

#### Consultation Worker
- Sends email notifications for bookings
- Generates Google Meet links
- Sends reminders before consultations
- Processes cancellations

#### Insights Worker
- Regenerates monthly summaries
- Calculates spending trends
- Updates category breakdowns
- Processes batch calculations

### Job Monitoring
Use the batch ID to monitor job progress:
```bash
GET /api/v1/hr/uploads/:batchId
```

---

## Environment Variables

### Required Configuration
```bash
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/koshpal"

# JWT Secrets
JWT_SECRET="your-jwt-secret-key"
JWT_REFRESH_SECRET="your-refresh-secret-key"

# Redis (for queues and caching)
REDIS_URL="redis://localhost:6379"

# Email Service
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_USER="noreply@koshpal.com"
SMTP_PASSWORD="your-smtp-password"

# Application
NODE_ENV="production"
PORT=3000
CORS_ORIGIN="https://app.koshpal.com"

# Google Meet (for consultations)
GOOGLE_MEET_API_KEY="your-google-api-key"
```

---

## Deployment Checklist

### Pre-Deployment
- [ ] Update environment variables
- [ ] Run database migrations
- [ ] Seed initial data (admin user, coaches)
- [ ] Configure CORS origins
- [ ] Set up Redis connection
- [ ] Configure email service
- [ ] Enable HTTPS/SSL

### Post-Deployment
- [ ] Verify health endpoints
- [ ] Test authentication flow
- [ ] Verify rate limiting
- [ ] Check database connections
- [ ] Monitor error logs
- [ ] Test email notifications
- [ ] Verify background jobs

---

## API Versioning

Current version: **v1**

Base path: `/api/v1/`

### Version Strategy
- API versioning via URL path
- Breaking changes require new version
- Old versions supported for 6 months after new version release
- Deprecation notices sent 3 months before version sunset

---

## Support & Resources

### Documentation
- **API Docs:** https://docs.koshpal.com/api
- **Postman Collection:** Available in repository root
- **GitHub:** https://github.com/koshpal/backend

### Contact
- **Technical Support:** api-support@koshpal.com
- **Security Issues:** security@koshpal.com
- **General Inquiries:** contact@koshpal.com

### SLA
- **Uptime Target:** 99.9%
- **Response Time:** < 500ms (p95)
- **Support Response:** < 24 hours

---

**Version History:**
- **v1.1.0** (Dec 27, 2025): Added comprehensive documentation, HR dashboard endpoints, aggregated coach slots endpoint
- **v1.0.0** (Dec 17, 2025): Initial release

---

**Last Updated:** December 27, 2025

**Maintained by:** Koshpal Development Team
