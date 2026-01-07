# Repository Structure

This document describes the organization of the Financial Literacy Toolkit repository.

## Directory Structure

```
/
├── apps/web/              # Next.js application source code
├── infra/                 # Database schemas and SQL scripts
├── docs/                  # Main documentation
│   ├── deployment/       # Deployment guides and workflows
│   ├── troubleshooting/  # Fix guides and issue resolution
│   └── *.md             # Feature, architecture, and API docs
├── archive/              # Archived files and historical documentation
│   ├── migration/        # Old migration notes
│   └── *.md             # Historical test results and planning docs
├── PDF/                  # Research PDFs and reference materials
├── scripts/              # Utility and deployment scripts
├── Dockerfile            # Production Docker configuration
├── dokploy.yml          # Dokploy deployment configuration
└── README.md            # Main project documentation
```

## Documentation Organization

### Main Documentation (`docs/`)

**Core Documentation:**
- `ARCHITECTURE.md` - System architecture and design
- `API_REFERENCE.md` - API endpoints and usage
- `DATA_MODEL.md` - Database schema and relationships
- `UX_SPEC.md` - User experience specifications
- `SECURITY_PRIVACY.md` - Security and privacy policies
- `FERPA_COMPLIANCE.md` - FERPA compliance documentation

**Development:**
- `LOCAL_DEVELOPMENT.md` - Local setup and development
- `SETUP.md` - Initial setup instructions
- `ENVIRONMENT_VARIABLES.md` - Environment configuration
- `CONTRIBUTING.md` - Contribution guidelines

**Operations:**
- `OPERATIONS.md` - Operational procedures
- `RELEASE_PLAYBOOK.md` - Release process
- `CHANGELOG.md` - Version history

### Deployment Documentation (`docs/deployment/`)

All deployment-related guides and workflows:
- `DEPLOYMENT_WORKFLOW.md` - Main deployment workflow
- `DEPLOYMENT_STATUS.md` - Current deployment status
- `QUICK_DEPLOY.md` - Quick deployment guide
- `DOKPLOY_*.md` - Dokploy-specific configuration
- `DOMAIN_*.md` - Domain setup guides
- `VERCEL_*.md` - Vercel deployment (if applicable)

### Troubleshooting (`docs/troubleshooting/`)

Issue resolution and fix documentation:
- `VPS_TROUBLESHOOTING.md` - VPS and infrastructure issues
- `VPS_AGENT_PROMPT.md` - AI agent prompts for VPS management
- `STATIC_FILES_FIX.md` - CSS/JS serving issues
- `ASSESSMENT_*.md` - Application-specific fixes
- `CRITICAL_FIX_*.md` - Critical issue resolutions

### Archive (`archive/`)

Historical documentation kept for reference:
- `migration/` - Old migration notes and setup guides
- Test results and summaries
- Old planning documents
- Temporary setup files
- Superseded documentation

## File Naming Conventions

- **UPPERCASE.md** - Important guides and status documents
- **lowercase.md** - Feature documentation and specs
- **PREFIX_*.md** - Grouped related documents (e.g., `DEPLOYMENT_*.md`)

## Quick Reference

- **Getting Started**: See `README.md` and `docs/SETUP.md`
- **Deployment**: See `docs/deployment/DEPLOYMENT_WORKFLOW.md`
- **Troubleshooting**: See `docs/troubleshooting/README.md`
- **Architecture**: See `docs/ARCHITECTURE.md`
- **API**: See `docs/API_REFERENCE.md`

## Maintenance

- Keep root directory clean - only essential files
- New documentation should go in appropriate `docs/` subdirectory
- Archive old/outdated docs to `archive/` rather than deleting
- Update this file when structure changes

