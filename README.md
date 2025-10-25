# Financial Literacy Assessment Platform

AI-assisted pre and post financial literacy assessment for finance students at Loyola University Chicago, Quinlan School of Business, Finance Department. Web-based, FERPA-compliant, production-ready MVP.

## Live Demo
Deployed on Vercel: [https://your-app.vercel.app](https://your-app.vercel.app) (after deployment)

Test Credentials:
- Course Code: `Financial Literacy`
- Student ID: `123456789` (any 6-12 digits)

## Current Status: MVP COMPLETE

### Delivered Features
- Complete Assessment Flow: Start → Questions → Submit → Results
- FERPA Compliance: Hashed student IDs, no raw data stored
- Database: Supabase PostgreSQL with Row Level Security
- Frontend: Next.js 14 with Loyola University Chicago branding
- Production Ready: Build tested, deployment guides ready
- Zero Cost: Free Supabase + Vercel tiers

### Roadmap (Next Phases)
- AI Scoring: Modal workers for short answer evaluation
- Instructor Dashboard: Analytics and cohort reporting
- LMS Integration: LTI 1.3 for Canvas/Blackboard
- Advanced Analytics: Pre/post comparison reports

---

## Institutional Context
- Institution: Loyola University Chicago, Quinlan School of Business, Finance Department
- Audience: Finance students in Quinlan courses
- Use Case: Assess student financial literacy before and after class
- Governance: Instructor-led administration, FERPA compliant storage, no raw student IDs

## Assessment Outcomes

### Per Student
- Pre-assessment score, post-assessment score, change metrics
- Domain-specific deltas and confidence gaps
- Completion time and response patterns

### Per Course
- Participation rates and completion funnels
- Mean pre/post scores with 95% confidence intervals
- Within-subject effect size analysis
- Fairness checks and anomaly detection

---

## Technology Stack

### Implemented
- Frontend: Next.js 14, React 18, TypeScript
- Styling: Tailwind CSS with Loyola branding
- Database: Supabase PostgreSQL with Row Level Security
- Authentication: FERPA-compliant hashed student IDs
- Hosting: Vercel (production deployment ready)
- Security: SHA256 hashing with per-course peppers

### Planned
- AI Worker: Python 3.11 with Modal/AWS Lambda
- LLM Integration: Together AI for scoring
- Analytics: Advanced statistical analysis
- LMS SSO: Canvas/Blackboard integration

---

## Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js Web   │────│   Supabase      │────│   Modal Worker  │
│   Frontend      │    │   PostgreSQL    │    │   (Future)      │
│                 │    │   + RLS         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────┐
                    │   Vercel        │
                    │   Hosting       │
                    └─────────────────┘
```

### Data Flow
1. Student → Enters course code + student ID
2. System → Validates and hashes credentials
3. Assessment → Serves randomized questions
4. Submission → Saves responses to Supabase
5. AI Scoring → Evaluates short answers (future)
6. Results → Displays completion confirmation

---

## Repository Structure

```
/
├── apps/
│   └── web/                 # Next.js application
│       ├── src/app/         # Next.js app router pages
│       ├── lib/             # Supabase client, auth utils
│       └── test-supabase.js # Database connection test
├── infra/                   # Database schema & setup
│   ├── schema.sql          # PostgreSQL schema
│   ├── seed.sql            # Sample data
│   └── rls-policies.sql    # Row Level Security policies
├── PDF/                     # Financial literacy research PDFs
├── docs/                    # Documentation (legacy)
└── *.md                     # Setup and deployment guides
```

---

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- GitHub account for Vercel deployment

### 1. Clone and Install
```bash
git clone https://github.com/GuillaumeBld/Financial-Literacy-Toolkit.git
cd financial-literacy-toolkit
npm install
```

### 2. Database Setup
```bash
# Run these in Supabase SQL Editor:
# 1. infra/schema.sql (creates tables)
# 2. infra/seed.sql (adds sample data)
# 3. infra/rls-policies.sql (enables security)
```

### 3. Environment Variables
```bash
cd apps/web
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
```

### 4. Run Locally
```bash
cd apps/web
npm run dev
# Open http://localhost:3001
```

### 5. Deploy to Production
```bash
# Follow VERCEL_DEPLOYMENT.md
# Deploy takes 5 minutes, costs $0/month
```

---

## Security & FERPA Compliance

### Implemented Security
- Row Level Security: Database-level access control
- Hashed Student IDs: SHA256(course_pepper + student_id)
- No Raw Data Storage: FERPA compliant from day one
- Per-Course Peppers: Rotate security keys per term

### Authentication Flow
```
Student ID "123456789" + Course Pepper → SHA256 Hash → Database Key
Result: Students identifiable within course, anonymous across system
```

### Data Protection
- Service role access for API operations
- User-scoped access for personal data
- Instructor access for course analytics
- Audit trails for all operations

---

## Assessment Features

### Question Types
- Multiple Choice: Financial knowledge questions
- Short Answer: Open-ended responses (AI scoring ready)
- Confidence Ratings: Self-assessment per question

### Assessment Flow
1. Course Validation: Verify course code exists
2. Student Authentication: Hash and validate student ID
3. Question Randomization: Prevent cheating, ensure fairness
4. Time Tracking: 20-minute completion window
5. Response Validation: Required answers, data integrity
6. Secure Submission: All responses saved to database
7. Results Display: Completion confirmation

### Scoring System
- MCQ: Automated key-based scoring
- Short Answer: Ready for AI evaluation (future)
- Confidence Gap: z(confidence) - z(score) analysis

---

## Analytics & Reporting

### Current (MVP)
- Individual student completion tracking
- Response storage with timestamps
- Basic results display

### Planned Features
- Cohort Analytics: Pre/post score comparisons
- Domain Analysis: Financial literacy sub-domains
- Effect Size: Statistical significance testing
- Fairness Checks: Demographic analysis (opt-in)
- Instructor Dashboard: Real-time monitoring
- Export Capabilities: CSV/PDF reports

---

## Deployment Options

### Option 1: Vercel (Recommended)
```bash
# Web interface: vercel.com
# Import GitHub repo
# Set root directory: apps/web
# Add environment variables
# Deploy (5 minutes)
```

Benefits: Free, fast, global CDN, automatic HTTPS

### Option 2: Self-Hosted
- Web Server: Any Node.js hosting
- Database: Supabase or PostgreSQL
- Domain: Custom SSL certificate

---

## Development

### Available Scripts
```bash
# Install dependencies
npm install

# Run development server
cd apps/web && npm run dev

# Build for production
cd apps/web && npm run build

# Test database connection
cd apps/web && node test-supabase.js
```

### Environment Variables
See `GET_SUPABASE_CREDENTIALS.md` for setup instructions.

---

## Contributing

### Development Workflow
1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

### Code Standards
- TypeScript: Strict type checking enabled
- ESLint: Code quality and consistency
- Prettier: Automated code formatting
- Accessibility: WCAG 2.1 AA compliance

---

## Documentation

- `SUPABASE_SETUP.md` - Database configuration
- `VERCEL_DEPLOYMENT.md` - Production deployment
- `NEXT_STEPS_ROADMAP.md` - Development roadmap
- `OPTIMAL_TECH_STACK.md` - Technology decisions
- `FERPA_COMPLIANCE.md` - Privacy and security

---

## Support

For questions or issues:
- GitHub Issues: Bug reports and feature requests
- Documentation: Check setup guides first
- FERPA Questions: Review compliance documentation

---

## License

This project is developed for Loyola University Chicago, Quinlan School of Business research purposes.

---

Ready for Quinlan pilot deployment! Built with love for Loyola University Chicago.

_Last updated: 2025-10-25_
