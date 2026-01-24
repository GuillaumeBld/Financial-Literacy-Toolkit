# Documentation Guidelines - Financial Literacy Toolkit

**Version:** 1.0
**Date:** 2026-01-13
**Status:** Active Standard

---

## Purpose

This guide establishes **one source of truth** for all project documentation. All developers must follow these guidelines to maintain consistency and prevent documentation drift.

---

## Documentation Structure

```
/root/Financial-Literacy-Toolkit/
├── README.md                          # Project overview (ALWAYS CURRENT)
├── docs/
│   ├── DOCUMENTATION_GUIDE.md         # This file
│   ├── INDEX.md                       # Master index of all docs
│   │
│   ├── current/                       # Active production documentation
│   │   ├── INSTRUCTOR_CREDENTIALS.md  # Current login details
│   │   ├── DEPLOYMENT_STATUS.md       # Current deployment state
│   │   └── ACTIVE_ISSUES.md           # Known issues in production
│   │
│   ├── security/                      # Security implementations
│   │   ├── BCRYPT_UPGRADE_2026-01-13.md
│   │   ├── AUTHENTICATION.md
│   │   └── FERPA_COMPLIANCE.md
│   │
│   ├── operations/                    # Ops guides & procedures
│   │   ├── DEPLOYMENT.md
│   │   ├── MONITORING.md
│   │   ├── BACKUP_PROCEDURES.md
│   │   └── TROUBLESHOOTING.md
│   │
│   ├── development/                   # Dev guides & architecture
│   │   ├── SETUP.md
│   │   ├── ARCHITECTURE.md
│   │   ├── API_REFERENCE.md
│   │   ├── DATABASE_SCHEMA.md
│   │   └── CONTRIBUTING.md
│   │
│   └── archive-YYYY-MM/               # Outdated docs by month
│       ├── 2026-01/
│       │   ├── old-deployment-guide.md
│       │   └── superseded-auth.md
│       └── README.md                  # What's archived and why
│
└── archive/                           # Old project versions (pre-refactor)
```

---

## Golden Rules

### 1. **One Source of Truth**
- Each topic has **ONE canonical document**
- No duplicate information across files
- If you need to reference something, **link to it**, don't copy it

### 2. **Always Update, Never Duplicate**
- When implementing a feature, update existing docs
- If you create a new doc, remove or archive the old one
- Mark outdated docs with `⚠️ OUTDATED - See: [new-doc.md]`

### 3. **Date Everything**
- All docs must have a date header
- Use ISO format: `2026-01-13`
- Include "Last Updated" timestamp

### 4. **Status Labels**
Required status at top of every doc:
- `✅ ACTIVE` - Current and accurate
- `⚠️ SUPERSEDED` - Replaced by newer doc (link to it)
- `📦 ARCHIVED` - Historical reference only
- `🚧 DRAFT` - Work in progress, not authoritative

### 5. **Clear Ownership**
Each doc section should specify:
- **Created By:** Who wrote it
- **Last Updated By:** Who last modified it
- **Maintained By:** Who keeps it current (role, not person)

---

## Documentation Types

### Production Documentation (`docs/current/`)
**Purpose:** What operators need to know RIGHT NOW

**Must include:**
- Current credentials (if applicable)
- Current deployment state
- Active configuration
- Known issues

**Update frequency:** Every time something changes in production
**Owner:** Operations team / On-call engineer

**Example files:**
- `INSTRUCTOR_CREDENTIALS.md` - Current login details
- `DEPLOYMENT_STATUS.md` - What's deployed where
- `ACTIVE_ISSUES.md` - Known bugs in production

### Security Documentation (`docs/security/`)
**Purpose:** Security implementations, upgrades, and compliance

**Must include:**
- Date of implementation
- What changed
- Why it changed
- How to verify it's working
- How to maintain it

**Update frequency:** Every security change
**Owner:** Security team / Lead developer

