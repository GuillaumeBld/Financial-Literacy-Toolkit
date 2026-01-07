# Financial Literacy Assessment Platform

AI-assisted pre and post financial literacy assessment for finance students by Dr. Abol Jalilvand and Guillaume Bolivard. Web-based, FERPA-compliant, production-ready MVP.

## Live Demo
**Production**: https://financial-literacy.qualiaai.fr  
**Previous (Vercel)**: https://web-ljvb4yai3-guillaume-bolivards-projects.vercel.app

Test Credentials:
- Course Code: `Financial Literacy`
- Student ID: `123456789` (any 6-12 digits)

## Quick Update Workflow

**To update the website**: Push changes to GitHub's `main` branch. Dokploy will automatically deploy.

```bash
git add .
git commit -m "Your changes"
git push origin main
```

See [docs/deployment/QUICK_DEPLOY.md](./docs/deployment/QUICK_DEPLOY.md) for details.

## Deployment Status

✅ **Dokploy Setup**: Complete  
✅ **GitHub Auto-Deploy**: Enabled  
✅ **PostgreSQL Database**: Created  
✅ **Website**: Live at https://financial-literacy.qualiaai.fr  
✅ **Styling**: CSS and static files working correctly

**Deployment Documentation**: See [docs/deployment/](./docs/deployment/) for all deployment guides.

## Current Status: MVP COMPLETE

### Delivered Features
- Complete Assessment Flow: Start → Questions → Submit → Results
- FERPA Compliance: Hashed student IDs, no raw data stored
- Database: Supabase PostgreSQL with Row Level Security
- Frontend: Next.js 14 with custom branding
- Production Ready: Build tested, deployment guides ready
- Zero Cost: Free Supabase + Vercel tiers

### Roadmap (Next Phases)
- AI Scoring: Modal workers for short answer evaluation
- Instructor Dashboard: Analytics and cohort reporting
- LMS Integration: LTI 1.3 for Canvas/Blackboard
- Advanced Analytics: Pre/post comparison reports

---

## Institutional Context
- Institution: by Dr. Abol Jalilvand and Guillaume Bolivard
- Audience: Finance students in Q courses (specifically Quinn 102 - Financial Literacy)
- Use Case: Assess student financial literacy before and after class
- Governance: Instructor-led administration, FERPA compliant storage, no raw student IDs

## Research Objectives

This platform supports an independent study evaluating learning outcomes in Quinn 102 (Financial Literacy) during the 2026 offering. The study addresses two primary research questions:

- **RQ1 (Learning gains)**: What is the magnitude of student learning in Quinn 102, overall and within the domains of borrowing and credit, investment, and risk management, as measured by pre to post changes in knowledge?
- **RQ2 (Heterogeneity)**: Which baseline behavioral and contextual variables predict heterogeneity in learning gains across students, and do these predictors differ by domain?

For detailed information about the study design, assessment structure, and research methodology, see [`docs/research/independant_study.md`](./docs/research/independant_study.md).

**Quick Start**: See [`docs/implementation/QUICK_START.md`](./docs/implementation/QUICK_START.md) to execute the baseline covariates implementation.

## Assessment Outcomes

### Per Student
- Pre-assessment score, post-assessment score, change metrics
- Domain-specific deltas and confidence gaps
- Completion time and response patterns
- Baseline demographic and socioeconomic covariates (for heterogeneity analysis)

### Per Course
- Participation rates and completion funnels
- Mean pre/post scores with 95% confidence intervals
- Within-subject effect size analysis
- Fairness checks and anomaly detection
- Domain-level analysis (Borrowing & Credit, Investment, Risk Management)
- Heterogeneity analysis by baseline characteristics

---

## Technology Stack

### Implemented
- Frontend: Next.js 14, React 18, TypeScript
- Styling: Tailwind CSS with custom branding
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
├── docs/                    # Main documentation
│   ├── deployment/         # Deployment guides and workflows
│   ├── troubleshooting/    # Fix guides and issue resolution
│   └── *.md                # Feature and architecture docs
├── archive/                 # Archived files and old documentation
│   ├── migration/          # Old migration notes
│   └── *.md                # Historical test results and planning docs
├── PDF/                     # Financial literacy research PDFs
├── scripts/                 # Utility scripts
├── Dockerfile               # Production Docker configuration
├── dokploy.yml             # Dokploy deployment configuration
└── README.md               # This file
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
# See docs/deployment/DEPLOYMENT_WORKFLOW.md
# Auto-deploy on push to main branch via Dokploy
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

# Type check (catches syntax errors)
cd apps/web && npm run type-check

# Lint check
cd apps/web && npm run lint

# Run all checks
cd apps/web && npm run check

# Test database connection
cd apps/web && node test-supabase.js
```

### Code Quality Safeguards

This project includes automated checks to prevent errors:

- **Pre-commit hooks**: TypeScript and ESLint checks before each commit
- **Pre-push hooks**: Build verification before pushing to GitHub
- **CI/CD pipeline**: Automated checks on every push via GitHub Actions

See [docs/DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md) for details.

### Environment Variables
See `docs/ENVIRONMENT_VARIABLES.md` for setup instructions.

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

### Main Documentation (`docs/`)
- **Architecture & Features**: See `docs/ARCHITECTURE.md`, `docs/UX_SPEC.md`, `docs/API_REFERENCE.md`
- **Security & Compliance**: See `docs/FERPA_COMPLIANCE.md`, `docs/SECURITY_PRIVACY.md`
- **Development**: See `docs/LOCAL_DEVELOPMENT.md`, `docs/SETUP.md`

### Deployment (`docs/deployment/`)
- **DEPLOYMENT_WORKFLOW.md** - Main deployment workflow
- **QUICK_DEPLOY.md** - Quick deployment guide
- **DOKPLOY_*.md** - Dokploy configuration guides

### Troubleshooting (`docs/troubleshooting/`)
- **VPS_TROUBLESHOOTING.md** - VPS and deployment issues
- **STATIC_FILES_FIX.md** - CSS/JS serving fixes
- **ASSESSMENT_*.md** - Application issue resolutions

### Archived (`archive/`)
- Historical migration notes, test results, and planning documents

---

## Support

For questions or issues:
- GitHub Issues: Bug reports and feature requests
- Documentation: Check setup guides first
- FERPA Questions: Review compliance documentation

---

## License

This project is developed by Dr. Abol Jalilvand and Guillaume Bolivard for research purposes.

---

Ready for Q pilot deployment! Built with love by Dr. Abol Jalilvand and Guillaume Bolivard.

_Last updated: 2026-01-07_
