-- Transform challenges to support groups of habits instead of single habit
-- This migration changes challenges from being a single habit to a container for multiple habits

-- Step 1: Create challenge_habits junction table to link challenges with multiple habits
CREATE TABLE IF NOT EXISTS challenge_habits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id uuid REFERENCES challenges(id) ON DELETE CASCADE NOT NULL,
  habit_id uuid REFERENCES habits(id) ON DELETE CASCADE NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE(challenge_id, habit_id)
);

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_challenge_habits_challenge_id ON challenge_habits(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_habits_habit_id ON challenge_habits(habit_id);

-- Enable RLS
ALTER TABLE challenge_habits ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenge_habits
CREATE POLICY "Users can view challenge habits they participate in" ON challenge_habits
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM challenge_participants
      WHERE challenge_id = challenge_habits.challenge_id
      AND user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM challenges
      WHERE id = challenge_habits.challenge_id
      AND (creator_id = auth.uid() OR is_public = true)
    )
  );

CREATE POLICY "Challenge creators can add habits" ON challenge_habits
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE id = challenge_id
      AND creator_id = auth.uid()
    )
  );

CREATE POLICY "Challenge creators can remove habits" ON challenge_habits
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM challenges
      WHERE id = challenge_id
      AND creator_id = auth.uid()
    )
  );

-- Step 2: Migrate existing challenges to new structure
-- For each existing challenge with a linked habit, create a challenge_habits entry
INSERT INTO challenge_habits (challenge_id, habit_id)
SELECT DISTINCT c.id, h.id
FROM challenges c
JOIN habits h ON h.challenge_id = c.id
WHERE NOT EXISTS (
  SELECT 1 FROM challenge_habits ch
  WHERE ch.challenge_id = c.id AND ch.habit_id = h.id
);

-- Step 3: Modify challenges table - remove fields that now belong to individual habits
ALTER TABLE challenges DROP COLUMN IF EXISTS target_type;
ALTER TABLE challenges DROP COLUMN IF EXISTS target_value;

-- Step 4: Modify challenge_participants table - remove progress tracking fields
-- Progress will be calculated from habit_completions instead
ALTER TABLE challenge_participants DROP COLUMN IF EXISTS current_progress;
ALTER TABLE challenge_participants DROP COLUMN IF EXISTS current_streak;

-- Step 5: Drop the challenge_completions table
-- We'll use habit_completions directly now
DROP TABLE IF EXISTS challenge_completions CASCADE;

-- Step 6: Update the challenge progress trigger to work with new structure
-- This function now calculates completion based on ALL habits in the challenge
CREATE OR REPLACE FUNCTION update_challenge_progress_from_habits()
RETURNS TRIGGER AS $$
DECLARE
  challenge_record RECORD;
  participant_record RECORD;
  total_habits INT;
  completed_habits INT;
  has_completed BOOLEAN;
