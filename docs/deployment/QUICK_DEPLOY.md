# Quick Deploy Guide

## TL;DR - Update Website in 30 Seconds

```bash
cd /root/Financial-Literacy-Toolkit
git add .
git commit -m "Your changes"
git push origin main
```

Wait 2-5 minutes. Done. Website updates at: https://financial-literacy.qualiaai.fr

---

## How It Works

```
VPS (/root/Financial-Literacy-Toolkit)
    ↓ git push
GitHub (main branch)
    ↓ webhook triggers
Dokploy
    ↓ builds & deploys
Production (https://financial-literacy.qualiaai.fr)
```

**Dokploy handles everything automatically** once you push to GitHub.

---

## Step-by-Step

### 1. Make Your Changes

On the VPS, edit files directly or use Claude Code:
```bash
cd /root/Financial-Literacy-Toolkit
# Make changes to code, docs, etc.
```

### 2. Review Changes

```bash
git status              # See what files changed
git diff                # See actual changes
git diff --staged       # See staged changes
```

### 3. Commit Changes

```bash
git add .               # Stage all changes
# OR
git add <specific-files>  # Stage specific files

git commit -m "Brief description of changes"
```

### 4. Push to GitHub

```bash
git push origin main
```

### 5. Monitor Deployment (Optional)

- **Dokploy Dashboard**: https://dokploy.qualiaai.fr
- Build logs show progress and any errors
- Deployment typically takes 2-5 minutes

### 6. Verify

Visit https://financial-literacy.qualiaai.fr to confirm changes are live.

---

## Common Tasks

### Update Documentation Only
```bash
git add docs/
git commit -m "Update documentation"
git push origin main
```

### Update Source of Truth
```bash
git add source_of_truth/
git commit -m "Update source of truth files"
git push origin main
```

### Update Application Code
```bash
git add apps/web/
git commit -m "Fix: description of fix"
git push origin main
```

### Undo Last Commit (Before Push)
```bash
git reset --soft HEAD~1
```

### View Recent Commits
```bash
git log --oneline -10
```

---

## Troubleshooting

### Push Rejected
```bash
git pull origin main --rebase
git push origin main
```

### Build Fails in Dokploy
1. Check Dokploy dashboard for error logs
2. Fix the issue locally
3. Commit and push again

### Website Not Updating
1. Verify push succeeded: `git log origin/main -1`
2. Check Dokploy deployment status
3. Hard refresh browser (Ctrl+Shift+R)

### Database Changes Required
Run migrations manually after code deploys:
```bash
psql $DATABASE_URL -f infra/migration-file.sql
```

---

## Key Information

| Item | Value |
|------|-------|
| Repository | https://github.com/GuillaumeBld/Financial-Literacy-Toolkit |
| Branch | `main` (auto-deploys) |
| Production URL | https://financial-literacy.qualiaai.fr |
| Dokploy Dashboard | https://dokploy.qualiaai.fr |
| VPS Path | `/root/Financial-Literacy-Toolkit` |

---

## Best Practices

1. **Use descriptive commit messages** - future you will thank you
2. **Test locally first** if making code changes
3. **Commit related changes together** - one logical change per commit
4. **Push frequently** - don't let changes pile up
5. **Monitor the first deployment** after significant changes
