# Fix: GitHub Provider Not Found Error

## Problem

Deployment fails with error:
```
❌ Github Provider not found
Error occurred ❌, check the logs for details.
```

## Solution: Configure GitHub Provider in Dokploy

Dokploy needs to be configured with GitHub authentication to access your repository. Follow these steps:

### Step 1: Access Dokploy Settings

1. Go to **https://dokploy.qualiaai.fr**
2. Log in to your Dokploy dashboard
3. Navigate to **Settings** (usually in the top menu or sidebar)
4. Look for **"Git Providers"** or **"GitHub"** section

### Step 2: Add GitHub Provider

You have two options:

#### Option A: OAuth App (Recommended for Private Repos)

1. **Create GitHub OAuth App**:
   - Go to GitHub: https://github.com/settings/developers
   - Click **"New OAuth App"**
   - Fill in:
     - **Application name**: `Dokploy`
     - **Homepage URL**: `https://dokploy.qualiaai.fr`
     - **Authorization callback URL**: `https://dokploy.qualiaai.fr/api/github/callback`
   - Click **"Register application"**
   - **Copy the Client ID and Client Secret**

2. **Add to Dokploy**:
   - In Dokploy Settings → Git Providers
   - Click **"Add GitHub Provider"** or **"Connect GitHub"**
   - Enter:
     - **Client ID**: (from GitHub)
     - **Client Secret**: (from GitHub)
   - Click **"Save"** or **"Connect"**

#### Option B: Personal Access Token (For Public Repos)

1. **Create GitHub Personal Access Token**:
   - Go to GitHub: https://github.com/settings/tokens
   - Click **"Generate new token"** → **"Generate new token (classic)"**
   - Name: `Dokploy Deployment`
   - Select scopes:
     - ✅ `repo` (Full control of private repositories)
     - ✅ `read:org` (if needed)
   - Click **"Generate token"**
   - **Copy the token** (you won't see it again!)

2. **Add to Dokploy**:
   - In Dokploy Settings → Git Providers
   - Add GitHub provider with Personal Access Token
   - Paste the token
   - Click **"Save"**

### Step 3: Update Application Configuration

After adding the GitHub provider:

1. Go to your application: **financial-literacy-web**
2. Navigate to **"General"** tab
3. Under **"Source"** or **"Git Repository"**:
   - Verify **Repository**: `GuillaumeBld/Financial-Literacy-Toolkit`
   - Verify **Branch**: `main`
   - Select the **GitHub Provider** you just created
4. Click **"Save"**

### Step 4: Retry Deployment

1. Go to **"Deployments"** tab
2. Click **"Deploy"** or **"Redeploy"**
3. The deployment should now work!

## Alternative: Use Custom Git URL (If Provider Setup Fails)

If you can't configure the GitHub provider, you can use a custom Git URL with authentication:

1. **Create Personal Access Token** (as above)
2. **Update Application**:
   - Go to application → **General** tab
   - Change **Source Type** to **"Custom Git URL"**
   - **Git URL**: `https://YOUR_TOKEN@github.com/GuillaumeBld/Financial-Literacy-Toolkit.git`
   - Replace `YOUR_TOKEN` with your GitHub Personal Access Token
   - **Branch**: `main`
   - **Build Path**: `/apps/web`
   - Click **"Save"**

3. **Deploy again**

## Quick Fix Summary

**Fastest Solution**:
1. Create GitHub Personal Access Token: https://github.com/settings/tokens
2. In Dokploy → Settings → Git Providers → Add GitHub
3. Use token or OAuth credentials
4. Update application to use the provider
5. Deploy again

## Verification

After configuring, check:
- ✅ GitHub provider appears in Settings → Git Providers
- ✅ Application shows GitHub provider selected
- ✅ Deployment starts without "Provider not found" error

## Troubleshooting

### Still Getting "Provider Not Found"

1. **Check Provider is Selected**:
   - Application → General → Source
   - Ensure GitHub provider is selected (not "None")

2. **Verify Token Permissions**:
   - Token must have `repo` scope
   - For private repos, token is required

3. **Check Repository Access**:
   - Ensure the token/user has access to `GuillaumeBld/Financial-Literacy-Toolkit`
   - For private repos, the account must have access

4. **Try Custom Git URL**:
   - Use the alternative method above with token in URL

## Need Help?

- Check Dokploy logs for more details
- Verify GitHub token is valid: `curl -H "Authorization: token YOUR_TOKEN" https://api.github.com/user`
- Check application deployment logs in Dokploy dashboard

