-- Update challenge view policies to properly handle private challenges
-- Drop existing view policies
DROP POLICY IF EXISTS "Users can view public challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view their own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view challenges they're invited to" ON challenges;
DROP POLICY IF EXISTS "Users can view accessible challenges" ON challenges;

-- Recreate the original policies without recursion
CREATE POLICY "Users can view public challenges" ON challenges
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own challenges" ON challenges
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can view challenges they're invited to" ON challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_id = challenges.id
      AND user_id = auth.uid()
    )
  );

-- The invite policies are already updated in allow_participants_invite_public.sql
-- This ensures:
-- 1. Only creators can invite to private challenges (is_public = false check)
-- 2. Both creators and participants can invite to public challenges
