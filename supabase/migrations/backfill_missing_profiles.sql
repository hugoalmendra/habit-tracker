-- Backfill missing profiles for existing auth users
-- This ensures all existing users have a profile record

INSERT INTO public.profiles (id, email, full_name, display_name, is_public)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'full_name' as display_name,
  true as is_public
FROM auth.users au
LEFT JOIN profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;
