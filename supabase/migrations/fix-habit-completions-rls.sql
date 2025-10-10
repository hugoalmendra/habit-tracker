-- Enable RLS on habit_completions table
ALTER TABLE habit_completions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can insert their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can update their own completions" ON habit_completions;
DROP POLICY IF EXISTS "Users can delete their own completions" ON habit_completions;

-- Create new policies
-- Allow users to view their own completions
CREATE POLICY "Users can view their own completions"
ON habit_completions FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to insert their own completions
CREATE POLICY "Users can insert their own completions"
ON habit_completions FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own completions
CREATE POLICY "Users can update their own completions"
ON habit_completions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to delete their own completions
CREATE POLICY "Users can delete their own completions"
ON habit_completions FOR DELETE
USING (auth.uid() = user_id);
