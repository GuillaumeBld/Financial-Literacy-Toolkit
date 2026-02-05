# Password Recovery System

## Overview

Students can recover their passwords using a secure email-based reset system. The system sends a password reset link to the student's email address. The reset link contains a token that expires after 1 hour and can only be used once.

## User Flow

### Password Recovery Process

1. **Request Reset**
   - Student visits `/forgot-password` page
   - Enters Course Code and Email Address
   - System validates email and generates reset token
   - Reset link is sent to student's email address
   - Success message is displayed (doesn't reveal if email exists - security best practice)

2. **Receive Email**
   - Student receives email with password reset link
   - Link format: `/reset-password?token=XXX&courseCode=XXX`
   - Link expires in 1 hour

3. **Reset Password**
   - Student clicks link in email (or manually navigates to reset page)
   - Student enters:
     - Course Code (pre-filled from link)
     - Reset Token (pre-filled from link)
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
  "courseCode": "QUINN 102",
  "email": "student@example.com"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link has been sent."
}
```

**Response (Error):**
```json
{
  "error": "Please provide a valid email address"
}
```

**Note**: The API always returns success (even if email doesn't exist) to prevent email enumeration attacks.

### POST `/api/student/reset-password`

**Request:**
```json
{
  "courseCode": "QUINN 102",
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

## Email Delivery

The system sends password reset links via email using the `sendPasswordResetEmail` function in `/lib/email.ts`.

### Email Service Integration

Currently, the email sending function is structured but requires an email service to be configured:

```typescript
// In lib/email.ts
// TODO: Implement with email service (SendGrid, AWS SES, Nodemailer, etc.)
```

**To enable email sending**, you need to:

1. **Choose an email service** (recommended: SendGrid, AWS SES, or Resend)
2. **Install the service SDK** (e.g., `npm install @sendgrid/mail`)
3. **Set environment variables**:
   ```env
   SENDGRID_API_KEY=your_api_key
   NEXT_PUBLIC_APP_URL=https://your-domain.com
   ```
4. **Update `lib/email.ts`** to use the actual email service

### Email Template

The reset email includes:
- Professional HTML template with L. University branding
- Clear call-to-action button
- Plain text fallback
- Security notice about expiration
- Direct link and copyable URL

### Reset Link Format

Reset links are in the format:
```
/reset-password?token=XXX&courseCode=QUINN%20102
```

The reset page automatically pre-fills these values from URL parameters.

## Error Handling

### Common Errors

1. **"Please provide a valid email address"**
   - Invalid email format entered

2. **"No password set for this account"**
   - Student needs to complete onboarding first

3. **"Invalid or expired reset token"**
   - Token doesn't exist
   - Token has expired (older than 1 hour)
   - Token was already used
   - Wrong course code provided

4. **"This reset token has already been used"**
   - Token was used previously
   - Student needs to request a new token

### Security Features

- **Email Enumeration Prevention**: API always returns success message, even if email doesn't exist
- **Token Expiration**: Tokens expire after 1 hour
- **Single Use**: Tokens can only be used once
- **Course Validation**: Token is validated against course code

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
2. Visits `/forgot-password?courseCode=QUINN%20102`
3. Enters Email Address
4. Clicks "Send Reset Link"
5. Receives email with reset link
6. Clicks link in email (or navigates to `/reset-password?token=XXX&courseCode=QUINN%20102`)
7. Enters new password
8. Password is reset
9. Redirected to login page

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

