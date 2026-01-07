# GitHub Auto-Deploy Workflow

## Overview

This guide explains how to update the website by pushing changes to GitHub. When you make changes via ChatGPT/Codex and push to the repository, Dokploy will automatically detect the changes, rebuild the application, and deploy it to production.

## Workflow Diagram

```
ChatGPT/Codex → Edit Code → Push to GitHub → Dokploy Webhook → Auto-Deploy → Live Website
```

## Setup Instructions

### Step 1: Configure Dokploy with GitHub

1. **Access Dokploy Dashboard**
   - Navigate to your Dokploy instance (typically at `https://portainer.qualiaai.fr` or your Dokploy URL)
   - Log in with your credentials

2. **Create New Application**
   - Click "New Application" or "Create Project"
   - Name: `financial-literacy-assessment`
   - Select "Git Repository" as source

3. **Connect GitHub Repository**
   - Repository URL: `https://github.com/GuillaumeBld/Financial-Literacy-Toolkit`
   - Branch: `main`
   - Authentication: Connect your GitHub account or use a Personal Access Token

4. **Configure Build Settings**
   - Build Context: `.` (root of repository)
   - Dockerfile Path: `apps/web/Dockerfile`
   - Build Command: (handled by Dockerfile)
   - Working Directory: `apps/web`

5. **Enable Auto-Deploy**
   - ✅ Enable "Auto-deploy on push"
   - ✅ Enable "Webhook notifications"
   - Copy the webhook URL provided by Dokploy

6. **Configure GitHub Webhook** (if not automatic)
   - Go to GitHub: `https://github.com/GuillaumeBld/Financial-Literacy-Toolkit/settings/hooks`
   - Click "Add webhook"
   - Payload URL: Paste the webhook URL from Dokploy
   - Content type: `application/json`
   - Events: Select "Just the push event"
   - Active: ✅ Enabled
   - Click "Add webhook"

### Step 2: Configure Environment Variables in Dokploy

In Dokploy, set these environment variables:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://finlit_user:your_password@postgres:5432/financial_literacy
POSTGRES_USER=finlit_user
POSTGRES_PASSWORD=your_secure_password
POSTGRES_DB=financial_literacy
PORT=3000
```

### Step 3: Configure Domain

- Domain: `financial-literacy.qualiaai.fr`
- SSL: Enable automatic Let's Encrypt certificate
- Traefik will handle routing automatically

## How to Update the Website

### Method 1: Using ChatGPT/Codex (Recommended)

1. **Tell ChatGPT what you want to change**
   ```
   "Update the homepage to add a new feature section"
   "Fix the assessment submission bug"
   "Add a new API endpoint for instructor analytics"
   ```

2. **ChatGPT will make the changes**
   - ChatGPT edits the files in your workspace
   - You review the changes

3. **Commit and push to GitHub**
   ```bash
   git add .
   git commit -m "Description of changes"
   git push origin main
   ```

4. **Dokploy automatically deploys**
   - Dokploy detects the push via webhook
   - Builds the new Docker image
   - Deploys to production
   - Website updates automatically (usually 2-5 minutes)

### Method 2: Direct GitHub Push

1. **Make changes locally or via GitHub web interface**
2. **Commit and push**
   ```bash
   git add .
   git commit -m "Your commit message"
   git push origin main
   ```
3. **Dokploy auto-deploys** (same as above)

## Deployment Process

When you push to GitHub, Dokploy will:

1. **Detect the push** via webhook
2. **Pull latest code** from GitHub
3. **Build Docker image** using `apps/web/Dockerfile`
4. **Run build process**:
   - Install dependencies (`npm ci`)
   - Build Next.js app (`npm run build`)
5. **Deploy new container**:
   - Stop old container
   - Start new container
   - Health check verification
6. **Update website** - Changes go live automatically

## Monitoring Deployments

### Check Deployment Status in Dokploy

1. Go to Dokploy dashboard
2. Select your application
3. View "Deployments" tab
4. See build logs and deployment status

### Check Application Logs

```bash
# Via Dokploy UI
# Or via SSH to VPS
docker logs financial-literacy-assessment
```

### Verify Deployment

1. **Check website**: `https://financial-literacy.qualiaai.fr`
2. **Test API**: `https://financial-literacy.qualiaai.fr/api/test`
3. **Check build logs** in Dokploy for any errors

## Troubleshooting

### Auto-Deploy Not Working

1. **Check GitHub Webhook**
   - Go to repository settings → Webhooks
   - Verify webhook is active and receiving events
   - Check webhook delivery logs

2. **Check Dokploy Configuration**
   - Verify auto-deploy is enabled
   - Check repository URL is correct
   - Verify branch name is `main`

3. **Check Build Logs**
   - View build logs in Dokploy
   - Look for errors in Docker build
   - Check for missing environment variables

### Build Failures

Common issues:
- **Missing dependencies**: Check `package.json` is updated
- **Build errors**: Check TypeScript/ESLint errors
- **Environment variables**: Ensure all required vars are set
- **Docker issues**: Check Dockerfile syntax

### Deployment Failures

- **Health check failing**: Check application starts correctly
- **Port conflicts**: Verify port 3000 is available
- **Database connection**: Check DATABASE_URL is correct
- **Resource limits**: Check if memory/CPU limits are sufficient

## Best Practices

### Commit Messages

Use clear, descriptive commit messages:
```bash
git commit -m "Add instructor analytics dashboard"
git commit -m "Fix assessment submission validation"
git commit -m "Update homepage with new features"
```

### Testing Before Push

1. **Test locally**:
   ```bash
   cd apps/web
   npm run dev
   ```

2. **Build test**:
   ```bash
   npm run build
   ```

3. **Docker build test**:
   ```bash
   docker build -f apps/web/Dockerfile -t test-build .
   ```

### Branch Strategy (Optional)

For production stability, consider:
- `main` branch: Production (auto-deploys)
- `develop` branch: Development/testing
- Feature branches: For new features

## Quick Reference

### Update Website Workflow

```bash
# 1. Make changes (via ChatGPT or manually)
# 2. Review changes
git status

# 3. Commit changes
git add .
git commit -m "Your description"

# 4. Push to GitHub
git push origin main

# 5. Wait 2-5 minutes for auto-deployment
# 6. Verify at https://financial-literacy.qualiaai.fr
```

### Check Deployment Status

```bash
# Via Dokploy dashboard or:
curl https://financial-literacy.qualiaai.fr/api/test
```

## Summary

✅ **GitHub Repository**: `https://github.com/GuillaumeBld/Financial-Literacy-Toolkit`  
✅ **Auto-Deploy**: Enabled on `main` branch  
✅ **Domain**: `financial-literacy.qualiaai.fr`  
✅ **Deployment Time**: 2-5 minutes after push  
✅ **Workflow**: ChatGPT → GitHub → Dokploy → Live Website

You can now update your website by simply pushing changes to GitHub!



