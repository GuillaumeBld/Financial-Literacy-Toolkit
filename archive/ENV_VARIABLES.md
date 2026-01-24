# Environment Variables for Financial Literacy Toolkit

## Required Environment Variables

Configure these in Dokploy: **Projects > financial-literacy-assessment > financial-literacy-web > Environment**

### Database Connection

```
DATABASE_URL=postgresql://username:password@host:5432/database_name
```

For Dokploy internal PostgreSQL (finlit-postgres-db), use:
```
DATABASE_URL=postgresql://postgres:your_password@finlit-postgres-db-g6ifwu:5432/financial_literacy
```

**Note**: The hostname `finlit-postgres-db-g6ifwu` should match your PostgreSQL container service name in Dokploy.

### Supabase Configuration (Optional - if using Supabase)

```
SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Application Settings

```
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

## Full Environment Variables Block

Copy and paste this into Dokploy Environment Settings:

```env
# Database
DATABASE_URL=postgresql://postgres:your_password@finlit-postgres-db-g6ifwu:5432/financial_literacy

# Application
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Optional: Supabase (if using external Supabase)
# SUPABASE_URL=https://your-project.supabase.co
# NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## How to Configure in Dokploy

1. Go to: **Projects** > **financial-literacy-assessment** > **financial-literacy-web**
2. Click on **Environment** tab
3. Add each variable in the format `KEY=value`
4. Click **Save**
5. Go to **General** tab and click **Reload** or **Deploy**

## Finding the PostgreSQL Container Hostname

To connect to the internal PostgreSQL database, you need the service name. Check:
1. Go to **Projects** > **financial-literacy-assessment** > **financial-literacy-db**
2. Note the service name (e.g., `finlit-postgres-db-g6ifwu`)
3. Use this as the hostname in `DATABASE_URL`

## Verifying Database Connection

After setting environment variables and redeploying:

1. Check application logs in **Logs** tab
2. Look for database connection success/failure messages
3. Test the API endpoint: `https://financial-literacy.qualiaai.fr/api/test`

