# Push to GitHub - Authentication Setup

## Current Issue

Git push is failing because GitHub authentication is not configured on the VPS.

## Solution Options

### Option 1: Use Personal Access Token (Recommended)

1. **Create GitHub Personal Access Token**:
   - Go to: https://github.com/settings/tokens
   - Click "Generate new token" → "Generate new token (classic)"
   - Name: `VPS-Push-Token`
   - Scopes: ✅ `repo` (Full control of private repositories)
   - Click "Generate token"
   - **Copy the token** (you won't see it again!)

2. **Push with token**:
   ```bash
   cd /root/Financial-Literacy-Toolkit
   git push https://YOUR_TOKEN@github.com/GuillaumeBld/Financial-Literacy-Toolkit.git main
   ```
   Replace `YOUR_TOKEN` with your actual token.

3. **Or configure credential helper**:
   ```bash
   cd /root/Financial-Literacy-Toolkit
   git config credential.helper store
   git push origin main
   # When prompted:
   # Username: YOUR_GITHUB_USERNAME
   # Password: YOUR_TOKEN (not your password!)
   ```

### Option 2: Switch to SSH (If you have SSH keys)

1. **Check if you have SSH keys**:
   ```bash
   ls -la ~/.ssh/id_*.pub
   ```

2. **If you have SSH keys, add to GitHub**:
   - Copy your public key: `cat ~/.ssh/id_*.pub`
   - Add to GitHub: https://github.com/settings/keys
   - Click "New SSH key"
   - Paste your public key
   - Save

3. **Change remote to SSH**:
   ```bash
   cd /root/Financial-Literacy-Toolkit
   git remote set-url origin git@github.com:GuillaumeBld/Financial-Literacy-Toolkit.git
   git push origin main
   ```

### Option 3: Push from Your Local Machine

If you have the repository on your local machine with GitHub access:

```bash
cd /path/to/Financial-Literacy-Toolkit
git pull origin main
git push origin main
```

## Quick Command (Option 1 - Token)

Once you have your token, run:

```bash
cd /root/Financial-Literacy-Toolkit
git push https://YOUR_TOKEN@github.com/GuillaumeBld/Financial-Literacy-Toolkit.git main
```

Replace `YOUR_TOKEN` with your GitHub Personal Access Token.

## After Pushing

1. **Verify in GitHub**: https://github.com/GuillaumeBld/Financial-Literacy-Toolkit
   - You should see `Dockerfile` in the root
2. **Wait 10-30 seconds**
3. **Redeploy in Dokploy** - should work now!

