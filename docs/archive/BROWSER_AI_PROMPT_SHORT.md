# Browser AI Prompt: Setup Email Password Recovery

Copy and paste this entire prompt to your browser AI:

---

**Task**: Complete email-based password recovery setup for Financial Literacy Assessment Platform using Resend free tier.

**Project**: Next.js 14 app at `/root/Financial-Literacy-Toolkit`

**Current Status**: 
- Email template ready in `apps/web/src/lib/email.ts`
- API routes ready (`/api/student/forgot-password`, `/api/student/reset-password`)
- Frontend pages ready (`/forgot-password`, `/reset-password`)
- **Missing**: Actual email service implementation

**Steps to Complete**:

1. **Sign up for Resend**:
   - Go to https://resend.com
   - Create free account
   - Verify email

2. **Get API Key**:
   - Dashboard → API Keys → Create API Key
   - Name: "Financial Literacy Toolkit"
   - Copy the API key (starts with `re_`)

3. **Install Resend Package**:
   ```bash
   cd /root/Financial-Literacy-Toolkit/apps/web
   npm install resend
   ```

4. **Update `apps/web/src/lib/email.ts`**:
   - Replace the `sendEmail` function with Resend implementation
   - Use this code:
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
   - Keep the existing `sendPasswordResetEmail` function (it's already correct)

5. **Set Environment Variables**:
   - Create/update `apps/web/.env.local`:
   ```
   RESEND_API_KEY=re_your_actual_api_key_here
   RESEND_FROM_EMAIL=onboarding@resend.dev
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
   - Replace `re_your_actual_api_key_here` with the API key from step 2

6. **Test**:
   - Run `cd /root/Financial-Literacy-Toolkit && pnpm dev`
   - Go to http://localhost:3000/forgot-password
   - Enter test email and course code "QUINN 102"
   - Check email inbox for reset link
   - Verify link works

7. **Verify in Resend Dashboard**:
   - Check "Logs" section for sent email
   - Confirm delivery status

**Files to Modify**:
- `apps/web/src/lib/email.ts` - Add Resend implementation
- `apps/web/package.json` - Will be updated by npm install
- `apps/web/.env.local` - Add environment variables

**Success Criteria**:
✅ Resend account created  
✅ API key obtained  
✅ Package installed  
✅ Email function implemented  
✅ Environment variables set  
✅ Test email received and link works  

**Note**: Resend free tier = 3,000 emails/month (more than enough for 50-200 students)

Start with step 1 and complete all steps sequentially. Report progress after each step.

---

