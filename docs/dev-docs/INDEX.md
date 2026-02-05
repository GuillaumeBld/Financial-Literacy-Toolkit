# Documentation Index

**Status:** ✅ ACTIVE - Master Index
**Last Updated:** 2026-01-13
**Maintained By:** Development Team

---

## Quick Links

### 🚀 Getting Started
- [README.md](../README.md) - Project overview
- [Setup Guide](development/SETUP.md) - Local development setup
- [Quick Reference](QUICK_REFERENCE.md) - Common commands and procedures

### 📊 Current Production Status
- [Deployment Status](current/DEPLOYMENT_STATUS.md) - What's running now
- [Instructor Credentials](current/INSTRUCTOR_CREDENTIALS.md) - Login details
- [Active Issues](current/ACTIVE_ISSUES.md) - Known problems

### 🔒 Security
- [Bcrypt Upgrade (2026-01-13)](security/BCRYPT_UPGRADE_2026-01-13.md) - Latest security upgrade
- [Durability Guarantee](security/DURABILITY_GUARANTEE.md) - System resilience
- [FERPA Compliance](FERPA_COMPLIANCE.md) - Student privacy protection

### 🛠️ Operations
- [Deployment Guide](DEPLOY.md) - How to deploy
- [Monitoring](operations/MONITORING.md) - What to monitor
- [Troubleshooting](TROUBLESHOOTING_CREDENTIALS.md) - Common problems
- [Traefik Configuration](TRAEFIK_CONFIGURATION.md) - Reverse proxy setup

### 💻 Development
- [Architecture](ARCHITECTURE.md) - System design
- [API Reference](API_REFERENCE.md) - API endpoints
- [Database Model](DATA_MODEL.md) - Database schema
- [Contributing](CONTRIBUTING.md) - How to contribute

---

## Documentation Structure

```
docs/
├── INDEX.md (this file)           # Master index
├── DOCUMENTATION_GUIDE.md          # How to maintain docs
│
├── current/                        # ✅ ACTIVE - Production status
│   ├── DEPLOYMENT_STATUS.md       # Current deployment
│   ├── INSTRUCTOR_CREDENTIALS.md  # Login details
│   └── ACTIVE_ISSUES.md           # Known issues
│
├── security/                       # 🔒 Security implementations
│   ├── BCRYPT_UPGRADE_2026-01-13.md
│   └── DURABILITY_GUARANTEE.md
│
├── operations/                     # 🛠️ Ops guides
│   ├── deployment/
│   └── troubleshooting/
│
├── development/                    # 💻 Dev guides
│   ├── SETUP.md
│   ├── ARCHITECTURE.md
│   └── API_REFERENCE.md
│
└── archive-2026-01/               # 📦 Outdated docs
    └── README.md
```

---

## All Documentation by Category

### Current Production (docs/current/)
| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [DEPLOYMENT_STATUS.md](current/DEPLOYMENT_STATUS.md) | Current deployment state | 2026-01-13 |
| [INSTRUCTOR_CREDENTIALS.md](current/INSTRUCTOR_CREDENTIALS.md) | Login credentials | 2026-01-13 |
| [ACTIVE_ISSUES.md](current/ACTIVE_ISSUES.md) | Known issues | 2026-01-13 |

### Security (docs/security/)
| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [BCRYPT_UPGRADE_2026-01-13.md](security/BCRYPT_UPGRADE_2026-01-13.md) | Bcrypt authentication upgrade | 2026-01-13 |
| [DURABILITY_GUARANTEE.md](security/DURABILITY_GUARANTEE.md) | System durability and persistence | 2026-01-13 |

### Operations
| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [DEPLOY.md](DEPLOY.md) | Deployment procedures | Active |
| [TRAEFIK_CONFIGURATION.md](TRAEFIK_CONFIGURATION.md) | Reverse proxy setup | Active |
| [TROUBLESHOOTING_CREDENTIALS.md](TROUBLESHOOTING_CREDENTIALS.md) | Auth troubleshooting | Active |
| [deployment/](deployment/) | Deployment guides | Active |
| [troubleshooting/](troubleshooting/) | Issue resolution | Active |

### Development
| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [ARCHITECTURE.md](ARCHITECTURE.md) | System architecture | Active |
| [API_REFERENCE.md](API_REFERENCE.md) | API documentation | Active |
| [DATA_MODEL.md](DATA_MODEL.md) | Database schema | Active |
| [SETUP.md](SETUP.md) | Local setup | Active |
| [CONTRIBUTING.md](CONTRIBUTING.md) | Contribution guide | Active |
| [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) | Dev best practices | Active |
| [TESTING_GUIDE.md](TESTING_GUIDE.md) | Testing procedures | Active |

