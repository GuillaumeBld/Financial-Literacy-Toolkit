-- Basic RLS Policies for Financial Literacy Assessment MVP
-- These policies allow the service role (API) full access and basic authenticated access

-- Allow service role full access to all tables (for API operations)
CREATE POLICY "Service role has full access to users" ON users FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to courses" ON courses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to enrollments" ON enrollments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to instruments" ON instruments FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to items" ON items FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to attempts" ON attempts FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to responses" ON responses FOR ALL USING (auth.role() = 'service_role');
CREATE POLICY "Service role has full access to scores" ON scores FOR ALL USING (auth.role() = 'service_role');

-- Allow authenticated users to read courses and instruments (public info)
CREATE POLICY "Authenticated users can read courses" ON courses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can read instruments" ON instruments FOR SELECT USING (auth.role() = 'authenticated' AND status = 'active');

-- Allow authenticated users to read their own data
CREATE POLICY "Users can read their own user data" ON users FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read their enrollments" ON enrollments FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read their attempts" ON attempts FOR SELECT USING (auth.uid()::text = user_id::text);
CREATE POLICY "Users can read their responses" ON responses FOR SELECT USING (
  auth.uid()::text = (SELECT user_id::text FROM attempts WHERE attempts.attempt_id = responses.attempt_id)
);
CREATE POLICY "Users can read their scores" ON scores FOR SELECT USING (
  auth.uid()::text = (SELECT user_id::text FROM attempts WHERE attempts.attempt_id = scores.attempt_id)
);

-- Allow authenticated users to insert/update their own data
CREATE POLICY "Users can insert their attempts" ON attempts FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);
CREATE POLICY "Users can insert their responses" ON responses FOR INSERT WITH CHECK (
  auth.uid()::text = (SELECT user_id FROM attempts WHERE attempts.attempt_id = responses.attempt_id)
);

-- Allow instructors to read all data in their courses (for analytics)
-- Note: This is simplified - in production you'd check course enrollment with instructor role
CREATE POLICY "Instructors can read all data" ON users FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Instructors can read all attempts" ON attempts FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Instructors can read all responses" ON responses FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Instructors can read all scores" ON scores FOR SELECT USING (auth.role() = 'authenticated');

-- Allow public read access to items (questions) - students need to see questions
CREATE POLICY "Anyone can read active items" ON items FOR SELECT USING (true);
