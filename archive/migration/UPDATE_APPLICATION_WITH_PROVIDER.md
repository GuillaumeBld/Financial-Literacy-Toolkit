# Update Application to Use GitHub Provider

## Current Status

✅ **GitHub Providers Configured**: You have 2 GitHub providers available:
1. `Dokploy-2026-01-07-yn3zk8` (created today)
2. `Dokploy.QualiaAI` (created earlier)

## Next Step: Link Application to Provider

Your application needs to be linked to one of these GitHub providers.

### Option 1: Via Dokploy Dashboard (Recommended)

1. **Go to Application**:
   - Navigate to: **Projects** → **financial-literacy-assessment** → **financial-literacy-web**

2. **Open General Tab**:
   - Click on **"General"** tab

3. **Update Source Configuration**:
   - Find the **"Source"** or **"Git Repository"** section
   - Look for **"Git Provider"** or **"GitHub Provider"** dropdown
   - Select one of your GitHub providers:
     - `Dokploy-2026-01-07-yn3zk8` (recommended - newest)
     - OR `Dokploy.QualiaAI`
   - Verify:
     - **Repository**: `GuillaumeBld/Financial-Literacy-Toolkit`
     - **Branch**: `main`
     - **Build Path**: `/apps/web`
   - Click **"Save"**

4. **Deploy**:
   - Go to **"Deployments"** tab
   - Click **"Deploy"**
   - Should work now! ✅

### Option 2: Via API (If Dashboard Doesn't Work)

I can try to update it via API. Let me know if you want me to try this approach.

## Verification

After updating, check:
- ✅ Application shows GitHub provider selected (not "None")
- ✅ Repository and branch are correct
- ✅ Deployment starts without "Provider not found" error

## Expected Result

Once linked, your deployment should:
1. ✅ Connect to GitHub successfully
2. ✅ Pull the latest code
3. ✅ Build the Docker image
4. ✅ Deploy to production
5. ✅ Website live at: https://financial-literacy.qualiaai.fr

---

**Quick Summary**: Just select one of your GitHub providers in the application's General tab, save, and deploy!

