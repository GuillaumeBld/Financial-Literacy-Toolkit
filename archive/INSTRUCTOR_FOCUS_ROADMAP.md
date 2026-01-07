# Instructor Dashboard Focus - Implementation Roadmap

## Current Status

### ✅ What's Already Working

1. **Instructor Authentication**
   - Login page implemented (`/instructor`)
   - Login API endpoint working
   - Session management via tokens
   - Password hashing (SHA256)
   - Test credentials: `instructor@university.edu` / `instructor123`

2. **Dashboard UI**
   - Dashboard page implemented (`/instructor/dashboard`)
   - Professional Loyola-themed design
   - Stats cards display
   - Course selector dropdown
   - Domain performance visualization
   - Quick action cards

3. **Data API**
   - Dashboard data endpoint (`/api/instructor/dashboard`)
   - Course filtering by courseId
   - Statistics calculation
   - Attempt aggregation

4. **Database Structure**
   - Instructor table
   - Instructor sessions
   - Instructor-courses relationship
   - All necessary joins for stats

### ⚠️ Current Issues

1. **Instructor Course Assignments**
   - Instructor currently assigned to only 1 course
   - Need to assign to all courses for testing
   - Multiple courses won't display properly

2. **Dashboard Functionality**
   - Some syntax errors in the code (line 102-106)
   - Refresh button may not work properly
   - Course selector needs better handling

3. **Missing Instructor Views**
   - `/instructor/submissions` - Not implemented
   - `/instructor/questions` - Not implemented
   - `/instructor/analytics` - Not implemented

---

## 🎯 Priority 1: Fix Current Dashboard

### Task 1.1: Fix Syntax Errors in Dashboard
**File**: `apps/web/src/app/instructor/dashboard/page.tsx`

**Issue**: Lines 102-106 have incomplete code
```typescript
const handleRefresh = () => {
  const token = localStorage.getItem;  // Missing parentheses
  if (token) {
    loadDashboardData(token, selectedCourse);
  }
;  // Unexpected semicolon
```

**Fix**: Add parentheses and remove extra semicolon
```typescript
const handleRefresh = () => {
  const token = localStorage.getItem('instructor-token');
  if (token) {
    loadDashboardData(token, selectedCourse);
  }
};
```

### Task 1.2: Assign Instructor to All Courses
**Status**: ✅ DONE - SQL script executed
- Instructor now assigned to all 3 courses
- Can view all assessment data

### Task 1.3: Test Login and Dashboard
**Next Steps**:
1. Test instructor login
2. Verify dashboard loads
3. Check stats display
4. Verify course selector works

---

## 🎯 Priority 2: Enhanced Dashboard Features

### Task 2.1: Real-Time Student Data Display

**Features to Add**:
1. **Student List View**
   - Show all enrolled students
   - Filter by completion status
   - View individual attempts

2. **Pre/Post Comparison**
   - Side-by-side average scores
   - Growth visualization
   - Statistical significance

3. **Individual Student Profiles**
   - Detailed attempt history
   - Confidence vs accuracy
   - Learning trajectory

### Task 2.2: Export Functionality
**Features**:
- Export to CSV
- Export to Excel
- Export raw data (anonymized)
- Generate reports

### Task 2.3: Analytics Dashboard
**Features**:
- Summary statistics
- Confidence distribution
- Response time analysis
- Domain performance breakdown
- Overconfidence index visualization

---

## 🎯 Priority 3: Missing Instructor Views

### Task 3.1: Submissions View (`/instructor/submissions`)
**Features**:
- List all student submissions
- Filter by date, course, attempt type
- Search functionality
- Individual response review
- Manual grading interface (for short answers)

### Task 3.2: Question Bank Management (`/instructor/questions`)
**Features**:
- View all questions in item bank
- Add new questions
- Edit existing questions
- Delete questions
- Set question difficulty
- Mark anchor items
- Assign to domains/subdomains

### Task 3.3: Analytics & Reports (`/instructor/analytics`)
**Features**:
- Detailed statistical analysis
- Class-level performance
- Individual student performance
- Domain-specific insights
- Pre/post comparison charts
- Generate printable reports

---

## 🎯 Priority 4: Advanced Features

