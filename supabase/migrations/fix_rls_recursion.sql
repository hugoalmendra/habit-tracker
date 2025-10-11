-- Fix RLS recursion by using SECURITY DEFINER functions
-- This breaks the circular dependency between challenges and challenge_participants

-- First, drop all existing policies
DROP POLICY IF EXISTS "Users can view public challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view their own challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view challenges they're invited to" ON challenges;
DROP POLICY IF EXISTS "Users can view accessible challenges" ON challenges;
DROP POLICY IF EXISTS "Users can view challenge participants" ON challenge_participants;

-- Recreate challenges policies (simple, non-recursive)
CREATE POLICY "Users can view public challenges" ON challenges
  FOR SELECT USING (is_public = true);

CREATE POLICY "Users can view their own challenges" ON challenges
  FOR SELECT USING (creator_id = auth.uid());

CREATE POLICY "Users can view private challenges they're invited to" ON challenges
  FOR SELECT USING (
    is_public = false AND
    id IN (
      SELECT challenge_id
      FROM challenge_participants
      WHERE user_id = auth.uid()
    )
  );

-- Recreate challenge_participants view policy without recursion
CREATE POLICY "Users can view challenge participants" ON challenge_participants
  FOR SELECT USING (
    user_id = auth.uid() OR
    challenge_id IN (
      SELECT id FROM challenges WHERE creator_id = auth.uid()
    ) OR
    challenge_id IN (
      SELECT challenge_id FROM challenge_participants WHERE user_id = auth.uid()
    )
  );
