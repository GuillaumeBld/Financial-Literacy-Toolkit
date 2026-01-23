# Project Control Center

This folder is the single source of truth and control center for the Financial Literacy Toolkit project.

## Purpose

1. **Centralize** all authoritative research documents
2. **Guide** AI agents working on the project
3. **Track** all changes via changelog
4. **Prioritize** work via todo list

## Structure

```
_project/
├── README.md                 ← You are here
├── AGENT_GUIDELINES.md       ← Rules for AI agents
├── CHANGELOG.md              ← History of all changes
├── TODO.md                   ← Current tasks & priorities
│
├── source_of_truth/          ← CANONICAL research documents
│   ├── paper.md              ← Research methodology, questions
│   ├── sdm.md                ← SDM-10 algorithm spec
│   ├── SDM10_Implementation_Guide.md  ← Python implementation
│   └── baseline+40_Questions.csv      ← Question bank
│
└── docs/                     ← Implementation documentation
    ├── ADAPTIVE_TESTING.md
    ├── FORM_DESIGN.md
    ├── SCORING_AND_ANALYTICS.md
    ├── DATA_MODEL.md
    ├── AI_SCORING_RUBRICS.md
    ├── ONBOARDING_IMPLEMENTATION.md
    └── QUESTION_IMPORT_SETUP.md
```

## Quick Start for Agents

1. **Read** `AGENT_GUIDELINES.md` first
2. **Check** `TODO.md` for current priorities
3. **Reference** `source_of_truth/` for requirements
4. **Update** `CHANGELOG.md` after completing work

## Assessment Structure Summary

```
B1-B13 (Baseline)  →  Q1-Q40 (Anchor)  →  SDM 41-50 (Adaptive)
   13 items             40 items            10 items
   Not scored      26 scored/14 not      Diagnostic
```

## Key Files Outside This Folder

| Path | Purpose |
|------|---------|
| `apps/web/` | Next.js frontend application |
| `infra/` | Database schema and migrations |
| `scripts/` | Utility scripts |
| `docs/` | Full documentation (superset of _project/docs/) |
| `docs/deployment/` | Deployment guides |

## Contact

- **Repository**: https://github.com/GuillaumeBld/Financial-Literacy-Toolkit
- **Production**: https://financial-literacy.qualiaai.fr
