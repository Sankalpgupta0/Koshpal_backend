# Koshpal Backend API Documentation V1

**Version:** 1.0.0  
**Base URL:** `http://localhost:3000`  
**Last Updated:** December 17, 2025

## Table of Contents
1. [Authentication](#authentication)
2. [Health Check](#health-check)
3. [Admin Portal](#admin-portal)
4. [HR Management](#hr-management)
5. [Employee Portal](#employee-portal)
6. [Accounts](#accounts)
7. [Financial Goals](#financial-goals)
8. [Transactions](#transactions)
9. [Insights & Budget](#insights--budget)
10. [Coach Portal](#coach-portal)
11. [Employee Consultations](#employee-consultations)
12. [Error Responses](#error-responses)
13. [Rate Limits](#rate-limits)
14. [Date & Time Format](#date--time-format)
15. [Pagination](#pagination)

---

## Authentication

### 1.1 Login
**POST** `/api/v1/auth/login`

Authenticate user and receive access tokens. Supports all roles: EMPLOYEE, HR, ADMIN, COACH.

**Rate Limit:** 50 requests per minute

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "jwt-access-token",
  "refreshToken": "jwt-refresh-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "EMPLOYEE",
    "companyId": "uuid"
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

---

### 1.2 Get Current User
**GET** `/api/v1/auth/me`

Get currently authenticated user's information.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:** `200 OK`
```json
{
  "userId": "uuid",
  "email": "user@example.com",
  "role": "EMPLOYEE",
  "companyId": "uuid"
}
```

---

### 1.3 Refresh Access Token
**POST** `/api/v1/auth/refresh`

Generate new access token using refresh token.

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

Logout user and revoke refresh token.

**Headers:** `Authorization: Bearer {accessToken}`

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

**Note:** Revokes the refresh token in database. Client should delete stored tokens.

---

### 1.5 Get Active Sessions
**GET** `/api/v1/auth/sessions`

Get all active sessions for current user.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "deviceId": "device-123",
    "deviceName": "Chrome on macOS",
    "ipAddress": "192.168.1.1",
    "location": "Mumbai, India",
    "lastActivity": "2025-12-19T10:00:00.000Z",
    "createdAt": "2025-12-15T08:00:00.000Z"
  }
]
```

---

### 1.6 Revoke All Sessions
**POST** `/api/v1/auth/sessions/revoke-all`

Logout from all devices by revoking all active sessions.

**Headers:** `Authorization: Bearer {accessToken}`

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

---

### 1.7 Change Password
**PATCH** `/api/v1/auth/me/password`

Change password for authenticated user.

**Headers:** `Authorization: Bearer {accessToken}`

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

**Security Note:** Automatically revokes all sessions after password change. User must log in again with new password.

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

Update HR account status (active/inactive).

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

### 3.10 Get Platform Stats
**GET** `/api/v1/admin/stats`

Get platform-wide statistics.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

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

### 4.7 Get Company Insights Summary
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

## Employee Portal

### 5.1 Get My Profile
**GET** `/api/v1/employee/profile`

Get logged-in employee's profile information.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "email": "employee@techcorp.com",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "dateOfBirth": "1990-01-01",
    "phoneNumber": "+1234567890",
    "position": "Software Engineer",
    "department": "Engineering",
    "salary": 75000
  }
}
```

---

### 5.2 Update My Profile
**PATCH** `/api/v1/employee/profile`

Update logged-in employee's profile.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Request Body:**
```json
{
  "phoneNumber": "+1234567899",
  "address": "New Address 123"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "profile": {
    "phoneNumber": "+1234567899",
    "address": "New Address 123"
  }
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

### 5.4 Delete Account
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
    "title": "Emergency Fund",
    "targetAmount": 10000,
    "currentAmount": 5000,
    "deadline": "2025-12-31T00:00:00.000Z",
    "category": "SAVINGS",
    "status": "IN_PROGRESS",
    "progress": 50
  }
]
```

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
  "targetAmount": 5000,
  "currentAmount": 1000,
  "deadline": "2025-06-30",
  "category": "SAVINGS",
  "description": "Summer vacation to Europe"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "title": "Vacation Fund",
  "targetAmount": 5000,
  "currentAmount": 1000,
  "progress": 20,
  "status": "IN_PROGRESS"
}
```

---

### 6.3 Update Goal
**PATCH** `/api/v1/employee/goals/:goalId`

Update an existing financial goal.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Request Body:**
```json
{
  "currentAmount": 2000,
  "targetAmount": 6000
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "currentAmount": 2000,
  "targetAmount": 6000,
  "progress": 33.33
}
```

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
  "description": "Updated description"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "amount": 1600,
  "category": "Food & Dining",
  "description": "Updated description"
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

### 8.1 Get Monthly Summary
**GET** `/api/v1/insights/monthly-summary`

Get monthly financial summary for logged-in user.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Query Parameters:**
- `year` (required): Year (e.g., 2025)
- `month` (required): Month (1-12)

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

### 8.2 Generate/Refresh Monthly Summary
**POST** `/api/v1/insights/generate`

Generate or refresh monthly summary from transactions.

**Headers:** `Authorization: Bearer {token}`  
**Role Required:** `EMPLOYEE`, `ADMIN`

**Request Body:**
```json
{
  "year": 2025,
  "month": 12
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
    "savingsRate": 40
  }
}
```

**Note:** This endpoint recalculates all metrics from actual transaction data and updates or creates the monthly summary.

---

### 8.3 Update Monthly Budget
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

## Coach Portal

### 9.1 Create Slots
**POST** `/api/v1/coach/slots`

Create availability slots for consultations.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`

**Request Body:**
```json
{
  "date": "2025-12-20",
  "timeSlots": [
    {
      "startTime": "09:00",
      "endTime": "10:00"
    },
    {
      "startTime": "10:00",
      "endTime": "11:00"
    }
  ]
}
```

**Response:** `201 Created`
```json
{
  "message": "Slots created successfully",
  "count": 2,
  "slots": [
    {
      "id": "uuid",
      "date": "2025-12-20T00:00:00.000Z",
      "startTime": "2025-12-20T09:00:00.000Z",
      "endTime": "2025-12-20T10:00:00.000Z",
      "status": "AVAILABLE"
    }
  ]
}
```

---

### 9.2 Get My Slots
**GET** `/api/v1/coach/slots`

Get all slots created by the coach.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`

**Query Parameters:**
- `date` (optional): Filter by specific date (YYYY-MM-DD)
- `status` (optional): Filter by status (AVAILABLE, BOOKED, CANCELLED)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "date": "2025-12-20T00:00:00.000Z",
    "startTime": "2025-12-20T09:00:00.000Z",
    "endTime": "2025-12-20T10:00:00.000Z",
    "status": "AVAILABLE"
  }
]
```

---

### 9.3 Update Slot
**PATCH** `/api/v1/coach/slots/:slotId`

Update a specific slot.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`

**Request Body:**
```json
{
  "status": "CANCELLED"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "status": "CANCELLED"
}
```

---

### 9.4 Delete Slot
**DELETE** `/api/v1/coach/slots/:slotId`

Delete a slot (only if AVAILABLE).

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`

**Response:** `200 OK`
```json
{
  "message": "Slot deleted successfully"
}
```

---

### 9.5 Get My Consultations
**GET** `/api/v1/coach/consultations`

Get all consultations for the coach.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`

**Query Parameters:**
- `filter` (optional): Filter consultations
  - `past`: Past consultations
  - `upcoming`: Upcoming consultations
  - `thisMonth`: This month's consultations
  - `all`: All consultations (default)

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "meetingLink": "https://meet.google.com/abc-xyz",
    "status": "CONFIRMED",
    "bookedAt": "2025-12-15T10:00:00.000Z",
    "slot": {
      "id": "uuid",
      "date": "2025-12-20T00:00:00.000Z",
      "startTime": "2025-12-20T09:00:00.000Z",
      "endTime": "2025-12-20T10:00:00.000Z"
    },
    "employee": {
      "id": "uuid",
      "email": "employee@techcorp.com",
      "firstName": "John",
      "lastName": "Doe"
    }
  }
]
```

---

### 9.6 Get Consultation Stats
**GET** `/api/v1/coach/consultations/stats`

Get consultation statistics for the coach.

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
  "totalMinutes": 3000
}
```

---

### 9.7 Update Coach Profile
**PATCH** `/api/v1/coach/profile`

Update coach profile information.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`

**Request Body:**
```json
{
  "fullName": "Dr. Jane Smith",
  "expertise": ["Investment Planning", "Tax Planning"],
  "bio": "Certified financial planner with 10 years of experience",
  "profilePhoto": "https://example.com/photo.jpg",
  "location": "Mumbai, India",
  "languages": ["English", "Hindi"]
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "fullName": "Dr. Jane Smith",
  "expertise": ["Investment Planning", "Tax Planning"],
  "bio": "Certified financial planner with 10 years of experience"
}
```

---

### 9.8 Get Coach Profile
**GET** `/api/v1/coach/profile`

Get coach's profile information.

**Headers:** `Authorization: Bearer {coachToken}`  
**Role Required:** `COACH`

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "userId": "uuid",
  "fullName": "Dr. Jane Smith",
  "expertise": ["Investment Planning", "Tax Planning"],
  "bio": "Certified financial planner with 10 years of experience",
  "rating": 4.5,
  "successRate": 95,
  "clientsHelped": 150,
  "location": "Mumbai, India",
  "languages": ["English", "Hindi"],
  "profilePhoto": "https://example.com/photo.jpg"
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
    "expertise": ["Investment Planning", "Tax Planning"],
    "bio": "Certified financial planner",
    "rating": 4.5,
    "successRate": 95,
    "clientsHelped": 150,
    "location": "Mumbai, India",
    "languages": ["English", "Hindi"],
    "profilePhoto": "https://example.com/photo.jpg"
  }
]
```

---

### 10.2 Get Coach Slots
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
  }
]
```

---

### 10.3 Book Consultation
**POST** `/api/v1/employee/consultations/book`

Book a consultation with a coach.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Request Body:**
```json
{
  "slotId": "uuid",
  "notes": "Want to discuss investment options"
}
```

**Response:** `201 Created`
```json
{
  "message": "Consultation booked successfully",
  "booking": {
    "id": "uuid",
    "meetingLink": "https://meet.google.com/abc-xyz",
    "date": "2025-12-20T00:00:00.000Z",
    "startTime": "2025-12-20T09:00:00.000Z",
    "endTime": "2025-12-20T10:00:00.000Z"
  }
}
```

---

### 10.4 Get My Consultations
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
]
```

---

### 10.5 Get Consultation Stats
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
  "confirmed": 8,
  "cancelled": 2
}
```

---

### 10.6 Get Latest Consultation
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

- **Default:** 2000 requests per minute
- **Authentication:** 100 requests per minute
- **Login:** 50 attempts per minute

---

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer {accessToken}
```

Tokens expire after 15 minutes. Use the refresh token endpoint to get a new access token.

---

## Date & Time Format

- **Dates:** ISO 8601 format (YYYY-MM-DD)
- **DateTime:** ISO 8601 format with timezone (YYYY-MM-DDTHH:mm:ss.sssZ)
- **Time:** 24-hour format (HH:mm)

---

## Pagination

Endpoints supporting pagination use query parameters:
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10, max: 100)

Response includes:
```json
{
  "data": [],
  "meta": {
    "page": 1,
    "limit": 10,
    "total": 50,
    "totalPages": 5
  }
}
```

---

## Support

For API support or questions:
- Email: api-support@koshpal.com
- Documentation: https://docs.koshpal.com

**Version History:**
- v1.0.0 (Dec 17, 2025): Initial release
