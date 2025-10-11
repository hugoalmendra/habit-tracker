-- Create feed_activities table for auto-generated feed items
create table feed_activities (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references profiles(id) on delete cascade not null,
  activity_type text not null check (activity_type in ('achievement_unlocked', 'habit_created', 'challenge_joined', 'challenge_completed', 'streak_milestone')),
  related_id uuid, -- ID of the related habit, challenge, or achievement
  metadata jsonb default '{}'::jsonb, -- Additional data like achievement name, streak count, etc.
  created_at timestamp with time zone default now() not null
);

-- Add indexes for performance
create index feed_activities_user_id_idx on feed_activities(user_id);
create index feed_activities_created_at_idx on feed_activities(created_at desc);
create index feed_activities_type_idx on feed_activities(activity_type);

-- RLS policies for feed_activities
alter table feed_activities enable row level security;

-- Users can view activities from people they follow or public activities
create policy "Users can view feed activities from followed users"
on feed_activities for select
using (
  -- Own activities
  auth.uid() = user_id
  or
  -- Activities from users I follow (accepted follows)
  exists (
    select 1 from followers
    where follower_id = auth.uid()
    and following_id = feed_activities.user_id
    and status = 'accepted'
  )
);

-- System can insert activities (triggers will handle this)
create policy "System can insert feed activities"
on feed_activities for insert
with check (true);

-- Users can delete their own activities
create policy "Users can delete own feed activities"
on feed_activities for delete
using (auth.uid() = user_id);

-- Function to create activity when a habit is created
create or replace function create_habit_activity()
returns trigger as $$
begin
  -- Only create activity for non-challenge habits
  if new.challenge_id is null then
    insert into feed_activities (user_id, activity_type, related_id, metadata)
    values (
      new.user_id,
      'habit_created',
      new.id,
      jsonb_build_object(
        'habit_name', new.name,
        'habit_category', new.category,
        'habit_emoji', new.emoji
      )
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for habit creation
drop trigger if exists create_habit_activity_trigger on habits;
create trigger create_habit_activity_trigger
after insert on habits
for each row
execute function create_habit_activity();

-- Function to create activity when a user joins a challenge
create or replace function create_challenge_join_activity()
returns trigger as $$
begin
  -- Only create activity when status changes to 'accepted'
  if new.status = 'accepted' and (old is null or old.status != 'accepted') then
    insert into feed_activities (user_id, activity_type, related_id, metadata)
    values (
      new.user_id,
      'challenge_joined',
      new.challenge_id,
      jsonb_build_object(
        'challenge_id', new.challenge_id
      )
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for challenge participation
drop trigger if exists create_challenge_join_activity_trigger on challenge_participants;
create trigger create_challenge_join_activity_trigger
after insert or update on challenge_participants
for each row
execute function create_challenge_join_activity();

-- Function to create activity when a user completes a challenge
create or replace function create_challenge_completion_activity()
returns trigger as $$
begin
  -- Only create activity when status changes to 'completed' and badge is earned
  if new.status = 'completed' and new.badge_earned = true
     and (old is null or old.status != 'completed') then
    insert into feed_activities (user_id, activity_type, related_id, metadata)
    values (
      new.user_id,
      'challenge_completed',
      new.challenge_id,
      jsonb_build_object(
        'challenge_id', new.challenge_id,
        'final_progress', new.current_progress,
        'final_streak', new.current_streak
      )
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for challenge completion
drop trigger if exists create_challenge_completion_activity_trigger on challenge_participants;
create trigger create_challenge_completion_activity_trigger
after update on challenge_participants
for each row
execute function create_challenge_completion_activity();

-- Function to create activity for streak milestones (7, 30, 100, 365 days)
create or replace function create_streak_milestone_activity()
returns trigger as $$
declare
  milestone int;
begin
  -- Check if streak hit a milestone
  if new.current_streak in (7, 30, 100, 365) and
     (old is null or old.current_streak < new.current_streak) then
    milestone := new.current_streak;

    insert into feed_activities (user_id, activity_type, related_id, metadata)
    values (
      new.user_id,
      'streak_milestone',
      new.habit_id,
      jsonb_build_object(
        'streak_count', milestone,
        'habit_id', new.habit_id
      )
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

-- Trigger for streak milestones
drop trigger if exists create_streak_milestone_activity_trigger on habits;
create trigger create_streak_milestone_activity_trigger
after update on habits
for each row
execute function create_streak_milestone_activity();
