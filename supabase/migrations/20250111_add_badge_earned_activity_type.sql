-- Add badge_earned to feed_activities allowed types

-- Drop the old constraint
alter table feed_activities drop constraint feed_activities_activity_type_check;

-- Add the new constraint with badge_earned included
alter table feed_activities add constraint feed_activities_activity_type_check
  check (activity_type in ('achievement_unlocked', 'habit_created', 'challenge_joined', 'challenge_completed', 'streak_milestone', 'badge_earned'));
