-- Row Level Security (RLS) Policies Migration
-- Converted from Supabase RLS policies to PostgreSQL native RLS
-- 
-- Note: In direct PostgreSQL, we need to create roles and use them instead of
-- Supabase's auth.role() and auth.uid() functions. For API access, we'll use
-- a service_role that bypasses RLS, and for user access, we'll use application-level
-- authentication checks.

-- Create roles for RLS policies
DO $$
BEGIN
  -- Create service_role if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'service_role') THEN
    CREATE ROLE service_role;
  END IF;
  
  -- Create authenticated role if it doesn't exist
  IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'authenticated') THEN
    CREATE ROLE authenticated;
  END IF;
  
  -- Grant necessary permissions
  GRANT USAGE ON SCHEMA public TO service_role;
  GRANT USAGE ON SCHEMA public TO authenticated;
END
$$;

-- Drop existing policies if they exist (for idempotency)
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
    EXECUTE format('DROP POLICY IF EXISTS "Service role has full access to %I" ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "Authenticated users can read %I" ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "Users can read their own %I" ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "Users can insert their %I" ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "Instructors can read all %I" ON %I', r.tablename, r.tablename);
    EXECUTE format('DROP POLICY IF EXISTS "Anyone can read active %I" ON %I', r.tablename, r.tablename);
  END LOOP;
END
$$;

-- Grant table permissions to roles
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;

-- Service role policies (full access for API operations)
-- In production, the application will connect as service_role for API operations
CREATE POLICY "Service role has full access to users" 
  ON users FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role has full access to courses" 
  ON courses FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role has full access to enrollments" 
  ON enrollments FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role has full access to instruments" 
  ON instruments FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role has full access to items" 
  ON items FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role has full access to attempts" 
  ON attempts FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role has full access to responses" 
  ON responses FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role has full access to scores" 
  ON scores FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Note: For direct PostgreSQL, we'll handle authentication at the application level.
-- The service_role will be used for all API operations, and the application will
-- enforce access control based on hashed student keys and course permissions.
-- 
-- The following policies are kept for reference but may not be used if all
-- operations go through service_role with application-level checks:

-- Allow authenticated users to read courses and instruments (public info)
-- This would require setting the role in the session, which we'll handle in the app
CREATE POLICY "Authenticated users can read courses" 
  ON courses FOR SELECT 
  TO authenticated 
  USING (true);

CREATE POLICY "Authenticated users can read instruments" 
  ON instruments FOR SELECT 
  TO authenticated 
  USING (status = 'active');

-- Allow public read access to items (questions) - students need to see questions
CREATE POLICY "Anyone can read active items" 
  ON items FOR SELECT 
  USING (true);

-- For instructor tables
CREATE POLICY "Service role has full access to instructors" 
  ON instructors FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role has full access to instructor_courses" 
  ON instructor_courses FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

CREATE POLICY "Service role has full access to instructor_sessions" 
  ON instructor_sessions FOR ALL 
  TO service_role 
  USING (true) 
  WITH CHECK (true);

-- Important: In the application code, we'll connect to PostgreSQL using the service_role
-- credentials and handle all access control at the application level. This is because:
-- 1. We use hashed student IDs, not PostgreSQL user accounts
-- 2. Authentication is handled by the application (course code + student ID)
-- 3. RLS policies serve as a defense-in-depth measure but primary access control
--    is in the application layer

-- Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE ON TABLES TO authenticated;



