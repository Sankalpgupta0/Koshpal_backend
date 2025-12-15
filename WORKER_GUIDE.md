# Employee Upload Worker Guide

## Overview
The employee upload worker processes Excel files asynchronously using BullMQ and Redis.

## Prerequisites
- Redis running on localhost:6379 (or configure REDIS_HOST and REDIS_PORT)
- PostgreSQL database running and migrated
- Node.js and dependencies installed

## Running the Worker

### Development Mode
```bash
npm run worker:dev
```

### Production Mode
```bash
npm run build
npm run worker:prod
```

## Environment Variables
```bash
REDIS_HOST=localhost      # Default: localhost
REDIS_PORT=6379          # Default: 6379
DATABASE_URL=postgresql://...
NODE_ENV=development     # or production
```

## How It Works

1. **HR uploads Excel file** → API creates batch and queues job
2. **Worker picks up job** → Processes employees in background
3. **Updates batch status** → PENDING → PROCESSING → COMPLETED/FAILED

## Logs Explained

### Worker Startup
```
============================================================
[WORKER] Employee Upload Worker Starting...
[WORKER] Redis: localhost:6379
[WORKER] Environment: development
============================================================
[WORKER] ✓ Worker initialized and listening for jobs...
```

### Job Processing
```
============================================================
[JOB-123] 🚀 Starting employee upload processing
[JOB-123] BatchId: uuid-here
[JOB-123] CompanyId: company-uuid
[JOB-123] Attempt: 1
============================================================
[JOB-123] ✓ Batch status updated to PROCESSING
[JOB-123] 📄 Decoding file from base64...
[JOB-123] ✓ File decoded (45678 bytes)
[JOB-123] 📊 Parsing Excel file...
[JOB-123] ✓ Parsed 50 rows from sheet "Employees"
[JOB-123] 🔐 Generating default password hash...
[JOB-123] ✓ Password hash generated
[JOB-123] 👥 Processing 50 employee records...

[JOB-123] ⚠️  Row 5: Skipped (missing email)
[JOB-123] ✓ Progress: 10/50 employees created
[JOB-123] ⚠️  Row 15: Skipped (email already exists) - john@example.com
[JOB-123] ✓ Progress: 20/50 employees created
...
[JOB-123] ✓ Progress: 50/50 employees created

[JOB-123] 💾 Updating batch summary...
============================================================
[JOB-123] ✅ Job completed successfully
[JOB-123] Duration: 12.45s
[JOB-123] Total: 50 | Success: 47 | Failed: 3
[JOB-123] Success Rate: 94.0%
[JOB-123] Failed rows summary:
[JOB-123]   - Row 5: no-email (missing email)
[JOB-123]   - Row 15: john@example.com (email already exists)
[JOB-123]   - Row 32: jane@example.com (email already exists)
============================================================
```

### Worker Events
- `✅ Job completed` - Job finished successfully
- `❌ Job failed` - Job encountered an error
- `🔄 Job is now active` - Job started processing
- `⏸️  Job has stalled` - Job took too long (may retry)

## Excel File Format

The worker expects an Excel file (.xlsx) with the following columns:

| Column Name    | Required | Description              |
|---------------|----------|--------------------------|
| email         | Yes      | Employee email address   |
| full_name     | Yes      | Employee full name       |
| employee_code | No       | Optional employee code   |
| phone         | No       | Optional phone number    |

### Example Excel
```
email                | full_name      | employee_code | phone
---------------------|----------------|---------------|---------------
john@company.com     | John Doe       | EMP001        | +1234567890
jane@company.com     | Jane Smith     | EMP002        | 
alice@company.com    | Alice Johnson  |               | +9876543210
```

## Error Handling

### Automatic Retries
- Jobs retry up to 3 times on failure
- Exponential backoff: 3s, 6s, 12s

### Common Errors
1. **Duplicate Email** - Employee with email already exists
2. **Missing Required Fields** - Email or full_name is empty
3. **Invalid Excel Format** - File is corrupted or not .xlsx
4. **Database Error** - Connection or constraint issues

### Rate Limiting
- Maximum 5 jobs per minute
- Concurrency: 1 (processes one at a time)

## Monitoring

### Check Redis Queue
```bash
redis-cli
> KEYS *employee-upload*
> LLEN bull:employee-upload:waiting
> LLEN bull:employee-upload:active
```

### Check Database
```sql
SELECT * FROM "EmployeeUploadBatch" 
WHERE status IN ('PENDING', 'PROCESSING') 
ORDER BY "createdAt" DESC;
```

## Troubleshooting

### Worker not picking up jobs
1. Check Redis is running: `redis-cli ping`
2. Check worker logs for connection errors
3. Verify REDIS_HOST and REDIS_PORT are correct

### Jobs failing immediately
1. Check database connection
2. Review error logs in worker output
3. Verify Prisma schema is migrated

### High failure rate
1. Check Excel file format matches expected columns
2. Look for duplicate emails in database
3. Review failed rows summary in logs

## Development Tips

### Test with Sample Data
Create a test Excel file with various scenarios:
- Valid employees
- Duplicate emails
- Missing required fields
- Special characters in names

### Watch Mode
Both backend and worker support watch mode:
```bash
# Terminal 1 - Backend
npm run start:dev

# Terminal 2 - Worker
npm run worker:dev
```

### Debug Mode
Add more console.logs in the worker for detailed debugging:
```typescript
console.log('Debug:', JSON.stringify(data, null, 2));
```

## Production Deployment

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start worker
pm2 start npm --name "worker" -- run worker:prod

# Monitor
pm2 logs worker
pm2 monit

# Stop
pm2 stop worker
```

### Using Docker
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
CMD ["node", "dist/workers/employee-upload.worker.js"]
```

### Multiple Workers
For high throughput, run multiple worker instances:
```bash
pm2 start npm --name "worker-1" -i 3 -- run worker:prod
```

## Security Notes

- Default password is `password123` - **MUST be changed in production**
- Send password reset emails instead of using default
- Validate Excel file content before processing
- Limit file size (currently 5MB max)
- Sanitize all user inputs

## Support

For issues or questions:
1. Check worker logs for error details
2. Review batch status in database
3. Check Redis queue health
4. Verify all environment variables are set
