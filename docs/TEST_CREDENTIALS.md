# Test Credentials

This document contains the test credentials for the Financial Literacy Assessment Platform.

## Setup

To set up test credentials, run:

```bash
./scripts/setup-and-test-credentials.sh
```

This script will:
1. Create test instructor credentials
2. Create test student credentials
3. Verify both credentials work correctly

## Instructor Credentials

**Email:** `test.instructor@university.edu`  
**Password:** `TestInstructor123!`  
**Full Name:** Test Instructor  
**Department:** Finance

### Usage

Login via the instructor API endpoint:

```bash
curl -X POST http://localhost:3000/api/instructor/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test.instructor@university.edu",
    "password": "TestInstructor123!"
  }'
```

Expected response:
```json
{
  "success": true,
  "token": "...",
  "instructor": {
    "id": "...",
    "email": "test.instructor@university.edu",
    "name": "test.instructor"
  }
}
```

## Student Credentials

**Course Code:** `Financial Literacy`  
**Student ID:** `123456789`

### Usage

Submit an assessment via the student API endpoint:

```bash
curl -X POST http://localhost:3000/api/assessment/submit \
  -H "Content-Type: application/json" \
  -d '{
    "courseCode": "QUIN 102",
    "studentId": "123456789",
    "attemptType": "pre",
    "responses": [...]
  }'
```

### How Student Authentication Works

Student authentication is FERPA-compliant:
- Student IDs are never stored in plain text
- The system uses: `SHA256(course_pepper + student_id)` to create a hashed key
- The course pepper is unique per course and stored securely
- Only the hashed key is stored in the database

## Testing

### Test Database Credentials

Run the setup script to verify credentials are working:

```bash
./scripts/setup-and-test-credentials.sh
```

### Test API Endpoints

If the API is running, test the credentials against the actual endpoints:

```bash
./scripts/test-api-credentials.sh
```

Or set a custom API URL:

```bash
API_URL=https://your-domain.com ./scripts/test-api-credentials.sh
```

## Database Connection

The test scripts connect to the PostgreSQL database using:

- **Host:** localhost (or Docker container)
- **Database:** financial_literacy
- **User:** finlit_user
- **Password:** (from environment or docker-compose.yml)

Connection string format:
```
postgresql://finlit_user:PASSWORD@localhost:5432/financial_literacy
```

## Security Notes

⚠️ **These are test credentials only!**

- Do NOT use these credentials in production
- The instructor password uses SHA256 hashing (should be upgraded to bcrypt in production)
- Student authentication is FERPA-compliant by design
- Always use strong, unique passwords in production

## Troubleshooting

### "Internal server error" on Login

This usually means the API cannot connect to the database. See [TROUBLESHOOTING_CREDENTIALS.md](./TROUBLESHOOTING_CREDENTIALS.md) for detailed solutions.

**Quick Fix:**
1. Verify `DATABASE_URL` is set in your environment
2. Check database container is running
3. Test database connectivity

### "Invalid course code" Error

Same root cause as above - API cannot connect to database. Follow the troubleshooting guide.

### Credentials not working?

1. **Check database connection:**
   ```bash
   docker exec finlit-postgres-db-g6ifwu.1.o506q34vjhilt1pqid8sd2ny8 psql -U finlit_user -d financial_literacy -c "SELECT 1;"
   ```

2. **Verify credentials exist:**
   ```bash
   docker exec finlit-postgres-db-g6ifwu.1.o506q34vjhilt1pqid8sd2ny8 psql -U finlit_user -d financial_literacy -c "SELECT email FROM instructors WHERE email = 'test.instructor@university.edu';"
   ```

3. **Check course exists:**
   ```bash
   docker exec finlit-postgres-db-g6ifwu.1.o506q34vjhilt1pqid8sd2ny8 psql -U finlit_user -d financial_literacy -c "SELECT name FROM courses WHERE name = 'Financial Literacy';"
   ```

4. **Re-run setup:**
   ```bash
   ./scripts/setup-and-test-credentials.sh
   ```

5. **Run diagnostics:**
   ```bash
   ./scripts/diagnose-api-errors.sh
   ```

### API not responding?

1. Check if the API container is running:
   ```bash
   docker ps | grep financial
   ```

2. Check API logs:
   ```bash
   docker logs financial_literacy_app
   # Or for Dokploy, check logs in the dashboard
   ```

3. Verify DATABASE_URL is set correctly:
   - For Dokploy: Check environment variables in Dokploy dashboard
   - For local: Check `.env.local` or docker-compose.yml
   - Connection string format: `postgresql://user:password@host:port/database`

