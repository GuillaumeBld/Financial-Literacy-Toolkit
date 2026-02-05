# Student Authentication System

## Overview

Students now authenticate using **Student ID + Password** instead of just course code + student ID. This allows students to:
- Complete onboarding once (with demographic and financial background questions)
- Log in for both pre and post assessments using the same credentials
- Maintain a secure session across assessment attempts

## User Flow

### First Time (New Student)

1. Student visits `/start` page
2. Enters course code
3. Redirected to `/login?courseCode=XXX`
4. Since no account exists, student is redirected to `/onboarding?courseCode=XXX`
5. Student completes onboarding:
   - **Step 1**: Student ID + Password creation
   - **Step 2**: Demographic information (B1-B5)
   - **Step 3**: Financial background (B6-B8) + optional socio-economic data
6. Password and profile data are saved
7. Student is redirected to `/assessment` to begin pre-assessment

### Subsequent Logins (Returning Student)

1. Student visits `/start` page
2. Enters course code
3. Redirected to `/login?courseCode=XXX`
4. Student enters Student ID + Password
5. System verifies credentials
6. If onboarding completed: Redirects to `/assessment`
7. If onboarding not completed: Redirects to `/onboarding` to complete profile

## Database Schema

### Users Table
- `hashed_student_key`: SHA256 hash of (course_pepper + student_id) - FERPA compliant
- `hashed_password`: PBKDF2 hashed password (format: `salt:hash`)
- `sso_provider`: Set to 'hashed' for password-based auth

### Student Profiles Table
- Stores demographic and financial background data (B1-B8)
- Linked to `user_id` (hashed, not raw student ID)
- One profile per user per course

## Password Security

- **Hashing Algorithm**: PBKDF2 with SHA-512
- **Iterations**: 10,000 rounds
- **Salt**: Random 16-byte salt per password
- **Storage Format**: `salt:hash` (stored as single string)
- **Minimum Length**: 8 characters

### Future Upgrade
The system is structured to easily upgrade to bcrypt in production:
```typescript
// Current: PBKDF2
const hashedPassword = AuthUtils.hashPassword(password);

// Future: bcrypt (just change the implementation)
import bcrypt from 'bcryptjs';
const hashedPassword = await bcrypt.hash(password, 10);
```

## API Endpoints

### POST `/api/student/login`

**Request:**
```json
{
  "courseCode": "FINC 000",
  "studentId": "123456789",
  "password": "studentpassword"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Login successful",
  "userId": "uuid",
  "courseId": "uuid",
  "hasCompletedOnboarding": true
}
```

**Response (Error):**
```json
{
  "error": "Invalid student ID or password"
}
```

### POST `/api/onboarding/submit`

**Request:**
```json
{
  "courseCode": "FINC 000",
  "studentId": "123456789",
  "password": "studentpassword",
  "demographic": { ... },
  "financial_background": { ... },
  "socioeconomic": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "message": "Onboarding data saved successfully",
  "data": {
    "userId": "uuid",
    "courseId": "uuid"
  }
}
```

## Session Management

After successful login or onboarding completion, session data is stored in `localStorage`:

```javascript
{
  courseCode: "FINC 000",
  studentId: "123456789",
  userId: "uuid",
  courseId: "uuid",
  hasCompletedOnboarding: true,
  loginTime: "2025-01-15T10:30:00.000Z"
}
```

**Key**: `student-session`

## Security Features

1. **FERPA Compliance**: 
   - Student IDs are hashed using course-specific peppers
   - No raw student IDs stored in database
   - All data linked to hashed `user_id` only

2. **Password Security**:
   - Passwords are never stored in plain text
   - Each password has a unique salt
   - PBKDF2 provides strong key derivation

3. **Session Security**:
   - Session data stored client-side (localStorage)
   - No server-side session tokens (stateless)
   - Session includes timestamp for expiration checks

## Migration

To add password support to existing database:

```sql
-- Run migration
\i infra/migration-add-student-password.sql
```

This adds the `hashed_password` column to the `users` table.

## Testing

### Test Credentials
- **Course Code**: `FINC 000` (or any valid course)
- **Student ID**: `123456789` (or any 6-12 digit ID)
- **Password**: Create during onboarding (minimum 8 characters)

### Test Flow
1. Visit `/start`
2. Enter course code
3. Should redirect to `/login`
4. If first time, will redirect to `/onboarding`
5. Complete onboarding with password
6. Log out and log back in with same credentials
7. Should skip onboarding and go directly to assessment

## Notes

- Onboarding questions (B1-B8) are only asked **once** during initial setup
- Password is created during onboarding and used for all subsequent logins
- Students use the same credentials for both pre and post assessments
- If a student forgets their password, they would need instructor/admin assistance to reset (password reset feature can be added later)

