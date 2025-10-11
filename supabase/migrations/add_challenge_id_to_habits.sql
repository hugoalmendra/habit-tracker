-- Add challenge_id to habits table to link habit cards to challenges
ALTER TABLE habits
ADD COLUMN IF NOT EXISTS challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_habits_challenge_id ON habits(challenge_id);

-- Create a function to auto-create habit card when joining a challenge
CREATE OR REPLACE FUNCTION create_habit_on_challenge_join()
RETURNS TRIGGER AS $$
DECLARE
  challenge_record RECORD;
  habit_count INT;
BEGIN
  -- Only proceed if user accepted/joined the challenge
  IF NEW.status = 'accepted' AND (OLD IS NULL OR OLD.status != 'accepted') THEN
    -- Get challenge details
    SELECT * INTO challenge_record FROM challenges WHERE id = NEW.challenge_id;

    -- Get current habit count for display order
    SELECT COUNT(*) INTO habit_count FROM habits WHERE user_id = NEW.user_id;

    -- Create a habit card for this challenge
    INSERT INTO habits (
      user_id,
      name,
      description,
      category,
      color,
      challenge_id,
      display_order
    ) VALUES (
      NEW.user_id,
      challenge_record.name,
      challenge_record.description,
      challenge_record.category,
      challenge_record.badge_color,
      NEW.challenge_id,
      habit_count
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create habit when accepting challenge
DROP TRIGGER IF EXISTS on_challenge_join_create_habit ON challenge_participants;
CREATE TRIGGER on_challenge_join_create_habit
  AFTER INSERT OR UPDATE ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION create_habit_on_challenge_join();

-- Create a function to auto-delete habit card when challenge is completed
CREATE OR REPLACE FUNCTION delete_habit_on_challenge_complete()
RETURNS TRIGGER AS $$
BEGIN
  -- When challenge participant status changes to 'completed', remove the associated habit
  IF NEW.status = 'completed' AND (OLD IS NULL OR OLD.status != 'completed') THEN
    DELETE FROM habits
    WHERE challenge_id = NEW.challenge_id
    AND user_id = NEW.user_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-delete habit when completing challenge
DROP TRIGGER IF EXISTS on_challenge_complete_delete_habit ON challenge_participants;
CREATE TRIGGER on_challenge_complete_delete_habit
  AFTER UPDATE ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION delete_habit_on_challenge_complete();
