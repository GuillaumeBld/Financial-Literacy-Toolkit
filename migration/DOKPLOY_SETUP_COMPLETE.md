# Dokploy Setup Complete ✅

## Project Configuration

**Project**: `financial-literacy-assessment`  
**Project ID**: `o7CfmeI274QRiWQxdYr_p`  
**Environment**: `production` (ID: `jgQGogzWsw85hXRji2Bxp`)

## Application Configuration

**Application**: `financial-literacy-web`  
**Application ID**: `sIdrzBlAtbsACJ9Lr--Pc`  
**App Name**: `app-compress-digital-panel-bbswn2`

### GitHub Integration
- **Repository**: `GuillaumeBld/Financial-Literacy-Toolkit`
- **Branch**: `main`
- **Build Path**: `/apps/web`
- **Dockerfile**: `apps/web/Dockerfile`
- **Build Context**: `.` (root)
- **Build Type**: `dockerfile`
- **Auto-Deploy**: ✅ Enabled

### Domain Configuration
- **Domain**: `financial-literacy.qualiaai.fr`
- **SSL**: ✅ Let's Encrypt (automatic)
- **Port**: `3000`
- **Path**: `/`

### Environment Variables
```
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy
POSTGRES_USER=finlit_user
POSTGRES_PASSWORD=FinLit2025SecurePassword
POSTGRES_DB=financial_literacy
```

## Database Configuration

**PostgreSQL Database**: `financial-literacy-db`  
**Database ID**: `le-N_bHQFnzfzMw5g3oU6`  
**Service Name**: `finlit-postgres-db-g6ifwu`

### Database Credentials
- **Database Name**: `financial_literacy`
- **Database User**: `finlit_user`
- **Database Password**: `FinLit2025SecurePassword`
- **Docker Image**: `postgres:15`

## Next Steps

### 1. Initialize Database Schema

Once the PostgreSQL container is running, you need to:

1. **Connect to the database** (via Dokploy or SSH)
2. **Run the schema migration**:
   ```bash
   # Copy migration/supabase-to-postgres.sql to the database
   psql postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy < migration/supabase-to-postgres.sql
   ```
3. **Run RLS policies**:
   ```bash
   psql postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy < migration/migrate-rls-policies.sql
   ```

### 2. Migrate Data from Supabase (if needed)

If you have existing data in Supabase:

1. **Export data** from Supabase:
   ```bash
   SUPABASE_URL=your_supabase_url SUPABASE_SERVICE_ROLE_KEY=your_key node migration/data-export.js
   ```

2. **Import data** to PostgreSQL:
   ```bash
   DATABASE_URL=postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy node migration/data-import.js
   ```

### 3. Deploy Application

The application is configured for auto-deploy. To trigger the first deployment:

**Option A: Push to GitHub** (recommended)
```bash
git add .
git commit -m "Initial Dokploy deployment"
git push origin main
```

**Option B: Manual Deploy via Dokploy**
- Go to Dokploy dashboard
- Select the `financial-literacy-assessment` project
- Click on `financial-literacy-web` application
- Click "Deploy" or "Redeploy"

### 4. Verify Deployment

After deployment:

1. **Check application status** in Dokploy dashboard
2. **Test the website**: https://financial-literacy.qualiaai.fr
3. **Test API endpoint**: https://financial-literacy.qualiaai.fr/api/test
4. **Check application logs** in Dokploy

## Troubleshooting

### Database Connection Issues

If the application can't connect to PostgreSQL:

1. **Check PostgreSQL is running**:
   - In Dokploy, verify the PostgreSQL service status
   - Check logs for any errors

2. **Verify service name**:
   - The DATABASE_URL uses the service name: `finlit-postgres-db-g6ifwu`
   - If the service name is different, update the DATABASE_URL

3. **Check network connectivity**:
   - Ensure both services are in the same Docker network
   - Dokploy should handle this automatically

### Build Failures

1. **Check build logs** in Dokploy dashboard
2. **Verify Dockerfile path**: `apps/web/Dockerfile`
3. **Check build context**: Should be root directory `.`
4. **Verify GitHub repository** is accessible

### Domain/SSL Issues

1. **Verify DNS**: `dig financial-literacy.qualiaai.fr`
2. **Check Traefik logs** for SSL certificate issues
3. **Wait for DNS propagation** (can take up to 48 hours)
4. **Verify Let's Encrypt** certificate was issued

## Auto-Deploy Workflow

Now that everything is configured:

1. **Make changes** via ChatGPT/Codex
2. **Commit and push** to GitHub:
   ```bash
   git add .
   git commit -m "Your changes"
   git push origin main
   ```
3. **Dokploy automatically**:
   - Detects the push
   - Builds the Docker image
   - Deploys to production
   - Updates the website (2-5 minutes)

## Summary

✅ **Project Created**: financial-literacy-assessment  
✅ **Application Configured**: financial-literacy-web  
✅ **GitHub Connected**: Auto-deploy enabled  
✅ **Database Created**: PostgreSQL ready  
✅ **Domain Configured**: financial-literacy.qualiaai.fr  
✅ **SSL Enabled**: Let's Encrypt automatic  

**You're all set!** Just push to GitHub and your website will update automatically.