**Naming convention:** `FEATURE_NAME_YYYY-MM-DD.md`

**Example files:**
- `BCRYPT_UPGRADE_2026-01-13.md`
- `FERPA_COMPLIANCE.md`
- `PASSWORD_POLICY.md`

### Operations Documentation (`docs/operations/`)
**Purpose:** How to deploy, monitor, backup, and troubleshoot

**Must include:**
- Step-by-step procedures
- Verification steps
- Rollback procedures
- Common issues and solutions

**Update frequency:** When procedures change
**Owner:** DevOps team

**Example files:**
- `DEPLOYMENT.md` - How to deploy
- `MONITORING.md` - What to monitor and how
- `BACKUP_PROCEDURES.md` - Backup and restore
- `TROUBLESHOOTING.md` - Common problems and fixes

### Development Documentation (`docs/development/`)
**Purpose:** How to build, test, and contribute

**Must include:**
- Setup instructions
- Architecture decisions
- API documentation
- Code conventions
- Testing procedures

**Update frequency:** When code structure changes
**Owner:** Development team

**Example files:**
- `SETUP.md` - Local development setup
- `ARCHITECTURE.md` - System design
- `API_REFERENCE.md` - API endpoints
- `DATABASE_SCHEMA.md` - Database structure
- `CONTRIBUTING.md` - How to contribute code

---

## How to Update Documentation

### Step 1: Before Making Changes
1. Read the existing doc
2. Check if you're updating the right file (one source of truth)
3. Note what will become outdated

### Step 2: Make Your Changes
```bash
# 1. Update the relevant doc
vim docs/category/DOCUMENT.md

# 2. Update the "Last Updated" date
# Add your changes with clear descriptions

# 3. If creating a new doc, add it to INDEX.md
vim docs/INDEX.md
```

### Step 3: Archive Outdated Content
```bash
# If you're replacing a doc entirely:
DATE=$(date +%Y-%m)
mkdir -p docs/archive-$DATE/
mv docs/old-document.md docs/archive-$DATE/

# Add entry to archive README
echo "- old-document.md - Superseded by new-document.md on 2026-01-13" >> docs/archive-$DATE/README.md
```

### Step 4: Update Links
```bash
# Find all references to the old doc
grep -r "old-document.md" docs/

# Update them to point to new doc
# Use sed or manual editing
```

### Step 5: Commit with Clear Message
```bash
git add docs/
git commit -m "docs: Update deployment guide with Docker Compose v2 syntax

- Updated docker-compose commands to v2 format
- Archived old v1 guide to archive-2026-01/
- Added troubleshooting section for common v2 issues
- Updated INDEX.md with new location"
```

---

## When to Create a New Document

### ✅ Create New Doc When:
- Documenting a **new feature** that doesn't fit existing docs
- Writing a **major security upgrade** (use dated filename)
- Creating **incident post-mortems** (always dated)
- Documenting **new procedures** that don't exist yet

### ❌ Don't Create New Doc When:
- Updating existing features (update the existing doc)
- Fixing bugs (update troubleshooting section)
- Changing configuration (update operations doc)
- Refining existing procedures (update in place)

---

## When to Archive Documentation

### Archive Immediately If:
- ✅ Document is completely replaced by newer version
- ✅ Feature/system no longer exists in production
- ✅ Procedure is deprecated and no longer used
- ✅ Information is >6 months old and superseded

### Keep Active If:
- ✅ Still accurate for current production system
- ✅ Referenced by active procedures
- ✅ Required for compliance/audit trail
- ✅ Frequently accessed by team

### Archive Process:
1. Create `docs/archive-YYYY-MM/` directory
2. Move old doc there
3. Add entry to archive README explaining why
4. Update INDEX.md
5. Add redirect note in old doc location (optional)

---

## Documentation Review Schedule

### Daily
- `docs/current/` - Check if anything changed in production

