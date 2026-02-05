# Testing Guide

## ✅ Setup Complete

### Database Status
- ✅ Local PostgreSQL running on port 5433
- ✅ All 10 tables created and ready
- ✅ Course "QUINN 102" exists in database
- ✅ 3 sample questions loaded
- ✅ DATABASE_URL configured in `.env.local`

### Code Status
- ✅ Course dropdown API fixed (missing import)
- ✅ Course validation API working
- ✅ All pages use consistent course dropdown
- ✅ Backward compatibility for course names

## 🧪 Manual Testing Steps

### 1. Start Development Server

```bash
cd apps/web
npm run dev
```

Server should start on http://localhost:3000

### 2. Test Course Dropdown - Start Page

**URL**: http://localhost:3000/start

**Expected Behavior**:
- [ ] Dropdown loads automatically
- [ ] Shows "QUINN 102 (Fall 2025)" as option
- [ ] Can select the course
- [ ] Click "Continue to Onboarding"
- [ ] Should redirect to `/login?courseCode=QUINN%20102` (no error)

**If Error Occurs**:
- Check browser console (F12) for errors
- Verify API response: `curl http://localhost:3000/api/courses/list`
- Check database connection: `node test-database.js`

### 3. Test Course Dropdown - Login Page

**URL**: http://localhost:3000/login

**Expected Behavior**:
- [ ] Dropdown loads automatically
- [ ] Shows "QUINN 102 (Fall 2025)"
- [ ] If coming from `/start`, course should be pre-filled
- [ ] Can change course selection

### 4. Test Course Dropdown - Forgot Password Page

**URL**: http://localhost:3000/forgot-password

**Expected Behavior**:
- [ ] Dropdown loads automatically
- [ ] Shows "QUINN 102 (Fall 2025)"
- [ ] Can select course

### 5. Test Student Registration Flow

**Steps**:
1. Go to `/start`
2. Select "QUINN 102" and continue
3. Should redirect to `/login`
4. Click "New Student? Start Here" or go to `/onboarding?courseCode=QUINN%20102`
5. Complete onboarding form:
   - Step 1: Student ID, Email, Password
   - Step 2: Demographics
   - Step 3: Financial background
6. Submit form
7. Should redirect to assessment

**Expected Results**:
- [ ] Form validates all required fields
- [ ] Password must be at least 8 characters
- [ ] Email format validated
- [ ] Data saved to database
- [ ] Redirects to assessment after completion

### 6. Test Student Login

**Steps**:
1. Go to `/login`
2. Enter:
   - Course Code: "QUINN 102" (from dropdown)
   - Student ID: (the one you used in onboarding)
   - Password: (the one you created)
3. Click "Login"

**Expected Results**:
- [ ] Login successful
- [ ] Redirects to assessment (if onboarding complete)
- [ ] Or redirects to onboarding (if not complete)

**Error Cases**:
- [ ] Wrong password shows error
- [ ] Wrong Student ID shows error
- [ ] Invalid course code shows error

### 7. Test Password Recovery

**Steps**:
1. Go to `/forgot-password`
2. Enter:
   - Course Code: "QUINN 102"
   - Student ID: (your student ID)
   - Email: (the email you used in onboarding)
3. Click "Send Reset Link"

**Expected Results**:
- [ ] Success message displayed (doesn't reveal if email exists)
- [ ] Email sent to your inbox (check Resend dashboard)
- [ ] Reset link in email works
- [ ] Can set new password
- [ ] Can login with new password

**Error Cases**:
- [ ] Wrong Student ID + Email combination shows generic error
- [ ] Invalid email format shows error
- [ ] Missing fields show validation errors

### 8. Test CSV Upload (Instructor)

**Prerequisites**:
- Need instructor account (see instructor setup docs)

**Steps**:
1. Login as instructor
2. Navigate to Questions page
3. Upload `export/questionnaire_upload_fixed.csv`
4. Verify upload

**Expected Results**:
- [ ] All 31 questions imported
- [ ] Behavioral questions have empty keys
- [ ] Type normalization works (`multiple_choice` → `multiple-choice`)
- [ ] No parsing errors

## 🔍 Debugging Tips

### Check API Endpoints

```bash
# Test courses list
curl http://localhost:3000/api/courses/list

# Test course validation
curl -X POST http://localhost:3000/api/courses/validate \
  -H "Content-Type: application/json" \
  -d '{"courseCode":"QUINN 102"}'
```

### Check Database

```bash
# Test database connection
cd apps/web
node test-database.js

# Check courses
docker exec finlit_postgres_local psql -U finlit_user -d financial_literacy \
  -c "SELECT name, term FROM courses;"

# Check users
docker exec finlit_postgres_local psql -U finlit_user -d financial_literacy \
  -c "SELECT COUNT(*) FROM users;"
```

### Check Browser Console

1. Open browser DevTools (F12)
2. Go to Console tab
3. Look for:
   - API errors
   - Network failures
   - JavaScript errors
   - Debug logs (from our added logging)

### Check Server Logs

Watch the terminal where `npm run dev` is running for:
- API request logs
- Database query errors
- Validation errors

## 🐛 Common Issues

### "Invalid course code" Error

**Possible Causes**:
1. Database connection issue
2. Course not found in database
3. API route error

**Solutions**:
1. Check database is running: `docker ps | grep finlit_postgres_local`
2. Verify course exists: `docker exec finlit_postgres_local psql -U finlit_user -d financial_literacy -c "SELECT * FROM courses;"`
3. Check API logs in browser console
4. Restart dev server

### Dropdown Not Loading

**Possible Causes**:
1. API endpoint failing
2. Network error
3. CORS issue

**Solutions**:
1. Check `/api/courses/list` returns data
2. Check browser Network tab for failed requests
3. Verify DATABASE_URL is set correctly

### Database Connection Error

**Possible Causes**:
1. DATABASE_URL not set
2. Database container not running
3. Wrong credentials

**Solutions**:
1. Check `.env.local` has DATABASE_URL
2. Start database: `docker start finlit_postgres_local`
3. Test connection: `node test-database.js`

## ✅ Success Criteria

All tests pass when:
- [x] Course dropdown works on all 3 pages
- [x] Course validation succeeds
- [x] Student can register and login
- [x] Password recovery sends email
- [x] CSV upload works for instructor
- [x] No console errors
- [x] All API endpoints return correct data

---

**Last Updated**: After course dropdown fix
**Status**: Ready for testing

