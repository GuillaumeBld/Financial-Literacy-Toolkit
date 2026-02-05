# Quick Reference: Preventing Build Errors

## Before Committing

Always run these checks:

```bash
cd apps/web
npm run check  # Runs type-check + lint
```

## Before Pushing

Verify the build works:

```bash
cd apps/web
npm run build
```

## What Gets Checked Automatically

### Pre-Commit (via Husky)
- ✅ TypeScript type checking
- ✅ ESLint code quality

### Pre-Push (via Husky)
- ✅ Full build test

### CI/CD (via GitHub Actions)
- ✅ TypeScript type checking
- ✅ ESLint
- ✅ Full build

## Common Errors Caught

| Error Type | Caught By | Example |
|------------|-----------|---------|
| Syntax errors | TypeScript | `} else {` without matching `if` |
| Type errors | TypeScript | Wrong variable types |
| Import errors | TypeScript | Missing modules |
| Code style | ESLint | Inconsistent formatting |
| Build failures | Build check | Compilation errors |

## Quick Fixes

### If Pre-Commit Fails
```bash
cd apps/web
npm run type-check  # See TypeScript errors
npm run lint        # See ESLint errors
# Fix errors, then commit again
```

### If Pre-Push Fails
```bash
cd apps/web
npm run build  # See build errors
# Fix errors, then push again
```

### If CI Fails
1. Check GitHub Actions tab
2. See which step failed
3. Fix locally and push again

## Emergency Bypass (Not Recommended)

Only use in emergencies:

```bash
git commit --no-verify  # Skip pre-commit
git push --no-verify    # Skip pre-push
```

**Warning:** This can allow broken code to reach production and break deployments.

