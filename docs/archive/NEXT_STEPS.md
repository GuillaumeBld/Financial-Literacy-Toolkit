# Next Steps - Implementation Guide

## 🎯 Priority Tasks

### 1. Database Connection Setup ⚠️ CRITICAL

**Current Status**: `DATABASE_URL` environment variable not configured

**Required Action**:

#### Option A: Using Supabase (Original Setup)
If you're using Supabase, add to `apps/web/.env.local`:
```bash
DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@[YOUR-PROJECT].supabase.co:5432/postgres
NEXT_PUBLIC_SUPABASE_URL=https://[YOUR-PJECT].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[YOUR-ANON-KEY]
```

#### Option B: Using Direct PostgreSQL (Dokploy/Production)
If using PostgreSQL directly, add to `apps/web/.env.local`:
```bash
DATABASE_URL=postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]
```

**Format**: `postgresql://username:password@host:port/database`

**Important Notes**:
- If password contains special characters, URL-encode them
- Example: `password@123` → `password%40123`
- The error `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string` usually means:
  - Password is not properly URL-encoded
  - Connection string format is incorrect
  - Database credentials are wrong

**Test Connection**:
```bash
cd apps/web
node test-database.js
```

### 2. Database Schema Setup

**If database is empty or needs migration**:

1. **Run schema migration**:
   ```bash
   # Connect to your database and run:
   psql $DATABASE_URL < infra/schema.sql
   ```

2. **Run seed data** (optional, for testing):
   ```bash
   psql $DATABASE_URL < infra/seed.sql
   ```

3. **Verify course exists**:
   ```sql
   SELECT course_id, name, term FROM courses;
   ```
   Should show: `QUINN 102` (or `Financial Literacy` - both work now)

### 3. Environment Variables Checklist

**Required for `apps/web/.env.local`**:

```bash
# Database (REQUIRED)
DATABASE_URL=postgresql://user:password@host:port/database

# Email Service (REQUIRED for password recovery)
RESEND_API_KEY=re_LaPEPkJT_8SSDtYsSWjRD2XtRrRV4w7Sq
RESEND_FROM_EMAIL=onboarding@resend.dev
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional (if using Supabase)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

**For Production (Dokploy)**:
- Set these in Dokploy UI under Environment Variables
- Mark sensitive ones as "Secret"

### 4. Testing Checklist

#### A. Database Connection Test
- [ ] Run `node apps/web/test-database.js`
- [ ] Verify connection successful
- [ ] Check that courses table exists
- [ ] Verify at least one course exists (QUINN 102)

#### B. Course Dropdown Test
- [ ] Visit `/start` page
- [ ] Verify dropdown loads courses
- [ ] Select "QUINN 102" from dropdown
- [ ] Submit and verify redirect to `/login`
- [ ] Test on `/login` and `/forgot-password` pages

#### C. Email Password Recovery Test
- [ ] Visit `/forgot-password`
- [ ] Enter valid Course Code + Student ID + Email
- [ ] Check email inbox for reset link
- [ ] Click reset link
- [ ] Set new password
- [ ] Login with new password
- [ ] Test with invalid Student ID (should not reveal if email exists)

#### D. Student Login Test
- [ ] Complete onboarding (if not done)
- [ ] Login with Student ID + Password
- [ ] Verify redirect to assessment or onboarding
- [ ] Test with wrong password (should fail)
- [ ] Test with wrong Student ID (should fail)

#### E. CSV Upload Test
- [ ] Login as instructor
- [ ] Navigate to Questions page
- [ ] Upload `export/questionnaire_upload_fixed.csv`
- [ ] Verify all 31 questions import correctly
- [ ] Check that behavioral questions have empty keys
- [ ] Verify type normalization works

### 5. Production Deployment Checklist

#### Pre-Deployment
- [ ] All environment variables set in Dokploy
- [ ] Database connection tested
- [ ] Email service configured (Resend)
- [ ] Course "QUINN 102" exists in database
- [ ] Seed data loaded (if needed)

#### Post-Deployment
- [ ] Test live site: https://financial-literacy.qualiaai.fr
- [ ] Verify course dropdown works
- [ ] Test student registration flow
- [ ] Test password recovery email delivery
- [ ] Check Resend dashboard for email status
- [ ] Verify instructor dashboard accessible

## 🔧 Troubleshooting

### Database Connection Issues

**Error**: `SASL: SCRAM-SERVER-FIRST-MESSAGE: client password must be a string`

**Solutions**:
1. Check `DATABASE_URL` format is correct
2. URL-encode special characters in password
3. Verify database credentials
4. Test connection with `psql` directly:
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   ```

**Error**: `Connection timeout`

**Solutions**:
1. Check database host is accessible
2. Verify firewall rules allow connection
3. Check network connectivity
4. For Supabase: Verify connection pooling settings

### Course Not Found

**Error**: "Course not found" or dropdown empty

**Solutions**:
1. Verify course exists in database:
   ```sql
   SELECT * FROM courses WHERE name IN ('QUINN 102', 'Financial Literacy');
   ```
2. If missing, run seed data:
   ```bash
   psql $DATABASE_URL < infra/seed.sql
   ```
3. Check API endpoint: `/api/courses/list` should return courses

### Email Not Sending

**Error**: Password reset email not received

**Solutions**:
1. Check Resend API key is correct
2. Verify `RESEND_FROM_EMAIL` is set
3. Check Resend dashboard for delivery status
4. Verify email address is valid
5. Check spam folder
6. For testing: Use `onboarding@resend.dev` (Resend test domain)

## 📊 Current Status

### ✅ Completed
- Course name backward compatibility
- Course dropdown implementation
- Email password recovery (code complete)
- CSV upload fixes
- Instructor password reset
- All code fixes pushed to GitHub

### ⚠️ Needs Configuration
- Database connection (`DATABASE_URL`)
- Email service (Resend API key - already set)
- Production environment variables

### 🧪 Needs Testing
- Database connection
- Course dropdown with real database
- Email delivery
- End-to-end password recovery
- CSV upload with real database

## 🚀 Quick Start Commands

```bash
# 1. Set up environment variables
cd apps/web
cp .env.example .env.local  # If exists, or create manually
# Edit .env.local with your DATABASE_URL

# 2. Test database connection
node test-database.js

# 3. Run database migrations (if needed)
psql $DATABASE_URL < ../infra/schema.sql
psql $DATABASE_URL < ../infra/seed.sql

# 4. Start development server
npm run dev

# 5. Test in browser
# Visit http://localhost:3000
```

## 📝 Next Actions

1. **Immediate**: Configure `DATABASE_URL` in `.env.local`
2. **Immediate**: Test database connection
3. **Next**: Run full test checklist
4. **Next**: Deploy to production (if database is ready)
5. **Future**: Monitor email delivery rates
6. **Future**: Add more courses as needed

---

**Last Updated**: After code fixes completion
**Status**: Ready for database configuration and testing

