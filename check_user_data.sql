-- Check user profile
SELECT id, display_name, is_public FROM profiles WHERE id = '226bec3d-69e1-4cc7-b027-d6eb6dad964c';

-- Check habits for this user
SELECT id, name, category, user_id, created_at FROM habits WHERE user_id = '226bec3d-69e1-4cc7-b027-d6eb6dad964c' ORDER BY created_at DESC;

-- Check completions count
SELECT COUNT(*) as completion_count FROM habit_completions WHERE user_id = '226bec3d-69e1-4cc7-b027-d6eb6dad964c';
