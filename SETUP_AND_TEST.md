# Setup and Testing Guide

## Prerequisites

Ensure you have these running:
1. **PostgreSQL** - Database server
2. **Redis** - Message queue and cache
3. **Node.js** - Runtime environment

## Quick Start (5 minutes)

### 1. Terminal 1 - Start Backend
```bash
cd /Users/sankalpgupta/Desktop/Koshpal/PRODUCT/koshpal-backend

# Clean any old data
npm run build

# Start the backend server
npm run start:dev
```

Expected output:
```
[Nest] 94048 - 12/15/2025, 11:05:02 PM LOG [NestFactory] Starting Nest application...
[Nest] 94048 - 12/15/2025, 11:05:03 PM LOG [InstanceLoader] PrismaModule dependencies initialized
...
[Nest] 94048 - 12/15/2025, 11:05:03 PM LOG [NestApplication] Nest application successfully started
```

### 2. Terminal 2 - Start Worker
```bash
cd /Users/sankalpgupta/Desktop/Koshpal/PRODUCT/koshpal-backend

# Make sure database is clean
psql -d koshpal -c "DELETE FROM \"EmployeeUploadBatch\" WHERE status='PENDING';"

# Clear Redis
redis-cli FLUSHDB

# Start the worker
npm run worker:dev
```

Expected output:
```
============================================================
[WORKER] Employee Upload Worker Starting...
[WORKER] Redis: localhost:6379
[WORKER] Environment: development
============================================================
[WORKER] ✓ Worker initialized and listening for jobs...
[WORKER] Press Ctrl+C to stop

[WORKER] 🟢 Worker ready to process jobs
```

### 3. Terminal 3 - Send Test Upload

#### Step 1: Create a test Excel file
Create a file named `employees.xlsx` with this structure:

| email | full_name | employee_code | phone |
|-------|-----------|---------------|-------|
| john@example.com | John Doe | EMP001 | +1234567890 |
| jane@example.com | Jane Smith | EMP002 | +9876543210 |
| bob@example.com | Bob Johnson | EMP003 | |

#### Step 2: Get an auth token
```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@company.com",
    "password": "password123"
  }'
```

**Note:** If this fails, you need to seed a user first:
```bash
npm run build && npx prisma db seed
```

#### Step 3: Upload the Excel file
```bash
# Replace ADMIN_TOKEN with the token from step 2
ADMIN_TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/v1/hr/employees/upload \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "file=@employees.xlsx"
```

Expected response:
```json
{
  "message": "Upload started. Processing in background.",
  "batchId": "abc-123-def-456"
}
```

### 4. Monitor the Process

#### In Backend Terminal (Terminal 1):
You should see upload request logs:
```
[HR-SERVICE] 📤 New upload request from HR user: user-123
[HR-SERVICE] Company: company-1
[HR-SERVICE] File: employees.xlsx (4.56 KB)
[HR-SERVICE] 🔍 Checking for active uploads...
[HR-SERVICE] 💾 Creating upload batch record...
[HR-SERVICE] ✓ Batch created: abc-123-def-456
[HR-SERVICE] 📮 Adding job to queue...
[HR-SERVICE] ✅ Job queued successfully: job-123
```

#### In Worker Terminal (Terminal 2):
You should see job processing:
```
============================================================
[JOB-123] 🚀 Starting employee upload processing
[JOB-123] BatchId: abc-123-def-456
[JOB-123] CompanyId: company-1
[JOB-123] Attempt: 1
============================================================
[JOB-123] ✓ Batch status updated to PROCESSING
[JOB-123] 📄 Decoding file from base64...
[JOB-123] ✓ File decoded (1024 bytes)
[JOB-123] 📊 Parsing Excel file...
[JOB-123] ✓ Parsed 3 rows from sheet "Sheet1"
[JOB-123] 🔐 Generating default password hash...
[JOB-123] ✓ Password hash generated
[JOB-123] 👥 Processing 3 employee records...

[JOB-123] ✓ Progress: 3/3 employees created

[JOB-123] 💾 Updating batch summary...
============================================================
[JOB-123] ✅ Job completed successfully
[JOB-123] Duration: 2.34s
[JOB-123] Total: 3 | Success: 3 | Failed: 0
[JOB-123] Success Rate: 100.0%
============================================================
```

### 5. Check the Results

#### Query batch status
```bash
# Replace BATCH_ID with the batchId from upload response
curl -X GET http://localhost:3000/api/v1/hr/batches/abc-123-def-456 \
  -H "Authorization: Bearer $ADMIN_TOKEN"
```

