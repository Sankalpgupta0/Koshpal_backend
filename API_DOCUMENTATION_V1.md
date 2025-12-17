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
6. [Financial Goals](#financial-goals)
7. [Transactions](#transactions)
8. [Insights & Budget](#insights--budget)
9. [Coach Portal](#coach-portal)
10. [Employee Consultations](#employee-consultations)

---

## Authentication

### 1.1 Register User
**POST** `/api/v1/auth/register`

Register a new user account (Employee, HR, Admin, or Coach).

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "password123",
  "role": "EMPLOYEE",
  "companyId": "uuid" // Optional for EMPLOYEE
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "role": "EMPLOYEE"
}
```

---

### 1.2 Login
**POST** `/api/v1/auth/login`

Authenticate user and receive access tokens.

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
  "accessToken": "jwt-token",
  "refreshToken": "refresh-token",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "EMPLOYEE"
  }
}
```

---

### 1.3 Refresh Token
**POST** `/api/v1/auth/refresh`

Get new access token using refresh token.

**Request Body:**
```json
{
  "refreshToken": "refresh-token"
}
```

**Response:** `200 OK`
```json
{
  "accessToken": "new-jwt-token"
}
```

---

### 1.4 Logout
**POST** `/api/v1/auth/logout`

Invalidate refresh token and logout user.

**Headers:** `Authorization: Bearer {accessToken}`

**Response:** `200 OK`
```json
{
  "message": "Logged out successfully"
}
```

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

### 3.4 Update Company
**PATCH** `/api/v1/admin/companies/:companyId`

Update company information.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

**Request Body:**
```json
{
  "name": "Tech Corp Inc",
  "address": "456 New St"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "name": "Tech Corp Inc",
  "updatedAt": "2025-12-17T11:00:00.000Z"
}
```

---

### 3.5 Delete Company
**DELETE** `/api/v1/admin/companies/:companyId`

Delete a company from the system.

**Headers:** `Authorization: Bearer {adminToken}`  
**Role Required:** `ADMIN`

**Response:** `200 OK`
```json
{
  "message": "Company deleted successfully"
}
```

---

## HR Management

### 4.1 Create Employee
**POST** `/api/v1/hr/employees`

Create a new employee account.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Request Body:**
```json
{
  "email": "employee@techcorp.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "MALE",
  "phoneNumber": "+1234567890",
  "address": "789 Employee St",
  "salary": 75000,
  "position": "Software Engineer",
  "department": "Engineering",
  "hireDate": "2025-01-01"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "email": "employee@techcorp.com",
  "profile": {
    "firstName": "John",
    "lastName": "Doe",
    "position": "Software Engineer"
  }
}
```

---

### 4.2 Get All Employees
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
    "profile": {
      "firstName": "John",
      "lastName": "Doe",
      "position": "Software Engineer",
      "department": "Engineering"
    },
    "createdAt": "2025-01-01T00:00:00.000Z"
  }
]
```

---

### 4.3 Get Employee Details
**GET** `/api/v1/hr/employees/:employeeId`

Get detailed information about a specific employee.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

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
    "salary": 75000,
    "position": "Software Engineer",
    "department": "Engineering"
  },
  "accounts": [],
  "transactions": []
}
```

---

### 4.4 Update Employee
**PATCH** `/api/v1/hr/employees/:employeeId`

Update employee information.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Request Body:**
```json
{
  "salary": 80000,
  "position": "Senior Software Engineer"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "profile": {
    "salary": 80000,
    "position": "Senior Software Engineer"
  }
}
```

---

### 4.5 Delete Employee
**DELETE** `/api/v1/hr/employees/:employeeId`

Remove an employee from the system.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Response:** `200 OK`
```json
{
  "message": "Employee deleted successfully"
}
```

---

### 4.6 Bulk Upload Employees
**POST** `/api/v1/hr/employees/bulk-upload`

Upload multiple employees via CSV file.

**Headers:** `Authorization: Bearer {hrToken}`  
**Role Required:** `HR`

**Request:** `multipart/form-data`
- `file`: CSV file with employee data

**Response:** `201 Created`
```json
{
  "message": "Employees uploaded successfully",
  "count": 10,
  "employees": []
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

### 7.1 Get My Transactions
**GET** `/api/v1/employee/transactions`

Get all transactions for logged-in employee.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Query Parameters:**
- `startDate` (optional): Filter by start date (YYYY-MM-DD)
- `endDate` (optional): Filter by end date (YYYY-MM-DD)
- `type` (optional): Filter by type (INCOME, EXPENSE)
- `category` (optional): Filter by category

**Response:** `200 OK`
```json
[
  {
    "id": "uuid",
    "amount": 1500,
    "type": "EXPENSE",
    "category": "Groceries",
    "description": "Weekly shopping",
    "transactionDate": "2025-12-15T00:00:00.000Z",
    "source": "BANK"
  }
]
```

---

### 7.2 Create Transaction
**POST** `/api/v1/employee/transactions`

Create a new transaction.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Request Body:**
```json
{
  "accountId": "uuid",
  "amount": 1500,
  "type": "EXPENSE",
  "category": "Groceries",
  "description": "Weekly shopping",
  "transactionDate": "2025-12-15",
  "source": "BANK"
}
```

**Response:** `201 Created`
```json
{
  "id": "uuid",
  "amount": 1500,
  "type": "EXPENSE",
  "category": "Groceries",
  "balance": 23500
}
```

---

### 7.3 Update Transaction
**PATCH** `/api/v1/employee/transactions/:transactionId`

Update an existing transaction.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Request Body:**
```json
{
  "amount": 1600,
  "category": "Food & Dining"
}
```

**Response:** `200 OK`
```json
{
  "id": "uuid",
  "amount": 1600,
  "category": "Food & Dining"
}
```

---

### 7.4 Delete Transaction
**DELETE** `/api/v1/employee/transactions/:transactionId`

Delete a transaction.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Response:** `200 OK`
```json
{
  "message": "Transaction deleted successfully"
}
```

---

### 7.5 Get Transaction Summary
**GET** `/api/v1/employee/transactions/summary`

Get transaction summary (total income, expenses, balance).

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Query Parameters:**
- `startDate` (optional): Filter start date
- `endDate` (optional): Filter end date

**Response:** `200 OK`
```json
{
  "totalIncome": 50000,
  "totalExpenses": 30000,
  "balance": 20000,
  "transactionCount": 150
}
```

---

## Insights & Budget

### 8.1 Get My Insights
**GET** `/api/v1/employee/insights`

Get financial insights and spending patterns.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Response:** `200 OK`
```json
{
  "monthlyIncome": 50000,
  "monthlyExpenses": 30000,
  "savingsRate": 40,
  "topCategories": [
    {
      "category": "Groceries",
      "amount": 8000,
      "percentage": 26.67
    }
  ],
  "trends": {
    "incomeGrowth": 5.5,
    "expenseGrowth": 3.2
  }
}
```

---

### 8.2 Get Monthly Summary
**GET** `/api/v1/employee/insights/monthly-summary`

Get monthly financial summary.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Query Parameters:**
- `year` (required): Year (e.g., 2025)
- `month` (required): Month (1-12)

**Response:** `200 OK`
```json
{
  "year": 2025,
  "month": 12,
  "totalIncome": 50000,
  "totalExpenses": 30000,
  "savings": 20000,
  "budget": 35000,
  "spendingByCategory": {
    "Groceries": 8000,
    "Transport": 5000,
    "Entertainment": 3000
  }
}
```

---

### 8.3 Set Monthly Budget
**PATCH** `/api/v1/employee/insights/budget`

Set or update monthly budget.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

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
  "year": 2025,
  "month": 12,
  "budget": 35000,
  "message": "Budget updated successfully"
}
```

---

### 8.4 Get Current Budget
**GET** `/api/v1/employee/insights/budget`

Get current month's budget.

**Headers:** `Authorization: Bearer {employeeToken}`  
**Role Required:** `EMPLOYEE`

**Query Parameters:**
- `year` (optional): Year (defaults to current)
- `month` (optional): Month (defaults to current)

**Response:** `200 OK`
```json
{
  "year": 2025,
  "month": 12,
  "budget": 35000,
  "spent": 28000,
  "remaining": 7000,
  "percentageUsed": 80
}
```

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
