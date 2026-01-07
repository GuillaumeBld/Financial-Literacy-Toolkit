# 🚀 Supabase Web Setup (No CLI Required)

Since CLI installation had issues, let's set up Supabase through their web interface. This is actually faster and simpler!

## 📋 Step-by-Step Setup

### **1. Create Supabase Account**
1. Go to [supabase.com](https://supabase.com)
2. Click "Start your project" (free)
3. Sign up with GitHub/Google
4. Verify your email

### **2. Create New Project**
1. Click "New Project"
2. **Project Name**: `financial-literacy-assessment`
3. **Database Password**: Create a strong password (save this!)
4. **Region**: Choose `East US (North Virginia)` or closest to you
5. Click "Create new project"

### **3. Wait for Setup (~2 minutes)**
- You'll see "Your project is being set up..."
- Wait until you see "Your project is ready!"

### **4. Get Your Credentials**
Once project is ready, go to **Settings → API**:

- **Project URL**: `https://[project-id].supabase.co`
- **Project API Key (anon/public)**: `eyJ...` (starts with `eyJ`)
- **Project Service Role Key**: `eyJ...` (secret, keep safe!)

### **5. Configure Environment**
Create file `apps/web/.env.local` with:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

### **6. Set Up Database Schema**
1. In Supabase Dashboard, go to **SQL Editor**
2. Copy and paste the entire contents of `infra/schema.sql`
3. Click "Run" (this creates all tables)

### **7. Add Sample Data**
1. In the same SQL Editor, copy and paste contents of `infra/seed.sql`
2. Click "Run" (this adds sample questions and course)

### **8. Enable Security**
Go to **Authentication → Policies** and ensure RLS is enabled on all tables.

## 🧪 Test Your Setup

### **Start Your App**
```bash
cd apps/web
npm run dev
```

### **Test Credentials**
- **Course Code**: `Financial Literacy`
- **Student ID**: `123456789` (or any 9 digits)

### **Complete Flow**
1. Go to `http://localhost:3001`
2. Enter course code and student ID
3. Take assessment (3 questions)
4. Submit → should save to Supabase!

## ✅ Success Indicators

- ✅ Assessment completes without errors
- ✅ Can see data in Supabase Dashboard → Table Editor
- ✅ New user created in `users` table
- ✅ Assessment attempt in `attempts` table
- ✅ Responses saved in `responses` table

## 🎯 What's Working

- **FERPA Compliance**: Hashed student IDs only
- **Secure Storage**: Row Level Security enabled
- **Scalable**: PostgreSQL with proper indexing
- **Real-time**: Can monitor submissions live

## 🚀 Next Steps

Once this works, we'll add:
- AI scoring for short answers (Modal)
- Instructor dashboard (analytics)
- Production deployment (Vercel)

---

**Ready to create your Supabase project?** The web interface is actually easier than CLI for initial setup! 🎯</content>
<parameter name="path">/Users/guillaumebld/Documents/Graduate_Research/Professor Abol Jalilvand/fall2025/Financial literacy- abol paper/SUPABASE_WEB_SETUP.md