### Task 4.1: AI Scoring Interface
**Features**:
- Queue of pending AI scores
- Human review override
- Confidence threshold settings
- Bulk review actions

### Task 4.2: Course Management
**Features**:
- Create new courses
- Edit course settings
- Manage student enrollments
- Set course parameters (peppers, settings)

### Task 4.3: Communication Tools
**Features**:
- Send feedback to students
- Announcement system
- Email notifications
- In-app messaging

---

## 📋 Immediate Action Items

### Step 1: Fix Dashboard Syntax (5 min)
✅ Fix `handleRefresh` function
✅ Test dashboard loads without errors

### Step 2: Assign Instructor to Courses (Done ✅)
✅ SQL executed to assign instructor to all courses

### Step 3: Test Instructor Flow (10 min)
- [ ] Login with instructor credentials
- [ ] Verify dashboard loads
- [ ] Check stats display correctly
- [ ] Test course selector dropdown
- [ ] Verify data is accurate

### Step 4: Enhance Dashboard Data (30 min)
- [ ] Add recent submissions list
- [ ] Add pre/post comparison
- [ ] Improve stat cards display
- [ ] Add loading states

### Step 5: Implement Missing Views (2-3 hours)
- [ ] Create submissions view
- [ ] Create question bank view
- [ ] Create analytics view
- [ ] Add navigation between views

---

## 🔧 Technical Implementation Notes

### Database Queries Needed

**Get Instructor's Students**:
```sql
SELECT DISTINCT
  u.hashed_student_key,
  COUNT(a.attempt_id) as attempt_count,
  MAX(a.submitted_at) as last_attempt
FROM users u
JOIN enrollments e ON u.user_id = e.user_id
JOIN instructor_courses ic ON e.course_id = ic.course_id
LEFT JOIN attempts a ON u.user_id = a.user_id
WHERE ic.instructor_id = ?
GROUP BY u.hashed_student_key
```

**Get Student Attempts**:
```sql
SELECT 
  a.attempt_id,
  a.attempt_type,
  a.submitted_at,
  a.duration_s,
  s.overall as score,
  s.by_domain,
  s.overconfidence_index
FROM attempts a
JOIN users u ON a.user_id = u.user_id
JOIN scores s ON a.attempt_id = s.attempt_id
WHERE u.hashed_student_key = ?
ORDER BY a.submitted_at DESC
```

**Calculate Domain Averages**:
```sql
SELECT 
  i.domain,
  AVG(CASE WHEN i.type = 'multiple-choice' THEN 
    (CASE WHEN r.raw_answer->>'selected' = i.key THEN 1 ELSE 0 END)
  ELSE 
    COALESCE(r.score, 0.5)
  END) as avg_score,
  COUNT(*) as response_count
FROM items i
JOIN responses r ON i.item_id = r.item_id
JOIN attempts a ON r.attempt_id = a.attempt_id
WHERE a.course_id = ?
GROUP BY i.domain
```

---

## 📊 Current Dashboard Features Overview

### Statistics Displayed
1. **Total Students** - Count of unique enrolled students
2. **Total Attempts** - All assessment attempts
3. **Average Score** - Overall class performance
4. **Average Duration** - Time taken to complete
5. **Domain Performance** - Breakdown by content domain

### Quick Actions Available
1. **View All Submissions** → `/instructor/submissions` (Not implemented)
2. **Manage Questions** → `/instructor/questions` (Not implemented)
3. **Analytics & Reports** → `/instructor/analytics` (Not implemented)

---

## 🚀 Next Steps

1. **Fix syntax errors** in dashboard code
2. **Test instructor login** and verify token authentication
3. **Verify dashboard loads** with real data
4. **Add missing instructor views** (submissions, questions, analytics)
5. **Enhance dashboard** with more actionable insights
6. **Implement export** functionality
7. **Add pre/post comparison** features
8. **Create student profile** views

---

## 📝 Success Criteria

- [ ] Instructor can log in successfully
- [ ] Dashboard displays accurate statistics
- [ ] Course selector works properly
- [ ] All instructor's courses are accessible
- [ ] Data exports correctly
- [ ] Submissions view is functional
- [ ] Question bank management works
- [ ] Analytics provide actionable insights

---

*Last Updated: October 28, 2025*
*Focus: Instructor Dashboard Enhancement*

