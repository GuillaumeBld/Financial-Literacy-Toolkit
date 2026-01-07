# Password Recovery System

## Overview

Students can recover their passwords using a secure token-based reset system. The system generates a temporary reset token that expires after 1 hour and can only be used once.

## User Flow

### Password Recovery Process

1. **Request Reset**
   - Student visits `/forgot-password` page
   - Enters Course Code and Student ID
   - System validates credentials and generates reset token
   - Token is displayed to the user (can be copied)

2. **Use Token**
   - Student copies the reset token
   - Token is shown on screen with copy button
   - Student proceeds to password reset form

3. **Reset Password**
   - Student enters:
     - Reset token
     - New password (minimum 8 characters)
     - Confirm password
   - System validates token and updates password
   - Student is redirected to login page

## Security Features

### Token Security
- **Token Generation**: 32-byte random hex string (64 characters)
- **Expiration**: Tokens expire after 1 hour
- **Single Use**: Tokens can only be used once
- **Automatic Cleanup**: Old unused tokens are deleted when new ones are generated

### Validation
- Student must be enrolled in the course
- Student must have a password set (completed onboarding)
- Token must be valid and not expired
- Token must not have been used before
- New password must meet minimum requirements (8 characters)

## API Endpoints

### POST `/api/student/forgot-password`

**Request:**
```json
{
  "courseCode": "FINC 000",
  "studentId": "123456789"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password reset token generated",
  "token": "a1b2c3d4e5f6...",
  "expiresAt": "2025-01-15T11:30:00.000Z"
}
```

**Response (Error):**
```json
{
  "error": "Student ID not found"
}
```

### POST `/api/student/reset-password`

**Request:**
```json
{
  "courseCode": "FINC 000",
  "studentId": "123456789",
  "token": "a1b2c3d4e5f6...",
  "newPassword": "newsecurepassword"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Password has been reset successfully"
}
```

**Response (Error):**
```json
{
  "error": "Invalid or expired reset token"
}
```

## Database Schema

### password_reset_tokens Table

```sql
CREATE TABLE password_reset_tokens (
  token_id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(user_id),
  course_id UUID NOT NULL REFERENCES courses(course_id),
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### student_profiles Table (Updated)

- Added `email` field (optional) for future email-based recovery

## Token Display

Currently, reset tokens are displayed directly to the user on the forgot password page. This allows:

1. **Immediate Access**: Student can copy and use the token right away
2. **No Email Dependency**: Works without email infrastructure
3. **Instructor Assistance**: Instructors can help students if needed

### Future Enhancement: Email Delivery

The system is structured to support email delivery:

```typescript
// In forgot-password route.ts
// TODO: If email is available in student_profiles, send email with reset link
if (studentProfile.email) {
  await sendPasswordResetEmail(studentProfile.email, token);
}
```

When email is implemented:
- Token will be sent to student's email
- Reset link will be: `/forgot-password?token=XXX&courseCode=XXX&studentId=XXX`
- Token will be auto-filled from URL parameters

## Error Handling

### Common Errors

1. **"Student ID not found"**
   - Student hasn't completed onboarding
   - Invalid student ID entered

2. **"No password set for this account"**
   - Student needs to complete onboarding first

3. **"Student not enrolled in this course"**
   - Student ID doesn't match course enrollment

4. **"Invalid or expired reset token"**
   - Token doesn't exist
   - Token has expired (older than 1 hour)
   - Token was already used

5. **"This reset token has already been used"**
   - Token was used previously
   - Student needs to request a new token

## Migration

To add password reset functionality:

```sql
-- Run migration
\i infra/migration-add-password-reset.sql
```

This creates:
- `password_reset_tokens` table
- `email` field in `student_profiles` table

## Usage Example

1. Student forgets password
2. Visits `/forgot-password?courseCode=FINC%20000`
3. Enters Student ID
4. Clicks "Generate Reset Token"
5. Copies the displayed token
6. Enters token and new password
7. Password is reset
8. Redirected to login page

## Security Considerations

1. **Token Expiration**: Prevents old tokens from being used
2. **Single Use**: Tokens are marked as used after successful reset
3. **Automatic Cleanup**: Old tokens are deleted when new ones are generated
4. **FERPA Compliance**: Still uses hashed student keys, no raw IDs stored
5. **Rate Limiting**: Consider adding rate limiting to prevent abuse (future enhancement)

## Testing

### Test Flow
1. Create a student account via onboarding
2. Log out
3. Visit `/forgot-password`
4. Enter course code and student ID
5. Copy the generated token
6. Use token to reset password
7. Try to use the same token again (should fail)
8. Request a new token and verify it works

### Test Cases
- ✅ Valid token resets password
- ✅ Expired token is rejected
- ✅ Used token cannot be reused
- ✅ Invalid token is rejected
- ✅ Non-existent student ID is rejected
- ✅ Password validation (minimum 8 characters)

