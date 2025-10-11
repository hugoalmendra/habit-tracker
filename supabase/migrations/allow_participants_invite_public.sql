-- Drop the existing policy that only allows creators to invite
DROP POLICY IF EXISTS "Challenge creators can invite participants" ON challenge_participants;

-- Create new policy that allows:
-- 1. Creators to invite anyone to their challenges (both public and private)
-- 2. Participants to invite others to public challenges
CREATE POLICY "Users can invite to challenges" ON challenge_participants
  FOR INSERT WITH CHECK (
    -- Creator can invite to their challenge
    EXISTS (
      SELECT 1 FROM challenges
      WHERE id = challenge_id
      AND creator_id = auth.uid()
    )
    OR
    -- Participants can invite to public challenges
    EXISTS (
      SELECT 1 FROM challenges c
      JOIN challenge_participants cp ON cp.challenge_id = c.id
      WHERE c.id = challenge_id
      AND c.is_public = true
      AND cp.user_id = auth.uid()
      AND cp.status IN ('accepted', 'completed')
    )
  );

-- Also add a policy to allow users to join public challenges directly
CREATE POLICY "Users can join public challenges" ON challenge_participants
  FOR INSERT WITH CHECK (
    user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM challenges
      WHERE id = challenge_id
      AND is_public = true
    )
  );
