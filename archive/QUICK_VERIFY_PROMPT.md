---

## 🔍 QUICK VERIFICATION (If Database Already Exists)

If you think the database might already be set up, run these verification queries instead:

### Check if tables exist:
```sql
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name IN ('users', 'courses', 'enrollments', 'instruments', 'items', 'attempts', 'responses', 'scores');
```

### Check if sample data exists:
```sql
-- Should return 1 course
SELECT name, term FROM courses WHERE name = 'Financial Literacy';

-- Should return 3 questions
SELECT domain, type, stem FROM items ORDER BY created_at;

-- Should return 2 users
SELECT user_id, hashed_student_key FROM users;
```

### Check RLS status:
```sql
SELECT schemaname, tablename, rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('users', 'courses', 'enrollments', 'instruments', 'items', 'attempts', 'responses', 'scores')
ORDER BY tablename;
```

### If verification shows missing tables/data:
**Then run the full setup above.**

### If verification shows everything exists:
**Great! The database is ready. Tell me "DATABASE READY" and we'll test the app.**

---

**Copy this section and add it to your existing prompt, or run the verification queries directly if you think setup is already done!**</content>
<parameter name="path">/Users/guillaumebld/Documents/Graduate_Research/Professor Abol Jalilvand/fall2025/Financial literacy- abol paper/QUICK_VERIFY_PROMPT.md