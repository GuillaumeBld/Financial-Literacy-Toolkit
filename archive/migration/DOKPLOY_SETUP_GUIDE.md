# Dokploy Setup Guide for Financial Literacy Assessment

## Dokploy URL
**Dashboard**: https://dokploy.qualiaai.fr/

## Step-by-Step Project Creation

### Step 1: Create New Project

1. In Dokploy dashboard, click **"Create Project"** button (top right)
2. Fill in project details:
   - **Name**: `financial-literacy-assessment`
   - **Description**: `Financial Literacy Assessment Platform - Next.js Application`

### Step 2: Configure Git Repository

1. **Source Type**: Select "Git Repository"
2. **Repository URL**: `https://github.com/GuillaumeBld/Financial-Literacy-Toolkit`
3. **Branch**: `main`
4. **Authentication**: 
   - If using public repo: No auth needed
   - If private: Connect GitHub account or use Personal Access Token

### Step 3: Configure Build Settings

1. **Build Context**: `.` (root directory)
2. **Dockerfile Path**: `apps/web/Dockerfile`
3. **Working Directory**: Leave empty or set to `apps/web`
4. **Build Command**: (handled by Dockerfile, no need to specify)

### Step 4: Configure Deployment

1. **Port**: `3000`
2. **Auto-deploy**: ✅ Enable "Auto-deploy on push"
3. **Health Check**:
   - Path: `/api/test`
   - Interval: `30s`

### Step 5: Add Environment Variables

Click "Environment Variables" and add:

```bash
NODE_ENV=production
DATABASE_URL=postgresql://finlit_user:YOUR_PASSWORD@postgres:5432/financial_literacy
POSTGRES_USER=finlit_user
POSTGRES_PASSWORD=YOUR_SECURE_PASSWORD
POSTGRES_DB=financial_literacy
PORT=3000
```

**Note**: Replace `YOUR_PASSWORD` and `YOUR_SECURE_PASSWORD` with your actual PostgreSQL password.

### Step 6: Configure Domain

1. **Domain**: `financial-literacy.qualiaai.fr`
2. **SSL**: Enable automatic Let's Encrypt certificate
3. **Traefik**: Should automatically handle routing

### Step 7: Resource Limits (Optional)

- **Memory**: 512M
- **CPU**: 0.5 cores

### Step 8: Deploy

1. Click **"Deploy"** or **"Save and Deploy"**
2. Wait for build to complete (2-5 minutes)
3. Check deployment logs for any errors

## Post-Deployment

### Verify Deployment

1. **Check Application**: https://financial-literacy.qualiaai.fr
2. **Test API**: https://financial-literacy.qualiaai.fr/api/test
3. **Check Logs**: View logs in Dokploy dashboard

### GitHub Webhook (Auto-configured)

Dokploy should automatically set up the GitHub webhook when you connect the repository. If not:

1. Go to project settings in Dokploy
2. Copy the webhook URL
3. Go to GitHub: https://github.com/GuillaumeBld/Financial-Literacy-Toolkit/settings/hooks
4. Add webhook with the URL from Dokploy

## Troubleshooting

### Build Fails

- Check Dockerfile path is correct: `apps/web/Dockerfile`
- Verify build context is root: `.`
- Check build logs for specific errors

### Application Won't Start

- Verify environment variables are set correctly
- Check DATABASE_URL is correct
- Verify PostgreSQL is accessible from the container

### Domain Not Working

- Verify DNS is propagated: `dig financial-literacy.qualiaai.fr`
- Check Traefik configuration
- Verify SSL certificate was issued

## Next Steps After Setup

1. **Test the deployment**: Visit https://financial-literacy.qualiaai.fr
2. **Test auto-deploy**: Make a small change, push to GitHub, verify auto-deployment
3. **Monitor logs**: Check application logs for any issues


