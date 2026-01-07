# Quick Push Instructions

## Ready to Push!

I've created a script to make pushing easy. You have **3 commits** ready to push:

1. `f7b1739` - Add root-level Dockerfile for Dokploy deployment
2. `42f4ee8` - Fix Dockerfile for standalone output
3. `da3032e` - Configure Dokploy deployment

## Step 1: Get GitHub Token

1. Go to: https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Name: `VPS-Push-Token`
4. Scopes: ✅ **`repo`** (Full control of private repositories)
5. Click **"Generate token"**
6. **Copy the token** (you won't see it again!)

## Step 2: Push Using the Script

Run this command (replace `YOUR_TOKEN` with your actual token):

```bash
cd /root/Financial-Literacy-Toolkit
./push-to-github.sh YOUR_TOKEN
```

## Alternative: Direct Push Command

If you prefer, you can push directly:

```bash
cd /root/Financial-Literacy-Toolkit
git push https://YOUR_TOKEN@github.com/GuillaumeBld/Financial-Literacy-Toolkit.git main
```

## After Pushing

1. **Verify**: https://github.com/GuillaumeBld/Financial-Literacy-Toolkit
   - You should see `Dockerfile` in the root directory
2. **Wait 10-30 seconds** for GitHub to update
3. **Redeploy in Dokploy**:
   - Go to Deployments tab
   - Click "Deploy"
   - Should work now! ✅

## What Gets Pushed

- ✅ Root `Dockerfile` (for Dokploy)
- ✅ Updated `apps/web/Dockerfile` (fixed paths)
- ✅ All deployment configuration commits

Once pushed, Dokploy will be able to find the Dockerfile and build successfully!