Expected response:
```json
{
  "id": "abc-123-def-456",
  "status": "COMPLETED",
  "fileName": "employees.xlsx",
  "totalRecords": 3,
  "successRecords": 3,
  "failedRecords": 0,
  "createdAt": "2025-12-15T17:30:00.000Z",
  "updatedAt": "2025-12-15T17:30:05.000Z"
}
```

#### Check created employees in database
```bash
psql -d koshpal -c "SELECT email, \"role\" FROM \"User\" WHERE \"role\" = 'EMPLOYEE' ORDER BY \"createdAt\" DESC LIMIT 5;"
```

## Troubleshooting

### Issue: "Active batch found" error on second upload

**Solution:** The previous batch might still be in PENDING status. Clear it:
```bash
# Mark all pending batches as completed
psql -d koshpal -c "UPDATE \"EmployeeUploadBatch\" SET status='COMPLETED' WHERE status='PENDING';"

# Clear Redis
redis-cli FLUSHDB
```

Then try the upload again.

### Issue: Worker doesn't show any logs

**Problem:** Worker is not receiving jobs from Redis.

**Solution:**
1. Check Redis is running: `redis-cli ping` (should return PONG)
2. Check worker started successfully (should see "Worker ready to process jobs")
3. Clear Redis and retry: `redis-cli FLUSHDB`

### Issue: "File size exceeds limit" error

**Solution:** Excel file is larger than 5MB. Reduce file size or increase limit in hr.service.ts

### Issue: "Email already exists" in job logs

**Problem:** Trying to upload the same employee twice

**Solution:** Use different email addresses in Excel file or delete previous employees

## Complete Workflow Example

```bash
# 1. Start backend in terminal 1
npm run start:dev

# 2. Start worker in terminal 2  
npm run worker:dev

# 3. In terminal 3, login and get token
TOKEN=$(curl -s -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"password123"}' \
  | grep -o '"accessToken":"[^"]*"' | cut -d'"' -f4)

echo "Token: $TOKEN"

# 4. Create test file (manually or use a tool)
# Save employees.xlsx file with test data

# 5. Upload
BATCH_ID=$(curl -s -X POST http://localhost:3000/api/v1/hr/employees/upload \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@employees.xlsx" \
  | grep -o '"batchId":"[^"]*"' | cut -d'"' -f4)

echo "Batch ID: $BATCH_ID"

# 6. Check status in worker terminal
# You should see job processing logs

# 7. Query final status
curl -X GET http://localhost:3000/api/v1/hr/batches/$BATCH_ID \
  -H "Authorization: Bearer $TOKEN"
```

## Database Schema Reference

### EmployeeUploadBatch Table
- `id` - UUID, primary key
- `fileName` - Name of uploaded Excel file
- `totalRecords` - Total rows in file
- `successRecords` - Successfully created employees
- `failedRecords` - Failed records
- `status` - PENDING, PROCESSING, COMPLETED, or FAILED
- `companyId` - Company doing the upload
- `hrUserId` - HR user who uploaded
- `createdAt` - When batch was created
- `updatedAt` - Last update time

## Performance Tips

1. **Use smaller batches:** Upload 100-500 employees at a time
2. **Batch validation:** Check Excel format before uploading
3. **Duplicate checking:** Review emails before uploading
4. **Time of upload:** Upload during off-peak hours

## Production Checklist

- [ ] Change default password from "password123"
- [ ] Set strong JWT_SECRET
- [ ] Configure proper Redis persistence
- [ ] Set up database backups
- [ ] Configure email for password reset
- [ ] Set up monitoring/alerting
- [ ] Enable HTTPS
- [ ] Rate limit API endpoints
- [ ] Validate file contents more strictly
- [ ] Add email notifications for batch completion

## Support & Debugging

### Enable Debug Mode
Add to .env:
```
DEBUG=*
NODE_ENV=development
```

### Check System Health
```bash
# Redis health
redis-cli INFO stats

# Database connection
psql -d koshpal -c "SELECT 1;"

# Queue status
redis-cli LLEN bull:employee-upload:waiting
redis-cli LLEN bull:employee-upload:active
```

### View Logs
```bash
# Backend logs (see in terminal 1)
npm run start:dev 2>&1 | tee backend.log

# Worker logs (see in terminal 2)
npm run worker:dev 2>&1 | tee worker.log
```
