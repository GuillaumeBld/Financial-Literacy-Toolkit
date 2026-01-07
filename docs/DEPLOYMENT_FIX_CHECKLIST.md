# Deployment Fix Checklist

## Issue: 404 Error and Database Connection

### Step 1: Set DATABASE_URL in Service Environment

**Important:** You need to set `DATABASE_URL` in the **service environment**, not just the project environment.

1. Go to your Dokploy project
2. Navigate to: **Projects > financial-literacy-assessment > production**
3. Click on your **service** (the running application container)
4. Go to **Environment Variables** section
5. Add or update:
   ```
   DATABASE_URL=${{project.DATABASE_URL}}
   ```
   OR directly:
   ```
   DATABASE_URL=postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy
   ```

### Step 2: Verify Project Environment

1. Go to **Project Environment** (the one you already configured)
2. Ensure it contains:
   ```
   DATABASE_URL=postgresql://finlit_user:FinLit2025SecurePassword@finlit-postgres-db-g6ifwu:5432/financial_literacy
   ```
3. Remove any duplicate or incorrect entries

### Step 3: Restart the Service

After setting environment variables:
1. Go to your service
2. Click **Restart** or **Redeploy**
3. Wait for the service to start

### Step 4: Verify Service is Running

1. Check service status in Dokploy dashboard
2. Check service logs for:
   - "Server ready" or similar startup message
   - No database connection errors
   - Application listening on port 3000

### Step 5: Verify Domain Configuration

1. Go to **Domains** section in your service
2. Verify `financial-literacy.qualiaai.fr` is configured
3. Check DNS settings:
   - A record or CNAME pointing to your server
   - Proxy/Reverse proxy configuration in Dokploy

### Step 6: Test the Application

1. **Test root URL:**
   ```
   https://financial-literacy.qualiaai.fr/
   ```
   Should show the home page

2. **Test instructor login:**
   ```
   https://financial-literacy.qualiaai.fr/instructor
   ```
   Should show login page

3. **Test API endpoint:**
   ```bash
   curl https://financial-literacy.qualiaai.fr/api/test
   ```
   Should return success

## Troubleshooting

### Still Getting 404?

1. **Check service logs:**
   - Look for startup errors
   - Check if the service is actually running
   - Verify port 3000 is exposed

2. **Check domain configuration:**
   - Verify DNS is pointing to the correct server
   - Check if reverse proxy (Traefik/Nginx) is configured
   - Ensure domain is added to the service in Dokploy

3. **Check network:**
   - Verify service can reach database container
   - Check if both are on the same Docker network

### Database Connection Still Failing?

1. **Verify DATABASE_URL format:**
   ```bash
   # Test connection string manually
   docker exec <app-container> node -e "console.log(process.env.DATABASE_URL)"
   ```

2. **Check database container:**
   ```bash
   docker ps | grep postgres
   docker exec <db-container> psql -U finlit_user -d financial_literacy -c "SELECT 1;"
   ```

3. **Verify network connectivity:**
   - Both containers should be on `dokploy-network`
   - Service name should be resolvable from app container

## Quick Verification Commands

```bash
# Check if service is running
docker ps | grep financial

# Check service logs
docker logs <service-container-name>

# Test database connection from app container
docker exec <app-container> node -e "
const { Pool } = require('pg');
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.query('SELECT 1').then(() => console.log('DB OK')).catch(e => console.error('DB ERROR:', e.message));
"
```

## Expected Results

After fixing:
- ✅ Service shows as "Running" in Dokploy
- ✅ No database connection errors in logs
- ✅ Homepage loads at `https://financial-literacy.qualiaai.fr/`
- ✅ Instructor login works
- ✅ Course validation works