### Feature Documentation
| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [STUDENT_AUTHENTICATION.md](STUDENT_AUTHENTICATION.md) | Student auth system | Active |
| [FERPA_COMPLIANCE.md](FERPA_COMPLIANCE.md) | Privacy compliance | Active |
| [ONBOARDING_IMPLEMENTATION.md](ONBOARDING_IMPLEMENTATION.md) | Onboarding flow | Active |
| [QUESTION_FEATURES_IMPLEMENTATION.md](QUESTION_FEATURES_IMPLEMENTATION.md) | Question system | Active |

### Research & Planning
| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [ANTI_CHEATING_STRATEGIES.md](ANTI_CHEATING_STRATEGIES.md) | Anti-cheating research | Active |
| [PASSWORD_RECOVERY_OPTIONS.md](PASSWORD_RECOVERY_OPTIONS.md) | Password recovery research | Active |
| [EMAIL_SERVICE_RESEARCH.md](EMAIL_SERVICE_RESEARCH.md) | Email service options | Active |

### Compliance & Legal
| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [REQUIRED_PARTICIPATION_LEGAL_GUIDE.md](REQUIRED_PARTICIPATION_LEGAL_GUIDE.md) | Participation requirements | Active |
| [REQUIRED_SOCIOECONOMIC_DATA_LEGAL.md](REQUIRED_SOCIOECONOMIC_DATA_LEGAL.md) | Data collection legal | Active |
| [IRB_PROPOSAL_PARAGRAPH.md](IRB_PROPOSAL_PARAGRAPH.md) | IRB documentation | Active |

### Migration Documentation
| Document | Purpose | Last Updated |
|----------|---------|--------------|
| [VPS_POSTGRES_MIGRATION_COMPLETE.md](VPS_POSTGRES_MIGRATION_COMPLETE.md) | VPS migration completed | 2026-01-12 |
| [MIGRATION_FINAL_STATUS.md](MIGRATION_FINAL_STATUS.md) | Final migration status | 2026-01-12 |

---

## How to Use This Index

### I'm New to the Project
1. Start with [README.md](../README.md)
2. Read [ARCHITECTURE.md](ARCHITECTURE.md)
3. Follow [development/SETUP.md](development/SETUP.md)
4. Check [CONTRIBUTING.md](CONTRIBUTING.md)

### I Need to Deploy
1. Check [current/DEPLOYMENT_STATUS.md](current/DEPLOYMENT_STATUS.md)
2. Follow [DEPLOY.md](DEPLOY.md)
3. Update [current/DEPLOYMENT_STATUS.md](current/DEPLOYMENT_STATUS.md) after deploy

### I'm Investigating an Issue
1. Check [current/ACTIVE_ISSUES.md](current/ACTIVE_ISSUES.md)
2. Check [TROUBLESHOOTING_CREDENTIALS.md](TROUBLESHOOTING_CREDENTIALS.md)
3. Review recent changes in [current/DEPLOYMENT_STATUS.md](current/DEPLOYMENT_STATUS.md)

### I'm Implementing a Feature
1. Read relevant docs in this index
2. Update docs as you make changes
3. Follow [DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md)
4. Update this INDEX.md if adding new docs

### I Need Credentials
1. [current/INSTRUCTOR_CREDENTIALS.md](current/INSTRUCTOR_CREDENTIALS.md) - Instructor logins
2. [TEST_CREDENTIALS.md](TEST_CREDENTIALS.md) - Test accounts

---

## Recently Updated

| Document | What Changed | Date |
|----------|--------------|------|
| [BCRYPT_UPGRADE_2026-01-13.md](security/BCRYPT_UPGRADE_2026-01-13.md) | Security upgrade completed | 2026-01-13 |
| [DURABILITY_GUARANTEE.md](security/DURABILITY_GUARANTEE.md) | Durability testing and docs | 2026-01-13 |
| [DEPLOYMENT_STATUS.md](current/DEPLOYMENT_STATUS.md) | Updated with bcrypt changes | 2026-01-13 |
| [INSTRUCTOR_CREDENTIALS.md](current/INSTRUCTOR_CREDENTIALS.md) | Moved from root, updated status | 2026-01-13 |

---

## Documentation Maintenance

### Guidelines
See: [DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md) for:
- How to update docs
- When to archive docs
- Documentation standards
- One source of truth principle

### Review Schedule
- **Daily:** Current production docs
- **Weekly:** Active issues and operations docs
- **Monthly:** Security and development docs
- **Quarterly:** Full documentation audit

---

## Archived Documentation

Old/outdated documentation is moved to dated archive directories:

- [archive-2026-01/](archive-2026-01/) - January 2026 archived docs
- [archive/](../archive/) - Pre-refactor project versions

Each archive directory has a README explaining what was archived and why.

---

## Need Help?

1. Check this index first
2. Read [DOCUMENTATION_GUIDE.md](DOCUMENTATION_GUIDE.md)
3. Search existing docs: `grep -r "search term" docs/`
4. Ask the team if still unclear

---

**Remember:** This INDEX.md is the single source of truth for finding documentation.
Keep it updated whenever you add, move, or archive docs.

**Last Updated:** 2026-01-13
**Maintained By:** Development Team Lead
