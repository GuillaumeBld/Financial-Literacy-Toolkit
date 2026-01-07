# 🚀 Supabase Setup Guide

## 📋 Prerequisites
- Node.js 18+ installed
- npm or pnpm installed
- Supabase account (free at [supabase.com](https://supabase.com))

## 🛠️ Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in project details:
   - **Name**: `financial-literacy-assessment`
   - **Database Password**: Choose a strong password (save this!)
   - **Region**: Choose closest to your location

4. Wait for project creation (~2 minutes)

## 🔧 Step 2: Get Project Credentials

After project creation, go to Settings → API:

- **Project URL**: `https://[project-id].supabase.co`
- **Project API Key**: `eyJ...` (anon/public key)
- **Project Service Role Key**: `eyJ...` (secret key - keep safe!)

## 📁 Step 3: Install Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login
```

## 🗄️ Step 4: Initialize Local Supabase

```bash
# In your project root
cd "/Users/guillaumebld/Documents/Graduate_Research/Professor Abol Jalilvand/fall2025/Financial literacy- abol paper"

# Initialize Supabase in your project
supabase init

# Link to your remote project
supabase link --project-ref YOUR_PROJECT_ID

# Pull remote schema
supabase db pull
```

## 🛡️ Step 5: Set Up Row Level Security

In Supabase Dashboard → SQL Editor, run:

```sql
-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE instruments ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE scores ENABLE ROW LEVEL SECURITY;
```

## 🔐 Step 6: Environment Variables

Create `.env.local` in your web app:

```bash
# apps/web/.env.local
NEXT_PUBLIC_SUPABASE_URL=https://[project-id].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
DATABASE_URL=postgresql://postgres:[password]@[host]:5432/postgres
```

## 📦 Step 7: Install Dependencies

```bash
# In apps/web/
cd apps/web
npm install @supabase/supabase-js @supabase/auth-helpers-nextjs @supabase/auth-helpers-react @supabase/auth-ui-react @supabase/auth-ui-shared
```

## ✅ Step 8: Test Connection

Create a simple test file to verify connection:

```typescript
// apps/web/lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)
```

## 🎯 Next Steps After Setup

1. **Create database schema** (migrations)
2. **Set up authentication** (hashed student IDs)
3. **Implement API routes** (assessment submission)
4. **Add RLS policies** (data access control)

---

**Ready to start?** Let me know your Supabase project URL and we can proceed with the configuration.</content>
<parameter name="path">/Users/guillaumebld/Documents/Graduate_Research/Professor Abol Jalilvand/fall2025/Financial literacy- abol paper/SUPABASE_SETUP.md