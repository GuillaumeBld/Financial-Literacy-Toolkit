# Financial Literacy Toolkit - Setup Guide

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or pnpm
- Git

### Installation Steps

1. **Install dependencies**
   ```bash
   cd apps/web
   npm install
   ```

2. **Run development server**
   ```bash
   npm run dev
   ```

3. **Open in browser**
   Navigate to `http://localhost:3000`

## Project Structure

```
/
├── apps/
│   └── web/              # Next.js frontend application
│       ├── src/
│       │   ├── app/      # App router pages
│       │   │   ├── page.tsx          # Home page
│       │   │   ├── start/            # Assessment start page
│       │   │   └── assessment/       # Assessment interface
│       │   └── components/           # Reusable components
│       ├── public/                   # Static assets
│       └── package.json
├── docs/                 # Documentation
└── README.md
```

## Features Implemented

### ✅ Landing Page
- Modern hero section with gradient text
- Feature cards highlighting key capabilities
- Sample assessment preview
- Responsive design with Tailwind CSS

### ✅ Start Assessment Page
- Course code and student ID input
- Consent checkbox for FERPA compliance
- Available assessments list
- Assessment information panel

### ✅ Assessment Interface
- Question navigation with progress bar
- Multiple choice and short answer support
- Confidence rating (1-5 scale)
- Timer countdown (20 minutes)
- Responsive layout

## Next Steps

### Backend Integration
1. Set up FastAPI worker for scoring
2. Configure PostgreSQL database
3. Implement authentication
4. Connect frontend to API endpoints

### Additional Features
- Results dashboard
- Instructor analytics
- Export functionality
- Email notifications

## Environment Variables

Create `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Deployment

The app is configured to deploy on Windsurf. See `docs/DEPLOY.md` for details.

## Support

For questions or issues, contact the Quinlan School of Business Finance Department.
