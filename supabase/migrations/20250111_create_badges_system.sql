-- Create badges system
-- This will track user achievements and gamification

-- Badge definitions table (stores all possible badges)
create table badge_definitions (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  color text not null,
  category text not null check (category in ('category_mastery', 'perfect_streak', 'time_based', 'social', 'quantity', 'comeback', 'challenge', 'special_occasion')),
  requirement_value integer,
  requirement_type text,
  sort_order integer default 0,
  created_at timestamp with time zone default now()
);

-- User badges table (tracks earned badges)
create table user_badges (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  badge_id text references badge_definitions(id) on delete cascade not null,
  earned_at timestamp with time zone default now(),
  metadata jsonb default '{}'::jsonb,
  unique(user_id, badge_id)
);

-- Badge progress tracking (for badges that require accumulation)
create table badge_progress (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  badge_id text references badge_definitions(id) on delete cascade not null,
  current_value integer default 0,
  metadata jsonb default '{}'::jsonb,
  updated_at timestamp with time zone default now(),
  unique(user_id, badge_id)
);

-- Enable RLS
alter table badge_definitions enable row level security;
alter table user_badges enable row level security;
alter table badge_progress enable row level security;

-- Badge definitions are public (everyone can see all badges)
create policy "Badge definitions are viewable by everyone"
  on badge_definitions for select
  using (true);

-- Users can view their own badges
create policy "Users can view their own badges"
  on user_badges for select
  using (auth.uid() = user_id);

-- Users can view other users' badges (for profile pages)
create policy "Users can view all earned badges"
  on user_badges for select
  using (true);

-- Users can view their own badge progress
create policy "Users can view their own badge progress"
  on badge_progress for select
  using (auth.uid() = user_id);

