# Email Service Pricing & Alternatives Research

## Email Service Provider Pricing Comparison

### Transactional Email Services (Best for Password Resets)

#### 1. **Amazon SES (Simple Email Service)**
- **Free Tier**: First 62,000 emails/month free (if hosted on EC2)
- **Pricing**: $0.10 per 1,000 emails after free tier
- **Cost for 1,000 students/month**: ~$0.10 (if over free tier)
- **Pros**: 
  - Very cheap for low volume
  - High deliverability
  - Integrates with AWS
- **Cons**: 
  - Requires AWS account setup
  - More complex configuration
  - Need to verify domain/emails

#### 2. **SendGrid**
- **Free Tier**: 100 emails/day (3,000/month)
- **Pricing**: $19.95/month for 50,000 emails
- **Cost for 1,000 students/month**: Free (within free tier)
- **Pros**: 
  - Easy to use
  - Good free tier for testing
  - Good documentation
- **Cons**: 
  - Limited free tier
  - Paid plans can be expensive for low volume

#### 3. **Resend**
- **Free Tier**: 3,000 emails/month, 100 emails/day
- **Pricing**: $20/month for 50,000 emails
- **Cost for 1,000 students/month**: Free (within free tier)
- **Pros**: 
  - Modern API
  - Great developer experience
  - Good free tier
- **Cons**: 
  - Newer service (less established)
  - Similar pricing to SendGrid

#### 4. **Mailgun**
- **Free Tier**: 5,000 emails/month for first 3 months, then 1,000/month
- **Pricing**: $15/month for 10,000 emails
- **Cost for 1,000 students/month**: Free initially, then $15/month
- **Pros**: 
  - Good free tier initially
  - Comprehensive API
- **Cons**: 
  - Free tier reduces after 3 months
  - Need to verify domain

#### 5. **Postmark**
- **Free Tier**: None
- **Pricing**: $15/month for 10,000 emails
- **Cost for 1,000 students/month**: $15/month
- **Pros**: 
  - Excellent deliverability
  - Great for transactional emails
- **Cons**: 
  - No free tier
  - More expensive

### Cost Analysis for Academic Use Case

**Scenario**: Quinn 102 (Financial Literacy) class
- **Estimated students**: 50-200 per semester
- **Password resets needed**: ~5-10% of students = 3-20 resets per semester
- **Total emails needed**: ~3-20 per semester (very low volume)

**Recommendation**: 
- **Free tier is sufficient** for this use case
- Any service with 1,000+ emails/month free tier will work
- **Best option**: Resend or SendGrid (both have 3,000/month free)

## Free Alternatives to Email-Based Password Recovery

### Option 1: Instructor-Assisted Password Reset (RECOMMENDED FOR ACADEMIC USE)

**How it works:**
- Student contacts instructor via email/office hours
- Instructor verifies student identity (in-person or via student ID)
- Instructor can reset password via instructor dashboard
- No email service needed

**Pros:**
- ✅ **Completely free** - no email service costs
- ✅ **Secure** - instructor verifies identity
- ✅ **Academic-friendly** - fits institutional workflow
- ✅ **FERPA compliant** - instructor already has access to student records
- ✅ **Simple implementation** - just add reset function to instructor dashboard

**Cons:**
- ⚠️ Requires instructor availability
- ⚠️ Not instant (depends on instructor response time)
- ⚠️ Manual process

**Implementation**: Add password reset feature to instructor dashboard

### Option 2: Security Questions (During Onboarding)

**How it works:**
- Student sets up 2-3 security questions during onboarding
- If password forgotten, student answers questions to reset
- No email needed

**Pros:**
- ✅ **Completely free**
- ✅ **Instant** - no waiting for email
- ✅ **No external dependencies**

**Cons:**
- ⚠️ Less secure (answers can be guessed/researched)
- ⚠️ Students might forget answers
- ⚠️ Not ideal for academic use

### Option 3: SMS-Based Recovery

**How it works:**
- Student provides phone number during onboarding
- Reset code sent via SMS
- Student enters code to reset password

**Pricing:**
- **Twilio**: $0.0075 per SMS (US), $0.01-0.05 international
- **Cost for 20 resets**: ~$0.15-1.00
- **Free tier**: Usually none, or very limited

**Pros:**
- ✅ Fast delivery
- ✅ High security
- ✅ Works without email

**Cons:**
- ⚠️ **Costs money** (though minimal)
- ⚠️ Requires phone number collection
- ⚠️ International students may have higher costs

### Option 4: Display Token on Screen (Current Implementation)

**How it works:**
- Student requests reset
- Token displayed on screen
- Student copies and uses token

**Pros:**
- ✅ **Completely free**
- ✅ **No external dependencies**
- ✅ **Instant**

**Cons:**
- ⚠️ Less secure (token visible on screen)
- ⚠️ Requires student to be at computer
- ⚠️ Not ideal UX

### Option 5: University Email Integration

**How it works:**
- Use university's existing email infrastructure
- Send emails via university SMTP server
- No third-party service needed

**Pros:**
- ✅ **Free** (if university allows)
- ✅ Uses existing infrastructure
- ✅ Professional (from university domain)

**Cons:**
- ⚠️ Requires university IT approval
- ⚠️ May have rate limits
- ⚠️ Setup complexity

## Recommendation Matrix

| Solution | Cost | Security | UX | Implementation | Best For |
|----------|------|---------|-----|----------------|----------|
| **Instructor Reset** | Free | High | Medium | Easy | **Academic use** ✅ |
| **Email (Free Tier)** | Free | High | High | Medium | Low volume |
| **Security Questions** | Free | Low | Medium | Easy | Budget-constrained |
| **SMS** | Low ($) | High | High | Medium | High security needs |
| **Display Token** | Free | Medium | Low | Easy | Development/testing |

## Recommended Solution: Hybrid Approach

### Primary: Instructor-Assisted Reset
- Add password reset function to instructor dashboard
- Instructor can reset any student's password in their course
- Verifies identity through existing academic processes
- **Cost**: $0
- **Implementation**: Add API endpoint + UI to instructor dashboard

### Secondary: Email-Based Reset (Optional)
- Keep email functionality for automated resets
- Use free tier of Resend or SendGrid
- **Cost**: $0 (within free tier limits)
- **Implementation**: Already structured, just need to configure email service

### Benefits:
1. **Free primary option** (instructor reset)
2. **Automated backup** (email reset)
3. **Flexibility** for students
4. **No ongoing costs** for low-volume academic use

## Implementation Priority

1. **Phase 1**: Implement instructor-assisted password reset (FREE, immediate)
2. **Phase 2**: Configure email service if needed (FREE tier sufficient)
3. **Phase 3**: Consider SMS if volume increases significantly

## Cost Summary

**For Quinn 102 (50-200 students, ~10 resets/semester):**
- **Instructor Reset**: $0/month
- **Email (Free Tier)**: $0/month (within limits)
- **Email (Paid)**: $0/month (volume too low)
- **SMS**: ~$0.10-0.50/semester (if used)

**Conclusion**: For academic use with low volume, **instructor-assisted reset is the best free option**, with email as a free automated backup.

