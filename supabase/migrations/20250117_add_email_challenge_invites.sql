-- Add support for inviting users to challenges by email (even if they haven't signed up)

-- Create table for pending challenge invites
CREATE TABLE IF NOT EXISTS pending_challenge_invites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  invited_email TEXT NOT NULL,
  invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'claimed')),
  invite_token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ DEFAULT (now() + INTERVAL '30 days'),
  accepted_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  UNIQUE(challenge_id, invited_email)
);

-- Create index for faster lookups
CREATE INDEX idx_pending_invites_token ON pending_challenge_invites(invite_token);
CREATE INDEX idx_pending_invites_email ON pending_challenge_invites(invited_email);
CREATE INDEX idx_pending_invites_challenge ON pending_challenge_invites(challenge_id);

-- RLS Policies
ALTER TABLE pending_challenge_invites ENABLE ROW LEVEL SECURITY;

-- Challenge creators can create pending invites
CREATE POLICY "Challenge creators can invite by email"
  ON pending_challenge_invites
  FOR INSERT
  WITH CHECK (
    invited_by_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM challenges
      WHERE id = challenge_id AND creator_id = auth.uid()
    )
  );

-- Challenge participants can invite to public challenges
CREATE POLICY "Participants can invite to public challenges by email"
  ON pending_challenge_invites
  FOR INSERT
  WITH CHECK (
    invited_by_user_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM challenges c
      JOIN challenge_participants cp ON cp.challenge_id = c.id
      WHERE c.id = challenge_id
      AND c.is_public = true
      AND cp.user_id = auth.uid()
      AND cp.status IN ('accepted', 'completed')
    )
  );

-- Users can view invites sent to their email
CREATE POLICY "Users can view their email invites"
  ON pending_challenge_invites
  FOR SELECT
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    OR invited_by_user_id = auth.uid()
  );

-- Users can claim their pending invites
CREATE POLICY "Users can claim their pending invites"
  ON pending_challenge_invites
  FOR UPDATE
  USING (
    invited_email = (SELECT email FROM auth.users WHERE id = auth.uid())
  )
  WITH CHECK (
    accepted_by_user_id = auth.uid()
  );

-- Function to automatically claim pending invites when a user signs up
CREATE OR REPLACE FUNCTION claim_pending_challenge_invites()
RETURNS TRIGGER AS $$
DECLARE
  invite_record RECORD;
BEGIN
  -- Find all pending invites for this user's email
  FOR invite_record IN
    SELECT id, challenge_id
    FROM pending_challenge_invites
    WHERE invited_email = NEW.email
    AND status = 'pending'
    AND expires_at > now()
  LOOP
    -- Add user to challenge_participants
    INSERT INTO challenge_participants (challenge_id, user_id, status, joined_at)
    VALUES (invite_record.challenge_id, NEW.id, 'invited', now())
    ON CONFLICT (challenge_id, user_id) DO NOTHING;

    -- Mark invite as claimed
    UPDATE pending_challenge_invites
    SET status = 'claimed',
        accepted_by_user_id = NEW.id,
        updated_at = now()
    WHERE id = invite_record.id;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-claim invites when user signs up
DROP TRIGGER IF EXISTS on_user_signup_claim_invites ON auth.users;
CREATE TRIGGER on_user_signup_claim_invites
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION claim_pending_challenge_invites();

-- Function to send email notification for challenge invite
CREATE OR REPLACE FUNCTION notify_email_challenge_invite()
RETURNS TRIGGER AS $$
DECLARE
  v_challenge_name TEXT;
  v_inviter_name TEXT;
BEGIN
  -- Get challenge and inviter details
  SELECT c.name INTO v_challenge_name
  FROM challenges c
  WHERE c.id = NEW.challenge_id;

  SELECT COALESCE(p.display_name, p.full_name, p.email) INTO v_inviter_name
  FROM profiles p
  WHERE p.id = NEW.invited_by_user_id;

  -- Note: Email sending will be handled by Edge Function
  -- This is just a placeholder for future email integration

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to send notification on email invite
DROP TRIGGER IF EXISTS on_email_invite_notify ON pending_challenge_invites;
CREATE TRIGGER on_email_invite_notify
  AFTER INSERT ON pending_challenge_invites
  FOR EACH ROW
  EXECUTE FUNCTION notify_email_challenge_invite();
