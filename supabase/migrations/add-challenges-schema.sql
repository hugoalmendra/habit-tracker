-- Create challenges table
create table challenges (
  id uuid primary key default gen_random_uuid(),
  creator_id uuid references auth.users not null,
  name text not null,
  description text,
  category text not null check (category in ('Health', 'Hustle', 'Heart', 'Harmony', 'Happiness')),
  start_date date not null,
  end_date date not null,
  target_type text not null check (target_type in ('daily_completion', 'total_count', 'streak')),
  target_value int not null,
  badge_icon text,
  badge_color text,
  is_public boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Create challenge_participants table
create table challenge_participants (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges on delete cascade not null,
  user_id uuid references auth.users not null,
  status text not null check (status in ('invited', 'accepted', 'declined', 'completed')) default 'invited',
  joined_at timestamptz,
  completed_at timestamptz,
  current_progress int default 0,
  current_streak int default 0,
  badge_earned boolean default false,
  created_at timestamptz default now(),
  unique(challenge_id, user_id)
);

-- Create challenge_completions table (to track daily/individual completions)
create table challenge_completions (
  id uuid primary key default gen_random_uuid(),
  challenge_id uuid references challenges on delete cascade not null,
  user_id uuid references auth.users not null,
  completed_at timestamptz default now(),
  date date default current_date,
  unique(challenge_id, user_id, date)
);

-- Create challenge_badges table
create table challenge_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  challenge_id uuid references challenges on delete cascade not null,
  badge_icon text not null,
  badge_color text not null,
  badge_name text not null,
  earned_at timestamptz default now(),
  unique(user_id, challenge_id)
);

-- Enable RLS
alter table challenges enable row level security;
alter table challenge_participants enable row level security;
alter table challenge_completions enable row level security;
alter table challenge_badges enable row level security;

-- RLS Policies for challenges
create policy "Users can view public challenges" on challenges
  for select using (is_public = true);

create policy "Users can view their own challenges" on challenges
  for select using (creator_id = auth.uid());

create policy "Users can view challenges they're invited to" on challenges
  for select using (
    exists (
      select 1 from challenge_participants
      where challenge_id = challenges.id
      and user_id = auth.uid()
    )
  );

create policy "Users can create challenges" on challenges
  for insert with check (auth.uid() = creator_id);

create policy "Creators can update their challenges" on challenges
  for update using (auth.uid() = creator_id);

create policy "Creators can delete their challenges" on challenges
  for delete using (auth.uid() = creator_id);

-- RLS Policies for challenge_participants
create policy "Users can view challenge participants" on challenge_participants
  for select using (
    user_id = auth.uid() or
    exists (
      select 1 from challenges
      where id = challenge_participants.challenge_id
      and creator_id = auth.uid()
    ) or
    exists (
      select 1 from challenge_participants cp
      where cp.challenge_id = challenge_participants.challenge_id
      and cp.user_id = auth.uid()
    )
  );

create policy "Challenge creators can invite participants" on challenge_participants
  for insert with check (
    exists (
      select 1 from challenges
      where id = challenge_id
      and creator_id = auth.uid()
    )
  );

create policy "Users can update their own participation" on challenge_participants
  for update using (user_id = auth.uid());

-- RLS Policies for challenge_completions
create policy "Users can view challenge completions" on challenge_completions
  for select using (
    user_id = auth.uid() or
    exists (
      select 1 from challenge_participants
      where challenge_id = challenge_completions.challenge_id
      and user_id = auth.uid()
    )
  );

create policy "Users can create their own completions" on challenge_completions
  for insert with check (
    auth.uid() = user_id and
    exists (
      select 1 from challenge_participants
      where challenge_id = challenge_completions.challenge_id
      and user_id = auth.uid()
      and status = 'accepted'
    )
  );

-- RLS Policies for challenge_badges
create policy "Users can view their own badges" on challenge_badges
  for select using (user_id = auth.uid());

create policy "Users can view other participants' badges" on challenge_badges
  for select using (
    exists (
      select 1 from challenge_participants
      where challenge_id = challenge_badges.challenge_id
      and user_id = auth.uid()
    )
  );

create policy "System can create badges" on challenge_badges
  for insert with check (true);

-- Add notification types for challenges
alter table notifications
  drop constraint if exists notifications_type_check;