### Weekly
- Review open issues and update `ACTIVE_ISSUES.md`
- Check if any operations docs need updates

### Monthly
- Review all docs in `docs/security/` for accuracy
- Archive any outdated docs from previous months
- Update `INDEX.md` if structure changed

### Quarterly
- Full documentation audit
- Update architecture docs if needed
- Review and cleanup archive directories

---

## Documentation Standards

### File Naming
- Use `SCREAMING_SNAKE_CASE.md` for document names
- Include dates for versioned docs: `FEATURE_NAME_YYYY-MM-DD.md`
- Be descriptive: `BCRYPT_UPGRADE.md` not `AUTH.md`

### File Headers
Every doc must start with:
```markdown
# Document Title

**Status:** ✅ ACTIVE | ⚠️ SUPERSEDED | 📦 ARCHIVED | 🚧 DRAFT
**Created:** YYYY-MM-DD
**Last Updated:** YYYY-MM-DD
**Maintained By:** [Role or team name]

---

[Content starts here]
```

### Content Structure
1. **Purpose/Summary** - What is this doc about?
2. **Quick Start** - How to use this immediately
3. **Detailed Information** - In-depth content
4. **Troubleshooting** - Common issues
5. **References** - Links to related docs

### Links
- Use **relative links**: `[Setup Guide](../development/SETUP.md)`
- Not absolute: `[Setup Guide](/root/Financial-Literacy-Toolkit/docs/development/SETUP.md)`
- Link to specific sections: `[Database Setup](SETUP.md#database-setup)`

### Code Blocks
- Always specify language: ` ```bash` not ` ``` `
- Add comments for clarity
- Include expected output when helpful

### Commands
- Show the command: `docker ps`
- Explain what it does
- Show expected output
- Note any gotchas

---

## Master Index (docs/INDEX.md)

Must always be up to date with:
- All active documentation locations
- Brief description of each doc
- Last updated dates
- Quick links to most important docs

Update `INDEX.md` every time you:
- Create a new doc
- Archive a doc
- Reorganize docs
- Change doc purpose

---

## Enforcement

### Pull Request Requirements
- [ ] New features include documentation updates
- [ ] Updated docs follow this guide's structure
- [ ] Outdated docs are archived
- [ ] INDEX.md is updated if needed
- [ ] No duplicate information created

### Pre-Commit Checklist
- [ ] All docs have status headers
- [ ] Dates are accurate
- [ ] Links are working (use `markdown-link-check`)
- [ ] No broken references to moved files

---

## Quick Reference Card

### I'm implementing a feature:
1. Update existing doc in `docs/development/` or `docs/operations/`
2. Add to CHANGELOG.md
3. Don't create new doc unless feature is entirely new

### I'm fixing a production issue:
1. Update `docs/current/ACTIVE_ISSUES.md`
2. Update relevant troubleshooting section
3. If it's a pattern, add to `docs/operations/TROUBLESHOOTING.md`

### I'm doing a security upgrade:
1. Create dated doc in `docs/security/`
2. Update `docs/current/DEPLOYMENT_STATUS.md`
3. Archive old security docs if superseded
4. Update verification procedures

### I'm deploying to production:
1. Update `docs/current/DEPLOYMENT_STATUS.md`
2. Update credentials if they changed
3. Note any breaking changes
4. Update monitoring if needed

### I'm onboarding a new developer:
1. Send them to `README.md` first
2. Then `docs/INDEX.md` for overview
3. Then `docs/development/SETUP.md` for local setup
4. Then `docs/development/ARCHITECTURE.md` for system understanding

---

## Contact

Questions about documentation standards?
- Check `docs/INDEX.md` first
- This file is the authoritative guide
- Propose changes via pull request
- Discuss in team standup if major restructure needed

---

**Remember: One source of truth. Always update, never duplicate.**

**Last Updated:** 2026-01-13
**Maintained By:** Development Team Lead
