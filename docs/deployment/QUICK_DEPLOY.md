# Quick Deploy Guide

## Update Website in 3 Steps

### 1. Make Changes
Tell ChatGPT what you want to change, or edit files directly.

### 2. Push to GitHub
```bash
git add .
git commit -m "Your changes"
git push origin main
```

### 3. Wait 2-5 Minutes
Dokploy automatically detects the push, builds, and deploys.

**Done!** Your website is updated at: `https://financial-literacy.qualiaai.fr`

---

## Full Documentation

- **Complete Setup**: See `migration/GITHUB_AUTO_DEPLOY.md`
- **Workflow Details**: See `DEPLOYMENT_WORKFLOW.md`
- **Troubleshooting**: Check Dokploy dashboard logs

---

## Repository

- **GitHub**: `https://github.com/GuillaumeBld/Financial-Literacy-Toolkit`
- **Branch**: `main` (auto-deploys)
- **Domain**: `financial-literacy.qualiaai.fr`



