-- Update the trigger to call Edge Function for sending invitation emails

CREATE OR REPLACE FUNCTION notify_email_challenge_invite()
RETURNS TRIGGER AS $$
DECLARE
  v_challenge_name TEXT;
  v_challenge_description TEXT;
  v_inviter_name TEXT;
  v_app_url TEXT;
  v_payload JSONB;
BEGIN
  -- Get challenge details
  SELECT c.name, c.description INTO v_challenge_name, v_challenge_description
  FROM challenges c
  WHERE c.id = NEW.challenge_id;

  -- Get inviter details
  SELECT COALESCE(p.display_name, p.full_name, p.email) INTO v_inviter_name
  FROM profiles p
  WHERE p.id = NEW.invited_by_user_id;

  -- Set app URL (you can configure this as needed)
  v_app_url := 'https://your-app-url.vercel.app';

  -- Prepare payload for Edge Function
  v_payload := jsonb_build_object(
    'to', NEW.invited_email,
    'inviterName', v_inviter_name,
    'challengeName', v_challenge_name,
    'challengeDescription', COALESCE(v_challenge_description, ''),
    'inviteToken', NEW.invite_token,
    'appUrl', v_app_url
  );

  -- Call Edge Function via HTTP request
  -- Note: This requires the pg_net extension or http extension
  -- For now, we'll use a simpler approach with a notification
  -- that can be picked up by a background worker

  PERFORM pg_notify(
    'challenge_invite_email',
    v_payload::text
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Note: To actually send emails, you have several options:
-- 1. Use Supabase's built-in email auth triggers
-- 2. Set up a Supabase Edge Function trigger
-- 3. Use a background worker that listens to pg_notify
-- 4. Call the Edge Function directly from the client after creating the invite
