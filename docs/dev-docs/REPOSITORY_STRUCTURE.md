# Repository Structure

This document describes the organization of the Financial Literacy Toolkit repository.

## Directory Structure

```
/
├── apps/web/              # Next.js application source code
├── infra/                 # Database schemas and SQL scripts
├── docs/                  # Main documentation
│   ├── research/         # Research and study documentation
│   ├── implementation/   # Implementation notes and details
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

**Research (`docs/research/`):**
- `independant_study.md` - Complete independent study document
- `ALIGNMENT_SUMMARY.md` - Platform alignment with research objectives

**Implementation (`docs/implementation/`):**
- `IMPLEMENTATION_NOTES.md` - Feature implementation details and notes

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
- `STATIC_FILES_FIX.md` - CSS/JS serving issues
- `ASSESSMENT_*.md` - Application-specific fixes
- `CRITICAL_FIX_*.md` - Critical issue resolutions

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

## File Organization Rules

### Documentation Placement

1. **Research & Study Documentation** → `docs/research/`
   - Independent study documents
   - Research objectives and methodology
   - Alignment analyses

2. **Implementation Documentation** → `docs/implementation/`
   - Feature implementation notes
   - Development guides
   - Implementation checklists

3. **Deployment Documentation** → `docs/deployment/`
   - Deployment workflows
   - Platform-specific guides
   - Status updates

4. **Troubleshooting** → `docs/troubleshooting/`
   - Issue resolution guides
   - Fix instructions
   - Diagnostic procedures

5. **Core Documentation** → `docs/` (root)
   - Architecture, API, data model
   - Setup, operations, security
   - General project documentation

### Root Directory

**Keep Clean**: Only essential files at root:
- `README.md` - Main project documentation
- `package.json` - Project dependencies
- `Dockerfile` - Production container config
- `dokploy.yml` - Deployment config
- Configuration files (`.gitignore`, etc.)

**Do NOT place at root**:
- Documentation files (use `docs/`)
- Implementation notes (use `docs/implementation/`)
- Research documents (use `docs/research/`)
- Scripts (use `scripts/`)

## Maintenance

- Keep root directory clean - only essential files
- New documentation should go in appropriate `docs/` subdirectory
- Archive old/outdated docs to `archive/` rather than deleting
- Update this file when structure changes
- Follow naming conventions: UPPERCASE for important docs, lowercase for features