BEGIN
  -- Only process if the completed habit is part of a challenge
  SELECT c.* INTO challenge_record
  FROM challenges c
  JOIN challenge_habits ch ON ch.challenge_id = c.id
  WHERE ch.habit_id = NEW.habit_id
  LIMIT 1;

  IF challenge_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Get participant record
  SELECT * INTO participant_record
  FROM challenge_participants
  WHERE challenge_id = challenge_record.id
  AND user_id = NEW.user_id;

  IF participant_record IS NULL THEN
    RETURN NEW;
  END IF;

  -- Count total habits in the challenge
  SELECT COUNT(*) INTO total_habits
  FROM challenge_habits
  WHERE challenge_id = challenge_record.id;

  -- Count how many of the challenge habits have been completed today by this user
  SELECT COUNT(DISTINCT ch.habit_id) INTO completed_habits
  FROM challenge_habits ch
  JOIN habit_completions hc ON hc.habit_id = ch.habit_id
  WHERE ch.challenge_id = challenge_record.id
  AND hc.user_id = NEW.user_id
  AND hc.completed_date = CURRENT_DATE;

  -- Check if all habits are completed for today
  has_completed := completed_habits >= total_habits;

  -- If all habits completed and not already marked as completed
  IF has_completed AND participant_record.status != 'completed' THEN
    -- Check if the challenge period has ended
    IF CURRENT_DATE >= challenge_record.end_date THEN
      -- Mark participant as completed
      UPDATE challenge_participants
      SET
        status = 'completed',
        completed_at = now(),
        badge_earned = true
      WHERE challenge_id = challenge_record.id
      AND user_id = NEW.user_id;

      -- Award badge
      INSERT INTO challenge_badges (user_id, challenge_id, badge_icon, badge_color, badge_name)
      VALUES (
        NEW.user_id,
        challenge_record.id,
        challenge_record.badge_icon,
        challenge_record.badge_color,
        challenge_record.name
      )
      ON CONFLICT (user_id, challenge_id) DO NOTHING;

      -- Send notification
      INSERT INTO notifications (user_id, type, title, message)
      VALUES (
        NEW.user_id,
        'badge_earned',
        'Challenge Completed! 🎉',
        'You completed the "' || challenge_record.name || '" challenge and earned a badge!'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop old trigger and create new one
DROP TRIGGER IF EXISTS on_challenge_completion ON challenge_completions;
DROP TRIGGER IF EXISTS on_habit_completion_update_challenge ON habit_completions;

CREATE TRIGGER on_habit_completion_update_challenge
  AFTER INSERT ON habit_completions
  FOR EACH ROW
  EXECUTE FUNCTION update_challenge_progress_from_habits();

-- Step 7: Update the function that creates habits when joining a challenge
-- Now it creates copies of ALL habits in the challenge, not just one
CREATE OR REPLACE FUNCTION create_habits_on_challenge_join()
RETURNS TRIGGER AS $$
DECLARE
  challenge_record RECORD;
  habit_record RECORD;
  habit_count INT;
  new_habit_id uuid;
BEGIN
  -- Only proceed if user accepted/joined the challenge
  IF NEW.status = 'accepted' AND (OLD IS NULL OR OLD.status != 'accepted') THEN
    -- Get challenge details
    SELECT * INTO challenge_record FROM challenges WHERE id = NEW.challenge_id;

    -- Get current habit count for display order
    SELECT COUNT(*) INTO habit_count FROM habits WHERE user_id = NEW.user_id;

    -- Create a copy of each habit in the challenge for this user
    FOR habit_record IN
      SELECT h.*
      FROM habits h
      JOIN challenge_habits ch ON ch.habit_id = h.id
      WHERE ch.challenge_id = NEW.challenge_id
      AND h.user_id = challenge_record.creator_id  -- Get the template habits from creator
    LOOP
      -- Insert the new habit for the participant
      INSERT INTO habits (
        user_id,
        name,
        description,
        category,
        color,
        frequency_type,
        frequency_config,
        display_order
      ) VALUES (
        NEW.user_id,
        habit_record.name,
        habit_record.description,
        habit_record.category,
        habit_record.color,
        habit_record.frequency_type,
        habit_record.frequency_config,
        habit_count
      )
      RETURNING id INTO new_habit_id;

      -- Link the new habit to the challenge
      INSERT INTO challenge_habits (challenge_id, habit_id)
      VALUES (NEW.challenge_id, new_habit_id)
      ON CONFLICT (challenge_id, habit_id) DO NOTHING;

      habit_count := habit_count + 1;
    END LOOP;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the old trigger
DROP TRIGGER IF EXISTS on_challenge_join_create_habit ON challenge_participants;
CREATE TRIGGER on_challenge_join_create_habits
  AFTER INSERT OR UPDATE ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION create_habits_on_challenge_join();

-- Step 8: Update the function that deletes habits when leaving a challenge
CREATE OR REPLACE FUNCTION delete_challenge_habits_on_leave()
RETURNS TRIGGER AS $$
BEGIN
  -- When user leaves (status changes to 'declined') or completes, remove associated habits
  IF (NEW.status = 'declined' OR NEW.status = 'completed')
     AND (OLD IS NULL OR OLD.status NOT IN ('declined', 'completed')) THEN

    -- Delete all habits for this user that are part of this challenge
    DELETE FROM habits
    WHERE user_id = NEW.user_id
    AND id IN (
      SELECT habit_id
      FROM challenge_habits
      WHERE challenge_id = NEW.challenge_id
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Replace the old trigger
DROP TRIGGER IF EXISTS on_challenge_complete_delete_habit ON challenge_participants;
DROP TRIGGER IF EXISTS on_challenge_leave_delete_habits ON challenge_participants;

CREATE TRIGGER on_challenge_leave_delete_habits
  AFTER UPDATE ON challenge_participants
  FOR EACH ROW
  EXECUTE FUNCTION delete_challenge_habits_on_leave();

-- Step 9: Enable real-time for new table
ALTER PUBLICATION supabase_realtime ADD TABLE challenge_habits;

-- Step 10: Add helpful comments
COMMENT ON TABLE challenge_habits IS 'Links multiple habits to a challenge, allowing challenges to be groups of habits rather than single habits';
COMMENT ON COLUMN challenge_habits.challenge_id IS 'The challenge this habit belongs to';
COMMENT ON COLUMN challenge_habits.habit_id IS 'The habit that is part of this challenge';
