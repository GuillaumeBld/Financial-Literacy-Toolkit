# Test Email Password Recovery

## Quick Test Guide

### Prerequisites
✅ Dev server is running (port 3000)
✅ Resend API key configured
✅ Environment variables set

### Step-by-Step Test

#### 1. Navigate to Forgot Password Page
- Open browser: `http://localhost:3000/forgot-password`
- Or click "Forgot password?" link from login page

#### 2. Request Password Reset
- **Course Code**: `QUINN 102` (pre-filled)
- **Email**: Enter your test email address
- Click **"Send Reset Link"**

#### 3. Check Your Email
- Check inbox (may take a few seconds)
- Check spam/junk folder
- Look for email from: `onboarding@resend.dev`
- Subject: "Password Reset Request - Financial Literacy Assessment"

#### 4. Click Reset Link
- Click the **"Reset Password"** button in the email
- Should redirect to: `http://localhost:3000/reset-password?token=...&courseCode=QUINN%20102`

#### 5. Reset Password
- **Course Code**: Should be pre-filled
- **Reset Token**: Should be pre-filled from URL
- **New Password**: Enter new password (min 8 characters)
- **Confirm Password**: Re-enter password
- Click **"Reset Password"**

#### 6. Verify Success
- Should see success message
- Should redirect to login page
- Try logging in with new password

## Expected Results

### ✅ Success Indicators
- Email received within 10-30 seconds
- Email has proper formatting (Loyola maroon colors)
- Reset link works and redirects correctly
- Password reset succeeds
- Can login with new password

### ❌ Troubleshooting

**Email not received:**
1. Check server console for errors
2. Check Resend dashboard logs
3. Verify email address is correct
4. Check spam folder

**Reset link not working:**
1. Check token hasn't expired (1 hour limit)
2. Verify token in URL is complete
3. Check server logs for errors

**Password reset fails:**
1. Check password meets requirements (8+ characters)
2. Verify passwords match
3. Check server console for errors

## Check Server Logs

Watch the terminal where `pnpm dev` is running for:
- `Email sent successfully: { to: ..., subject: ..., id: ... }`
- Any error messages

## Check Resend Dashboard

1. Go to https://resend.com
2. Log in
3. Navigate to **"Logs"** or **"Emails"**
4. See your test email
5. Check delivery status

## Test Checklist

- [ ] Can access `/forgot-password` page
- [ ] Can submit password reset request
- [ ] Email received within 30 seconds
- [ ] Email has correct formatting
- [ ] Reset link in email works
- [ ] Can access `/reset-password` page
- [ ] Token is pre-filled from URL
- [ ] Can set new password
- [ ] Password reset succeeds
- [ ] Can login with new password
- [ ] Email appears in Resend dashboard

## Quick Test Command

If you want to test the email function directly, you can check the server logs after submitting the form. The email should be sent and logged.

