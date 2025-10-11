-- Create function to automatically add challenge creator as accepted participant
CREATE OR REPLACE FUNCTION auto_add_creator_as_participant()
RETURNS TRIGGER AS $$
BEGIN
  -- Add the challenge creator as an accepted participant
  INSERT INTO challenge_participants (
    challenge_id,
    user_id,
    status,
    joined_at
  ) VALUES (
    NEW.id,
    NEW.creator_id,
    'accepted',
    NOW()
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to call this function after inserting a challenge
DROP TRIGGER IF EXISTS on_challenge_created ON challenges;
CREATE TRIGGER on_challenge_created
  AFTER INSERT ON challenges
  FOR EACH ROW
  EXECUTE FUNCTION auto_add_creator_as_participant();
