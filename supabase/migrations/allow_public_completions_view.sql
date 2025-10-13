-- Allow viewing habit completions for users with public profiles
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can view completions of public profiles" ON habit_completions;

-- Policy: Users can always view their own completions
CREATE POLICY "Users can view their own completions"
ON habit_completions
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can view completions of other users if their profile is public
CREATE POLICY "Users can view completions of public profiles"
ON habit_completions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = habit_completions.user_id
    AND profiles.is_public = true
  )
);
