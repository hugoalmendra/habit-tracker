-- Add trigger to delete habit when user leaves a challenge
-- This ensures that when a user deletes their challenge_participants record (leaves a challenge),
-- the associated habit is automatically removed from their dashboard

CREATE OR REPLACE FUNCTION delete_habit_on_challenge_leave()
RETURNS TRIGGER AS $$
BEGIN
  -- When a challenge participant record is deleted (user leaves), remove the associated habit
  DELETE FROM habits
  WHERE challenge_id = OLD.challenge_id
  AND user_id = OLD.user_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_challenge_leave_delete_habit ON challenge_participants;

-- Create trigger that fires before delete on challenge_participants
CREATE TRIGGER on_challenge_leave_delete_habit
  BEFORE DELETE ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION delete_habit_on_challenge_leave();
