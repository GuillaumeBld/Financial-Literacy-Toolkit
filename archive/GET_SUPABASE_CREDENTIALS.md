# 🚨 ACTION REQUIRED: Get Your Supabase Credentials

## What Just Happened
The test failed because your `.env.local` file still has placeholder values:
- `NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co` ❌
- `NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here` ❌

## 🔑 What You Need To Do

### **Step 1: Create Supabase Project**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" 
3. Sign up/Login with GitHub or Google
4. Click "New Project"

### **Step 2: Project Details**
- **Name**: `financial-literacy-assessment`
- **Database Password**: Create a secure password (save this!)
- **Region**: Choose `East US (North Virginia)` or your closest region
- Click "Create new project"

### **Step 3: Wait for Setup**
- Project creation takes ~2 minutes
- You'll see "Your project is being set up..."
- Wait until you see "Your project is ready!"

### **Step 4: Get Credentials**
Once ready, go to your project dashboard:
1. Click **Settings** (gear icon) → **API**
2. Copy these 3 values:

**Project URL**: `https://abcdefghijklmnop.supabase.co`
**anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
**service_role key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

### **Step 5: Update .env.local**
Replace the placeholders in `apps/web/.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-actual-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ-your-actual-anon-key-here...
SUPABASE_SERVICE_ROLE_KEY=eyJ-your-actual-service-key-here...
```

### **Step 6: Test Again**
```bash
cd apps/web
node test-supabase.js
```

You should see:
```
✅ Supabase connection successful!
⚠️  Database schema not set up yet. Please run infra/schema.sql in Supabase SQL Editor
```

### **Step 7: Set Up Database**
In Supabase Dashboard → **SQL Editor**:
1. Copy/paste contents of `infra/schema.sql`
2. Click "Run" (creates all tables)
3. Copy/paste contents of `infra/seed.sql`  
4. Click "Run" (adds sample data)

### **Step 8: Final Test**
```bash
cd apps/web
node test-supabase.js
npm run dev
```

**Test the app:**
- Course Code: `Financial Literacy`
- Student ID: `123456789`

---

**Once you have real Supabase credentials, you'll have a fully functional assessment platform!** 🚀

Let me know when you've created the Supabase project! 🎯</content>
<parameter name="path">/Users/guillaumebld/Documents/Graduate_Research/Professor Abol Jalilvand/fall2025/Financial literacy- abol paper/GET_SUPABASE_CREDENTIALS.md