-- System can insert badges (we'll use service role for this)
create policy "System can insert badges"
  on user_badges for insert
  with check (true);

create policy "System can update badge progress"
  on badge_progress for all
  using (true);

-- Insert badge definitions
insert into badge_definitions (id, name, description, icon, color, category, requirement_value, requirement_type, sort_order) values
-- Category Mastery Badges
('health_hero', 'Health Hero', 'Complete 50 health habits', '💪', '#34C759', 'category_mastery', 50, 'category_health', 1),
('hustle_master', 'Hustle Master', 'Complete 50 hustle habits', '🚀', '#FF9500', 'category_mastery', 50, 'category_hustle', 2),
('heart_champion', 'Heart Champion', 'Complete 50 heart habits', '❤️', '#FF2D55', 'category_mastery', 50, 'category_heart', 3),
('harmony_keeper', 'Harmony Keeper', 'Complete 50 harmony habits', '🧘', '#5E5CE6', 'category_mastery', 50, 'category_harmony', 4),
('happiness_guru', 'Happiness Guru', 'Complete 50 happiness habits', '😊', '#FFD60A', 'category_mastery', 50, 'category_happiness', 5),
('five_pillars_master', 'Five Pillars Master', 'Complete at least 25 habits in ALL 5 categories', '⭐', '#FFD60A', 'category_mastery', 25, 'all_categories', 6),

-- Perfect Week/Month Badges
('perfect_week', 'Perfect Week', 'Complete all habits for 7 consecutive days', '🔥', '#FF6B35', 'perfect_streak', 7, 'all_habits_streak', 10),
('perfect_month', 'Perfect Month', 'Complete all habits for 30 consecutive days', '🏆', '#FFD60A', 'perfect_streak', 30, 'all_habits_streak', 11),
('flawless_february', 'Flawless February', 'Complete all habits in February', '💝', '#FF2D55', 'perfect_streak', null, 'february_perfect', 12),
('weekend_warrior', 'Weekend Warrior', 'Complete all habits on both Saturday and Sunday for 4 weeks', '🎯', '#5E5CE6', 'perfect_streak', 4, 'weekend_streak', 13),

-- Time-based Badges
('early_bird', 'Early Bird', 'Complete habits before 9 AM for 7 days straight', '🌅', '#FF9500', 'time_based', 7, 'before_9am', 20),
('night_owl', 'Night Owl', 'Complete habits after 8 PM for 7 days straight', '🦉', '#5E5CE6', 'time_based', 7, 'after_8pm', 21),
('golden_hour', 'Golden Hour', 'Complete a habit within 1 hour of creating it for 5 days', '⚡', '#FFD60A', 'time_based', 5, 'within_hour', 22),

-- Social Engagement Badges
('social_butterfly', 'Social Butterfly', 'Follow 10 users', '🦋', '#FF2D55', 'social', 10, 'follow_users', 30),
('inspiration_station', 'Inspiration Station', 'Post 10 updates to the feed', '✨', '#FFD60A', 'social', 10, 'feed_posts', 31),
('community_champion', 'Community Champion', 'Join 5 challenges', '🤝', '#34C759', 'social', 5, 'join_challenges', 32),
('supporter', 'Supporter', 'React to 50 other users posts', '👏', '#FF9500', 'social', 50, 'react_posts', 33),
('mentor', 'Mentor', 'Invite 5 friends to challenges', '🎓', '#5E5CE6', 'social', 5, 'invite_friends', 34),

-- Quantity & Consistency Badges
('habit_collector', 'Habit Collector', 'Create 10 different habits', '📚', '#5E5CE6', 'quantity', 10, 'create_habits', 40),
('dedicated', 'Dedicated', 'Complete 50 total habits', '💎', '#34C759', 'quantity', 50, 'total_completions', 41),
('committed', 'Committed', 'Complete 100 total habits', '🔷', '#5E5CE6', 'quantity', 100, 'total_completions', 42),
('unstoppable', 'Unstoppable', 'Complete 500 total habits', '🌟', '#FF9500', 'quantity', 500, 'total_completions', 43),
('legend_status', 'Legend Status', 'Complete 1000 total habits', '👑', '#FFD60A', 'quantity', 1000, 'total_completions', 44),

-- Comeback Badges
('phoenix_rising', 'Phoenix Rising', 'Return after a 7+ day break and complete 5 days straight', '🔥', '#FF6B35', 'comeback', 5, 'return_streak', 50),
('never_too_late', 'Never Too Late', 'Start a new habit after 30+ days of inactivity', '🌱', '#34C759', 'comeback', 30, 'return_after_break', 51),

-- Challenge-related Badges
('challenger', 'Challenger', 'Join 5 challenges', '⚔️', '#5E5CE6', 'challenge', 5, 'join_challenges', 60),
('champion', 'Champion', 'Win 3 challenges', '🏅', '#FFD60A', 'challenge', 3, 'win_challenges', 61),
('challenge_creator', 'Challenge Creator', 'Create your first challenge', '🎨', '#FF9500', 'challenge', 1, 'create_challenge', 62),

-- Special Occasion Badges
('new_year_new_you', 'New Year, New You', 'Complete habits on January 1st', '🎉', '#FFD60A', 'special_occasion', null, 'jan_1', 70),
('birthday_bonus', 'Birthday Bonus', 'Complete habits on your birthday', '🎂', '#FF2D55', 'special_occasion', null, 'birthday', 71),
('seasonal_master', 'Seasonal Master', 'Complete 90 days in a single season', '🍃', '#34C759', 'special_occasion', 90, 'season_streak', 72);

-- Function to check and award badges
create or replace function check_and_award_badge(p_user_id uuid, p_badge_id text, p_metadata jsonb default '{}'::jsonb)
returns boolean as $$
declare
  v_already_earned boolean;
begin
  -- Check if badge already earned
  select exists(
    select 1 from user_badges
    where user_id = p_user_id and badge_id = p_badge_id
  ) into v_already_earned;

  -- If not earned, award it
  if not v_already_earned then
    insert into user_badges (user_id, badge_id, metadata)
    values (p_user_id, p_badge_id, p_metadata);

    -- Create feed activity for badge earned
    insert into feed_activities (user_id, activity_type, related_id, metadata)
    values (
      p_user_id,
      'badge_earned',
      null,
      jsonb_build_object('badge_id', p_badge_id)
    );

    return true;
  end if;

  return false;
end;
$$ language plpgsql security definer;

-- Function to update badge progress
create or replace function update_badge_progress(p_user_id uuid, p_badge_id text, p_value integer, p_metadata jsonb default '{}'::jsonb)
returns void as $$
begin
  insert into badge_progress (user_id, badge_id, current_value, metadata, updated_at)
  values (p_user_id, p_badge_id, p_value, p_metadata, now())
  on conflict (user_id, badge_id)
  do update set
    current_value = p_value,
    metadata = p_metadata,
    updated_at = now();
end;
$$ language plpgsql security definer;

-- Trigger to check for quantity badges after habit completion
create or replace function check_quantity_badges()
returns trigger as $$
declare
  v_total_completions integer;
  v_category_counts jsonb;
  v_health_count integer;
  v_hustle_count integer;
  v_heart_count integer;
  v_harmony_count integer;
  v_happiness_count integer;
begin
  -- Get total completions
  select count(*) into v_total_completions
  from habit_completions
  where user_id = new.user_id;

  -- Update progress and check total completion badges
  perform update_badge_progress(new.user_id, 'dedicated', v_total_completions);
  perform update_badge_progress(new.user_id, 'committed', v_total_completions);
  perform update_badge_progress(new.user_id, 'unstoppable', v_total_completions);
  perform update_badge_progress(new.user_id, 'legend_status', v_total_completions);

  if v_total_completions >= 50 then
    perform check_and_award_badge(new.user_id, 'dedicated');
  end if;
  if v_total_completions >= 100 then
    perform check_and_award_badge(new.user_id, 'committed');
  end if;
  if v_total_completions >= 500 then
    perform check_and_award_badge(new.user_id, 'unstoppable');
  end if;
  if v_total_completions >= 1000 then
    perform check_and_award_badge(new.user_id, 'legend_status');
  end if;

  -- Get category-specific counts
  select
    coalesce(sum(case when h.category = 'Health' then 1 else 0 end), 0) as health,
    coalesce(sum(case when h.category = 'Hustle' then 1 else 0 end), 0) as hustle,
    coalesce(sum(case when h.category = 'Heart' then 1 else 0 end), 0) as heart,
    coalesce(sum(case when h.category = 'Harmony' then 1 else 0 end), 0) as harmony,
    coalesce(sum(case when h.category = 'Happiness' then 1 else 0 end), 0) as happiness
  into v_health_count, v_hustle_count, v_heart_count, v_harmony_count, v_happiness_count
  from habit_completions hc
  join habits h on h.id = hc.habit_id
  where hc.user_id = new.user_id;

  -- Update progress for category badges
  perform update_badge_progress(new.user_id, 'health_hero', v_health_count);
  perform update_badge_progress(new.user_id, 'hustle_master', v_hustle_count);
  perform update_badge_progress(new.user_id, 'heart_champion', v_heart_count);
  perform update_badge_progress(new.user_id, 'harmony_keeper', v_harmony_count);
  perform update_badge_progress(new.user_id, 'happiness_guru', v_happiness_count);

  -- Check category badges
  if v_health_count >= 50 then
    perform check_and_award_badge(new.user_id, 'health_hero');
  end if;
  if v_hustle_count >= 50 then
    perform check_and_award_badge(new.user_id, 'hustle_master');
  end if;
  if v_heart_count >= 50 then
    perform check_and_award_badge(new.user_id, 'heart_champion');
  end if;
  if v_harmony_count >= 50 then
    perform check_and_award_badge(new.user_id, 'harmony_keeper');
  end if;
  if v_happiness_count >= 50 then
    perform check_and_award_badge(new.user_id, 'happiness_guru');
  end if;

  -- Check five pillars master
  if v_health_count >= 25 and v_hustle_count >= 25 and v_heart_count >= 25
     and v_harmony_count >= 25 and v_happiness_count >= 25 then
    perform check_and_award_badge(new.user_id, 'five_pillars_master');
  end if;

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for habit completions
drop trigger if exists check_quantity_badges_trigger on habit_completions;
create trigger check_quantity_badges_trigger
after insert on habit_completions
for each row
execute function check_quantity_badges();

-- Trigger to check for habit creation badges
create or replace function check_creation_badges()
returns trigger as $$
declare
  v_habit_count integer;
begin
  select count(*) into v_habit_count
  from habits
  where user_id = new.user_id;

  perform update_badge_progress(new.user_id, 'habit_collector', v_habit_count);

  if v_habit_count >= 10 then
    perform check_and_award_badge(new.user_id, 'habit_collector');
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists check_creation_badges_trigger on habits;
create trigger check_creation_badges_trigger
after insert on habits
for each row
execute function check_creation_badges();

-- Trigger to check for challenge badges
create or replace function check_challenge_badges()
returns trigger as $$
declare
  v_challenge_count integer;
  v_created_count integer;
begin
  -- Check for joining challenges
  if new.status = 'accepted' then
    select count(*) into v_challenge_count
    from challenge_participants
    where user_id = new.user_id and status in ('accepted', 'completed');

    perform update_badge_progress(new.user_id, 'challenger', v_challenge_count);
    perform update_badge_progress(new.user_id, 'community_champion', v_challenge_count);

    if v_challenge_count >= 5 then
      perform check_and_award_badge(new.user_id, 'challenger');
      perform check_and_award_badge(new.user_id, 'community_champion');
    end if;
  end if;

  -- Check for winning challenges
  if new.badge_earned and not old.badge_earned then
    select count(*) into v_challenge_count
    from challenge_participants
    where user_id = new.user_id and badge_earned = true;

    if v_challenge_count >= 3 then
      perform check_and_award_badge(new.user_id, 'champion');
    end if;
  end if;

  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists check_challenge_badges_trigger on challenge_participants;
create trigger check_challenge_badges_trigger
after insert or update on challenge_participants
for each row
execute function check_challenge_badges();

-- Trigger for challenge creation
create or replace function check_challenge_creation_badge()
returns trigger as $$
begin
  perform check_and_award_badge(new.creator_id, 'challenge_creator');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists check_challenge_creation_badge_trigger on challenges;
create trigger check_challenge_creation_badge_trigger
after insert on challenges
for each row
execute function check_challenge_creation_badge();

-- Create indexes for performance
create index idx_user_badges_user_id on user_badges(user_id);
create index idx_user_badges_badge_id on user_badges(badge_id);
create index idx_badge_progress_user_id on badge_progress(user_id);
create index idx_badge_progress_badge_id on badge_progress(badge_id);
