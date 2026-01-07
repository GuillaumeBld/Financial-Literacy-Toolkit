# Quick Fix: GitHub Provider Not Found

## The Problem

Your deployment is failing with:
```
❌ Github Provider not found
```

This means Dokploy needs GitHub authentication to access your repository.

## Solution: Configure GitHub in Dokploy Dashboard

### Quick Steps (2 minutes)

1. **Go to Dokploy Dashboard**
   - https://dokploy.qualiaai.fr
   - Log in

2. **Configure GitHub Provider**
   - Click **Settings** (top menu or sidebar)
   - Find **"Git Providers"** or **"GitHub"** section
   - Click **"Add GitHub Provider"** or **"Connect GitHub"**

3. **Choose Authentication Method**

   **Option A: Personal Access Token (Easiest)**
   - Create token: https://github.com/settings/tokens
   - Click **"Generate new token (classic)"**
   - Name: `Dokploy`
   - Scopes: ✅ `repo` (Full control)
   - Generate and **copy the token**
   - Paste in Dokploy → GitHub Provider → Token field
   - Save

   **Option B: OAuth App**
   - Create OAuth App: https://github.com/settings/developers
   - Callback URL: `https://dokploy.qualiaai.fr/api/github/callback`
   - Copy Client ID and Secret
   - Add to Dokploy

4. **Update Application**
   - Go to: **Projects** → **financial-literacy-assessment** → **financial-literacy-web**
   - Click **"General"** tab
   - Under **"Source"**:
     - Select the **GitHub Provider** you just created
     - Verify Repository: `GuillaumeBld/Financial-Literacy-Toolkit`
     - Verify Branch: `main`
   - Click **"Save"**

5. **Deploy Again**
   - Go to **"Deployments"** tab
   - Click **"Deploy"**
   - Should work now! ✅

## Alternative: Use Custom Git URL

If provider setup is complicated, use custom Git URL:

1. **Create GitHub Token** (same as above)
2. **Update Application**:
   - Application → General → Source
   - Change to **"Custom Git URL"**
   - URL: `https://YOUR_TOKEN@github.com/GuillaumeBld/Financial-Literacy-Toolkit.git`
   - Replace `YOUR_TOKEN` with your actual token
   - Branch: `main`
   - Build Path: `/apps/web`
   - Save

3. **Deploy**

## What You Need

- GitHub Personal Access Token with `repo` scope
- Access to Dokploy Settings
- 2 minutes of time

## After Configuration

Once configured, deployments will work automatically when you push to GitHub!

```bash
git push origin main
# Dokploy auto-deploys ✅
```

---

**See detailed guide**: `migration/GITHUB_PROVIDER_SETUP.md`

