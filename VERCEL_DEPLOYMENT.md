# 🚀 Vercel Deployment Guide

## Method 1: Web Interface (Recommended - Easiest)

### Step 1: Connect GitHub to Vercel
1. Go to [vercel.com](https://vercel.com)
2. Sign up/Login with GitHub
3. Click "Add New..." → "Project"
4. Import your GitHub repository

### Step 2: Configure Project
- **Framework Preset**: Next.js (auto-detected)
- **Root Directory**: `apps/web` (your Next.js app location)
- **Build Command**: `npm run build`
- **Output Directory**: `.next` (default)

### Step 3: Environment Variables
Add these from your `.env.local` (replace the placeholder values with your Supabase project credentials):

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### Step 4: Deploy
- Click "Deploy"
- Wait 2-3 minutes for build
- Get your live URL: `https://your-app.vercel.app`

## Method 2: Vercel CLI (If you prefer command line)

### Install Vercel CLI
```bash
npm install -g vercel
```

### Deploy
```bash
cd apps/web
vercel --prod
```

### Set Environment Variables
```bash
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY
```

## 🧪 Test Your Deployment

After deployment, test:
- **URL**: `https://your-app.vercel.app`
- **Course Code**: `Financial Literacy`
- **Student ID**: `123456789`
- Complete full assessment flow

## ✅ Success Indicators

- ✅ **Build succeeds** without errors
- ✅ **App loads** with Loyola branding
- ✅ **Database connects** (assessments save)
- ✅ **HTTPS enabled** automatically
- ✅ **Global CDN** for fast loading

## 💰 Vercel Pricing (Free Tier Perfect for Academic Use)

- ✅ **100GB bandwidth/month** FREE
- ✅ **100GB hours/month** FREE
- ✅ **Custom domain** FREE
- ✅ **SSL certificates** FREE
- ✅ **Global CDN** FREE

**Total Cost: $0/month** 🎉

---

**Ready to deploy?** Go to [vercel.com](https://vercel.com) and import your GitHub repo! 🚀

(The web interface takes 5 minutes vs CLI which needs more setup)
