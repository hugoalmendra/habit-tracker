-- Complete fix for RLS recursion
-- The key is to avoid challenge_participants policies that reference challenges table

-- Drop ALL existing policies on both tables
DROP POLICY IF EXISTS "Users can view public challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view their own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view challenges they're invited to" ON challenges;
DROP POLICY IF EXISTS "Users can view accessible challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view private challenges they're invited to" ON challenges;
DROP POLICY IF EXISTS "Users can view challenge participants" ON challenge_participants;

-- Simple challenges policies (no recursion)
CREATE POLICY "Users can view public challenges" ON challenges
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own challenges" ON challenges
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can view challenges they participate in" ON challenges
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenge_participants cp
      WHERE cp.challenge_id = challenges.id
      AND cp.user_id = auth.uid()
    )
  );

-- Simple challenge_participants policy (NO reference to challenges table)
CREATE POLICY "Anyone can view participants" ON challenge_participants
  FOR SELECT USING (true);
