# Browser AI Prompt: Complete Email Password Recovery Setup

## Instructions for Browser AI

You are tasked with completing the email-based password recovery implementation for the Financial Literacy Assessment Platform. The code structure is already in place, but the email service needs to be configured using Resend's free tier (3,000 emails/month).

## Project Context

- **Project**: Financial Literacy Assessment Platform
- **Framework**: Next.js 14
- **Location**: `/root/Financial-Literacy-Toolkit`
- **Email Service**: Resend (free tier: 3,000 emails/month)
- **Current Status**: Email template and API routes are ready, but `apps/web/src/lib/email.ts` needs implementation

## Step-by-Step Tasks

### Step 1: Sign Up for Resend Account

1. Navigate to https://resend.com in the browser
2. Click "Sign Up" or "Get Started"
3. Create an account using your email address
4. Verify your email address if required
5. Complete any onboarding steps

### Step 2: Get API Key

1. After logging in, navigate to the "API Keys" section (usually in Settings or Dashboard)
2. Click "Create API Key" or "Add API Key"
3. Give it a name like "Financial Literacy Toolkit - Production"
4. Copy the API key immediately (you won't be able to see it again)
5. Save it securely - you'll need it for the environment variable

### Step 3: Verify Domain (Optional but Recommended)

1. In Resend dashboard, go to "Domains" section
2. Click "Add Domain"
3. Enter your domain (e.g., `qualiaai.fr` or your production domain)
4. Follow the DNS verification steps:
   - Add the provided DNS records to your domain
   - Wait for verification (can take a few minutes)
5. Once verified, you can send emails from your domain
6. **Note**: For testing, you can use Resend's test domain first, then switch to your verified domain later

### Step 4: Install Resend Package

1. Navigate to the project directory: `/root/Financial-Literacy-Toolkit/apps/web`
2. Install the Resend npm package by running:
   ```bash
   cd /root/Financial-Literacy-Toolkit/apps/web
   npm install resend
   ```
   Or if using pnpm:
   ```bash
   cd /root/Financial-Literacy-Toolkit/apps/web
   pnpm add resend
   ```

### Step 5: Update Email Implementation

1. Open the file: `apps/web/src/lib/email.ts`
2. Replace the placeholder `sendEmail` function with actual Resend implementation
3. The implementation should:
   - Import Resend SDK
   - Use `RESEND_API_KEY` environment variable
   - Send emails using Resend API
   - Handle errors appropriately
   - Keep the existing `sendPasswordResetEmail` function structure (it's already correct)

**Expected Implementation Pattern:**
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: EmailOptions): Promise<void> {
  if (!process.env.RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY environment variable is not set');
  }

  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev',
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    });
  } catch (error) {
    console.error('Failed to send email:', error);
    throw error;
  }
}
```

### Step 6: Set Environment Variables

1. Check if there's a `.env.local` or `.env` file in `apps/web/`
2. If not, create `.env.local` file
3. Add the following environment variables:
   ```
   RESEND_API_KEY=re_your_api_key_here
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. **Important**: 
   - Replace `re_your_api_key_here` with the actual API key from Step 2
   - For `RESEND_FROM_EMAIL`, use:
     - Your verified domain email (e.g., `noreply@qualiaai.fr`) if domain is verified
     - Or `onboarding@resend.dev` for testing (Resend's test domain)
   - Update `NEXT_PUBLIC_APP_URL` to your production URL when deploying

### Step 7: Update Package.json (if needed)

1. Verify that `resend` package is listed in `apps/web/package.json` dependencies
2. If using TypeScript, ensure types are available (Resend includes TypeScript types)

### Step 8: Test the Implementation

1. Start the development server:
   ```bash
   cd /root/Financial-Literacy-Toolkit
   pnpm dev
   ```
2. Navigate to the forgot password page: `http://localhost:3000/forgot-password`
3. Enter a test email address (use your own email for testing)
4. Enter course code: "QUINN 102"
5. Submit the form
6. Check your email inbox (and spam folder) for the password reset email
7. Click the reset link in the email
8. Verify that it redirects to the reset password page with the token pre-filled
9. Set a new password and verify it works

### Step 9: Verify Email Template

1. Check that the received email:
   - Has the correct subject: "Password Reset Request - Financial Literacy Assessment"
   - Contains the reset link
   - Has proper styling (Loyola maroon colors)
   - Shows expiration notice (1 hour)
   - Includes fallback text link

### Step 10: Check Resend Dashboard

1. Go back to Resend dashboard
2. Navigate to "Logs" or "Emails" section
3. Verify that the test email appears in the logs
4. Check delivery status (should be "Delivered")
5. Review any errors if the email failed

### Step 11: Update Documentation

1. Create or update `docs/EMAIL_SETUP.md` with:
   - Resend account information
   - API key location (stored in environment variables)
   - Domain verification status
   - Free tier limits (3,000 emails/month)
   - Testing instructions

### Step 12: Production Deployment Notes

1. Ensure environment variables are set in production:
   - `RESEND_API_KEY` (from Resend dashboard)
   - `RESEND_FROM_EMAIL` (verified domain email)
   - `NEXT_PUBLIC_APP_URL` (production URL)
2. Verify domain in Resend before going to production
3. Test email delivery in production environment
4. Monitor Resend dashboard for email delivery rates

## Files to Modify

1. **`apps/web/src/lib/email.ts`** - Implement Resend email sending
2. **`apps/web/package.json`** - Add resend dependency (via npm/pnpm install)
3. **`apps/web/.env.local`** - Add environment variables
4. **`docs/EMAIL_SETUP.md`** - Document setup (create if doesn't exist)

## Success Criteria

✅ Resend account created and verified  
✅ API key obtained and stored securely  
✅ Resend package installed  
✅ `email.ts` file updated with Resend implementation  
✅ Environment variables configured  
✅ Test email sent successfully  
✅ Password reset link works correctly  
✅ Email appears in Resend dashboard logs  
✅ Documentation updated  

## Troubleshooting

- **"API key not found"**: Check that `RESEND_API_KEY` is set in `.env.local`
- **"Email not sending"**: Check Resend dashboard logs for errors
- **"Domain not verified"**: Use `onboarding@resend.dev` for testing, verify domain for production
- **"Email in spam"**: Verify domain and set up SPF/DKIM records in Resend
- **"Module not found"**: Run `npm install` or `pnpm install` again

## Additional Notes

- Resend free tier: 3,000 emails/month, 100 emails/day
- For Quinn 102 (50-200 students), this is more than sufficient
- Email template is already designed and ready in `sendPasswordResetEmail` function
- The reset token flow is already implemented in API routes
- No changes needed to frontend pages (they're already complete)

## Next Steps After Completion

1. Test the full password recovery flow end-to-end
2. Monitor email delivery rates in Resend dashboard
3. Set up email alerts in Resend for delivery failures
4. Consider setting up domain authentication (SPF, DKIM) for better deliverability
5. Document the process for future maintenance

---

**Start with Step 1 and proceed sequentially. Report any issues or questions as you complete each step.**

