# Development Guide

## Code Quality Safeguards

This project includes several safeguards to prevent syntax errors and catch issues before they reach production.

### Pre-Commit Hooks

Before each commit, the following checks run automatically:

1. **TypeScript Type Check** - Validates all TypeScript code for type errors
2. **ESLint** - Checks code style and catches common errors

If any check fails, the commit is blocked until issues are resolved.

### Pre-Push Hooks

Before pushing to GitHub, a build check runs to ensure:

1. **Build Success** - The application builds without errors
2. **No Breaking Changes** - All code compiles correctly

### CI/CD Pipeline

GitHub Actions automatically runs on every push and pull request:

1. **Type Check** - `npx tsc --noEmit`
2. **Lint Check** - `npm run lint`
3. **Build Check** - `npm run build`

If any step fails, the workflow fails and prevents merging.

## Running Checks Manually

### Type Check Only
```bash
cd apps/web
npm run type-check
```

### Lint Only
```bash
cd apps/web
npm run lint
```

### Both Checks
```bash
cd apps/web
npm run check
```

### Full Build Test
```bash
cd apps/web
npm run build
```

## Setting Up Hooks (First Time)

If hooks aren't working, install husky:

```bash
npm install
npm run prepare
```

This sets up the git hooks in `.husky/`.

## Best Practices

1. **Always run checks before committing:**
   ```bash
   cd apps/web
   npm run check
   ```

2. **Fix TypeScript errors immediately** - Don't ignore type errors

3. **Run build locally before pushing:**
   ```bash
   npm run build
   ```

4. **Check CI status** - After pushing, verify GitHub Actions passes

## Troubleshooting

### Hooks Not Running

If pre-commit hooks aren't running:

1. Check if husky is installed: `ls -la .husky/`
2. Reinstall: `npm run prepare`
3. Verify git hooks: `ls -la .git/hooks/`

### Bypassing Hooks (Not Recommended)

Only bypass hooks in emergencies:

```bash
git commit --no-verify
git push --no-verify
```

**Warning:** This can allow broken code to reach production.

## IDE Integration

### VS Code

Install these extensions for real-time feedback:

- **ESLint** - Shows lint errors as you type
- **TypeScript and JavaScript Language Features** - Built-in type checking

### Recommended Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "apps/web/node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true
}
```

## Common Issues Prevented

These safeguards catch:

- ✅ Syntax errors (orphaned else, missing brackets)
- ✅ Type errors (wrong types, undefined variables)
- ✅ Import errors (missing modules, wrong paths)
- ✅ Build failures (compilation errors)
- ✅ Lint violations (code style issues)

## Continuous Improvement

If you encounter issues that weren't caught:

1. Document the issue
2. Add a test case or lint rule
3. Update this guide

