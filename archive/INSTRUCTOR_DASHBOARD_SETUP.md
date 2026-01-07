# Instructor Dashboard - Setup Guide

## 🎯 What's Included

The Instructor Dashboard provides:
- **Authentication**: Secure login for instructors
- **Analytics**: Real-time statistics on student performance
- **Course Management**: View data across multiple courses
- **Domain Breakdown**: Performance metrics by financial literacy topic
- **Export Functionality**: Download data for research (coming soon)

---

## 📋 Database Setup

### Step 1: Apply Instructor Schema

Run the instructor schema SQL to create necessary tables:

```bash
# Using Supabase CLI
supabase db push infra/instructor-schema.sql

# Or manually in Supabase SQL Editor
# Copy and paste contents of infra/instructor-schema.sql
```

This creates:
- `instructors` table - Instructor accounts
- `instructor_courses` table - Course assignments
- `instructor_sessions` table - Authentication sessions

### Step 2: Seed Test Instructor

Create a test instructor account:

```bash
# Using Supabase CLI
supabase db push infra/seed-instructor.sql

# Or manually in Supabase SQL Editor
# Copy and paste contents of infra/seed-instructor.sql
```

**Test Credentials**:
- Email: `instructor@university.edu`
- Password: `instructor123`

⚠️ **IMPORTANT**: Change this password in production!

---

## 🚀 Usage

### Access the Dashboard

1. Navigate to: `https://your-app-url.vercel.app/instructor`
2. Login with instructor credentials
3. View dashboard with student analytics

### Dashboard Features

#### Main Dashboard (`/instructor/dashboard`)
- **Total Students**: Unique students who have taken assessments
- **Total Attempts**: All assessment submissions (pre + post)
- **Average Score**: Mean score across all completed assessments
- **Average Duration**: Mean time to complete assessments
- **Domain Breakdown**: Performance by financial literacy topic

#### Quick Actions (Coming Soon)
- View All Submissions - Individual student responses
- Manage Questions - Add/edit assessment items
- Analytics & Reports - Detailed statistical analysis

---

## 🔐 Security Notes

### Current Implementation
- **Password Hashing**: SHA256 (⚠️ TEMPORARY)
- **Session Tokens**: 64-character random hex
- **Session Duration**: 24 hours
- **RLS Policies**: Service role access only

### Production Requirements
1. **Replace SHA256 with bcrypt**:
   ```typescript
   import bcrypt from 'bcryptjs';
   const hash = await bcrypt.hash(password, 10);
   const isValid = await bcrypt.compare(password, hash);
   ```

2. **Add HTTPS-only cookies** instead of localStorage
3. **Implement CSRF protection**
4. **Add rate limiting** on login endpoint
5. **Enable 2FA** for instructor accounts

---

## 📊 API Endpoints

### POST `/api/instructor/login`
Authenticate instructor and create session.

**Request**:
```json
{
  "email": "instructor@university.edu",
  "password": "instructor123"
}
```

**Response**:
```json
{
  "success": true,
  "token": "abc123...",
  "instructor": {
    "id": "uuid",
    "email": "instructor@university.edu",
    "name": "Dr. Test Instructor"
  }
}
```

### GET `/api/instructor/dashboard`
Get dashboard statistics and course data.

**Headers**:
```
Authorization: Bearer <token>
```

**Query Params**:
- `courseId` (optional) - Filter by specific course

**Response**:
```json
{
  "success": true,
  "courses": [
    {
      "id": "uuid",
      "name": "Financial Literacy",
      "term": "Fall 2025",
      "accessLevel": "admin"
    }
  ],
  "stats": {
    "totalAttempts": 10,
    "preAttempts": 5,
    "postAttempts": 5,
    "completedAttempts": 10,
    "uniqueStudents": 5,
    "avgScore": 85.5,
    "avgDuration": 720,
    "domainAverages": [
      {
        "domain": "Financial Planning",
        "average": 88.3,
        "count": 5
      }
    ]
  }
}
```

---

## 🛠️ Development

### Add New Instructor

```sql
INSERT INTO instructors (email, hashed_password, full_name, department)
VALUES (
  'newprof@university.edu',
  'hashed_password_here',
  'Dr. New Professor',
  'Finance'
);

-- Assign to course
INSERT INTO instructor_courses (instructor_id, course_id, access_level)
SELECT 
  (SELECT instructor_id FROM instructors WHERE email = 'newprof@university.edu'),
  (SELECT course_id FROM courses WHERE name = 'Financial Literacy'),
  'admin';
```

### Test Locally

```bash
# Start development server
cd apps/web
npm run dev

# Visit http://localhost:3000/instructor
```

---

## 📈 Next Steps

### Phase 1 Complete ✅
- [x] Instructor authentication
- [x] Dashboard with aggregate statistics
- [x] Domain-specific performance metrics
- [x] Course filtering

### Phase 2: Submissions Viewer (Next)
- [ ] View individual student responses
- [ ] Filter by student, date, score
- [ ] Flag responses for manual review
- [ ] Export individual submissions

### Phase 3: Question Management
- [ ] Add/edit/delete questions
- [ ] Set difficulty and domains
- [ ] Define scoring rubrics
- [ ] Bulk import questions

### Phase 4: Advanced Analytics
- [ ] Pre/post comparison charts
- [ ] Confidence vs. performance analysis
- [ ] Statistical significance testing
- [ ] Cohort comparisons

---

## 🐛 Troubleshooting

### "Authentication required" error
- Check that instructor tables exist in database
- Verify token is being sent in Authorization header
- Check session hasn't expired (24 hour limit)

### "No courses assigned" message
- Verify instructor_courses link exists
- Check course_id matches actual course in database
- Run seed-instructor.sql to create test data

### Dashboard shows zero stats
- Verify students have completed assessments
- Check that attempts have associated scores
- Ensure course_id filter is correct

---

**Status**: ✅ Phase 1 Complete - Ready for Testing  
**Last Updated**: October 27, 2025
