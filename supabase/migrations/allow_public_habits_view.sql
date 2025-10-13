-- Allow viewing habits for users with public profiles
-- Drop existing policies if they exist to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own habits" ON habits;
DROP POLICY IF EXISTS "Users can view habits of public profiles" ON habits;

-- Policy: Users can always view their own habits
CREATE POLICY "Users can view their own habits"
ON habits
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can view habits of other users if their profile is public
CREATE POLICY "Users can view habits of public profiles"
ON habits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = habits.user_id
    AND profiles.is_public = true
  )
);