alter table notifications
  add constraint notifications_type_check
  check (type in ('follow', 'habit_share', 'post_reaction', 'post_comment', 'shared_habit_completion', 'challenge_invite', 'challenge_complete', 'badge_earned'));

-- Create function to update challenge progress
create or replace function update_challenge_progress()
returns trigger as $$
declare
  challenge_record record;
  participant_record record;
  completion_count int;
  streak_count int;
  has_completed boolean;
begin
  -- Get challenge details
  select * into challenge_record from challenges where id = new.challenge_id;

  -- Get participant record
  select * into participant_record from challenge_participants
  where challenge_id = new.challenge_id and user_id = new.user_id;

  -- Calculate progress based on target type
  if challenge_record.target_type = 'daily_completion' then
    -- Count unique days completed
    select count(distinct date) into completion_count
    from challenge_completions
    where challenge_id = new.challenge_id and user_id = new.user_id;

    -- Calculate current streak
    select count(*) into streak_count
    from generate_series(
      current_date - interval '1 day' * (challenge_record.target_value - 1),
      current_date,
      '1 day'::interval
    ) d
    where exists (
      select 1 from challenge_completions
      where challenge_id = new.challenge_id
      and user_id = new.user_id
      and date = d::date
    );

  elsif challenge_record.target_type = 'total_count' then
    -- Count total completions
    select count(*) into completion_count
    from challenge_completions
    where challenge_id = new.challenge_id and user_id = new.user_id;

  elsif challenge_record.target_type = 'streak' then
    -- Calculate streak
    select count(*) into streak_count
    from generate_series(
      current_date - interval '1 day' * (challenge_record.target_value - 1),
      current_date,
      '1 day'::interval
    ) d
    where exists (
      select 1 from challenge_completions
      where challenge_id = new.challenge_id
      and user_id = new.user_id
      and date = d::date
    );
    completion_count := streak_count;
  end if;

  -- Update participant progress
  update challenge_participants
  set
    current_progress = coalesce(completion_count, 0),
    current_streak = coalesce(streak_count, 0)
  where challenge_id = new.challenge_id and user_id = new.user_id;

  -- Check if challenge is completed
  has_completed := coalesce(completion_count, 0) >= challenge_record.target_value;

  if has_completed and participant_record.status != 'completed' then
    -- Mark as completed
    update challenge_participants
    set
      status = 'completed',
      completed_at = now(),
      badge_earned = true
    where challenge_id = new.challenge_id and user_id = new.user_id;

    -- Award badge
    insert into challenge_badges (user_id, challenge_id, badge_icon, badge_color, badge_name)
    values (
      new.user_id,
      new.challenge_id,
      challenge_record.badge_icon,
      challenge_record.badge_color,
      challenge_record.name
    )
    on conflict (user_id, challenge_id) do nothing;

    -- Send notification
    insert into notifications (user_id, type, title, message)
    values (
      new.user_id,
      'badge_earned',
      'Challenge Completed! 🎉',
      'You completed the "' || challenge_record.name || '" challenge and earned a badge!'
    );
  end if;

  return new;
end;
$$ language plpgsql;

-- Create trigger for challenge progress
create trigger on_challenge_completion
  after insert on challenge_completions
  for each row
  execute function update_challenge_progress();

-- Create function to send challenge invites
create or replace function send_challenge_invite()
returns trigger as $$
declare
  challenge_name text;
  inviter_name text;
begin
  if new.status = 'invited' then
    -- Get challenge and inviter details
    select c.name, p.display_name into challenge_name, inviter_name
    from challenges c
    join profiles p on p.id = c.creator_id
    where c.id = new.challenge_id;

    -- Send notification
    insert into notifications (user_id, type, title, message, related_id)
    values (
      new.user_id,
      'challenge_invite',
      'Challenge Invitation',
      inviter_name || ' invited you to join the "' || challenge_name || '" challenge!',
      new.challenge_id
    );
  end if;

  return new;
end;
$$ language plpgsql;

-- Create trigger for challenge invites
create trigger on_challenge_invite
  after insert on challenge_participants
  for each row
  execute function send_challenge_invite();

-- Enable real-time
alter publication supabase_realtime add table challenges;
alter publication supabase_realtime add table challenge_participants;
alter publication supabase_realtime add table challenge_completions;
alter publication supabase_realtime add table challenge_badges;
