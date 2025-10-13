-- Check all users
SELECT id, email FROM auth.users LIMIT 10;

-- Check all habits in database
SELECT user_id, COUNT(*) as habit_count FROM habits GROUP BY user_id;

-- Check recent habits
SELECT id, user_id, name, created_at FROM habits ORDER BY created_at DESC LIMIT 10;
