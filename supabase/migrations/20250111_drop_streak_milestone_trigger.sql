-- Drop the streak milestone trigger and function
-- This trigger was referencing fields that don't exist in the habits table (current_streak, habit_id)

drop trigger if exists create_streak_milestone_activity_trigger on habits;
drop function if exists create_streak_milestone_activity();
