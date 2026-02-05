# Troubleshooting Credentials and API Errors

## Common Issues

### Issue 1: "Internal server error" on Instructor Login

**Symptoms:**
- Login page shows "Internal server error" when attempting to log in
- Credentials are correct in the database

**Root Cause:**
The API cannot connect to the database because `DATABASE_URL` environment variable is not set or incorrect.

**Solution:**

1. **For Dokploy Deployment:**
   - Go to your Dokploy project settings
   - Navigate to Environment Variables
   - Add or update `DATABASE_URL` with the correct connection string:
   ```
   postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu.1.o506q34vjhilt1pqid8sd2ny8:5432/financial_literacy
   ```
   - Note: In Docker networks, you may need to use the container name or service name
   - Restart the application after updating

2. **For Local Development:**
   - Create or update `.env.local` in `apps/web/`:
   ```
   DATABASE_URL=postgresql://finlit_user:FinLit2025SecurePassword@localhost:5432/financial_literacy
   ```
   - Restart the development server

3. **Verify Connection:**
   ```bash
   # Test database connectivity
   docker exec finlit-postgres-db-g6ifwu.1.o506q34vjhilt1pqid8sd2ny8 psql -U finlit_user -d financial_literacy -c "SELECT 1;"
   ```

### Issue 2: "Invalid course code" Error

**Symptoms:**
- Student assessment page shows "Invalid course code" error
- Course exists in database

**Root Cause:**
Same as Issue 1 - API cannot connect to database to validate the course.

**Solution:**
Follow the same steps as Issue 1 to fix the `DATABASE_URL`.

### Issue 3: Database Connection String Format

The connection string format is:
```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**For Dokploy:**
- Host: Use the database container name or service name
- Port: Usually 5432 (internal Docker network)
- User: `finlit_user`
- Password: `FinLit2025SecurePassword` (or your configured password)
- Database: `financial_literacy`

**For Local Development:**
- Host: `localhost` (if port is exposed) or container name
- Port: `5432` (if exposed) or internal port
- User: `finlit_user`
- Password: Check your docker-compose.yml or environment
- Database: `financial_literacy`

## Diagnostic Steps

### Step 1: Verify Database is Running
```bash
docker ps | grep postgres
```

### Step 2: Test Database Connectivity
```bash
docker exec finlit-postgres-db-g6ifwu.1.o506q34vjhilt1pqid8sd2ny8 psql -U finlit_user -d financial_literacy -c "SELECT 'Database OK' as status;"
```

### Step 3: Verify Credentials Exist
```bash
# Check instructor
docker exec finlit-postgres-db-g6ifwu.1.o506q34vjhilt1pqid8sd2ny8 psql -U finlit_user -d financial_literacy -c "SELECT email, is_active FROM instructors WHERE email = 'test.instructor@university.edu';"

# Check course
docker exec finlit-postgres-db-g6ifwu.1.o506q34vjhilt1pqid8sd2ny8 psql -U finlit_user -d financial_literacy -c "SELECT name FROM courses WHERE name = 'Financial Literacy';"
```

### Step 4: Test API Endpoints
```bash
# Test instructor login
curl -X POST http://localhost:3000/api/instructor/login \
  -H "Content-Type: application/json" \
  -d '{"email": "test.instructor@university.edu", "password": "TestInstructor123!"}'

# Test course validation
curl -X POST http://localhost:3000/api/courses/validate \
  -H "Content-Type: application/json" \
  -d '{"courseCode": "Financial Literacy"}'
```

### Step 5: Check API Logs
```bash
# For Dokploy
# Check logs in Dokploy dashboard

# For Docker Compose
docker logs financial_literacy_app

# Look for:
# - "DATABASE_URL environment variable is not set"
# - Database connection errors
# - Query execution errors
```

## Quick Fix Script

Run the diagnostic script:
```bash
./scripts/diagnose-api-errors.sh
```

This will:
1. Test API availability
2. Test database connectivity
3. Test instructor login endpoint
4. Test course validation endpoint
5. Verify credentials in database

## Re-running Credential Setup

If credentials need to be recreated:
```bash
./scripts/setup-and-test-credentials.sh
```

This will:
1. Create/update test instructor
2. Create/update test student
3. Verify both credentials work

## Expected Test Credentials

**Instructor:**
- Email: `test.instructor@university.edu`
- Password: `TestInstructor123!`

**Student:**
- Course Code: `Financial Literacy`
- Student ID: `123456789`

## Still Having Issues?

1. Check that the database container is running and healthy
2. Verify network connectivity between API and database containers
3. Check that RLS (Row Level Security) policies allow access
4. Review API logs for specific error messages
5. Ensure the database schema is properly initialized

