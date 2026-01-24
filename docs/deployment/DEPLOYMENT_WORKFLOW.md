# Deployment Workflow: GitHub → Dokploy → Production

## Quick Start

**To update the website**: Simply push changes to GitHub's `main` branch. Dokploy will automatically deploy.

```bash
git add .
git commit -m "Your changes"
git push origin main
```

That's it! The website will update in 2-5 minutes.

## Complete Workflow

### 1. Make Changes (via ChatGPT/Codex or manually)

Tell ChatGPT what you want to change:
- "Add a new feature to the homepage"
- "Fix the bug in assessment submission"
- "Update the instructor dashboard"

ChatGPT will edit the files in your workspace.

### 2. Review Changes

```bash
git status          # See what changed
git diff            # Review the changes
```

### 3. Commit and Push

```bash
git add .
git commit -m "Description of your changes"
git push origin main
```

### 4. Automatic Deployment

Dokploy will:
1. Detect the GitHub push via webhook
2. Pull the latest code
3. Build the Docker image
4. Deploy to production
5. Update the live website

### 5. Verify

Check your website: `https://financial-literacy.qualiaai.fr`

## Configuration

### Dokploy Setup (One-time)

1. **Connect GitHub Repository**
   - Repository: `https://github.com/GuillaumeBld/Financial-Literacy-Toolkit`
   - Branch: `main`
   - Auto-deploy: ✅ Enabled

2. **Configure Environment Variables**
   - `DATABASE_URL`
   - `POSTGRES_USER`
   - `POSTGRES_PASSWORD`
   - `POSTGRES_DB`
   - `NODE_ENV=production`

3. **Set Domain**
   - Domain: `financial-literacy.qualiaai.fr`
   - SSL: Auto (Let's Encrypt)

### GitHub Webhook (Auto-configured by Dokploy)

Dokploy will automatically set up the webhook when you connect the repository.

## Monitoring

### Check Deployment Status

- **Dokploy Dashboard**: View build logs and deployment status
- **GitHub Actions**: See deployment notifications (if enabled)
- **Application Logs**: `docker logs financial-literacy-assessment`

### Verify Deployment

```bash
# Test API endpoint
curl https://financial-literacy.qualiaai.fr/api/test

# Check website
curl -I https://financial-literacy.qualiaai.fr
```

## Troubleshooting

### Deployment Not Triggering

1. Check GitHub webhook is active
2. Verify auto-deploy is enabled in Dokploy
3. Check webhook delivery logs in GitHub

### Build Failures

1. Check build logs in Dokploy
2. Verify all dependencies are in `package.json`
3. Check for TypeScript/ESLint errors

### Application Not Updating

1. Verify deployment completed successfully
2. Check application logs for errors
3. Verify environment variables are set correctly

## Best Practices

1. **Test locally** before pushing
2. **Use descriptive commit messages**
3. **Review changes** before pushing to main
4. **Monitor deployment** logs for errors
5. **Verify deployment** after it completes

## Summary

✅ **Repository**: `https://github.com/GuillaumeBld/Financial-Literacy-Toolkit`  
✅ **Auto-Deploy**: Enabled  
✅ **Domain**: `financial-literacy.qualiaai.fr`  
✅ **Workflow**: Push to GitHub → Auto-deploy → Live website

**You're all set!** Just push to GitHub and your website will update automatically.



