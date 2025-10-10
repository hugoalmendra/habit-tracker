-- ==========================================
-- SHARED HABITS SCHEMA (Phase 2)
-- ==========================================

-- Create shared_habits table (tracks which habits are shared and with whom)
create table if not exists shared_habits (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references habits on delete cascade not null,
  owner_id uuid references auth.users on delete cascade not null,
  invited_user_id uuid references auth.users on delete cascade not null,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(habit_id, invited_user_id)
);

-- Enable RLS on shared_habits
alter table shared_habits enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view shared habits they own or are invited to" on shared_habits;
drop policy if exists "Users can create shared habits for their own habits" on shared_habits;
drop policy if exists "Users can update shared habits they are invited to" on shared_habits;
drop policy if exists "Users can delete shared habits they own" on shared_habits;

-- Shared habits policies
create policy "Users can view shared habits they own or are invited to"
  on shared_habits for select
  using (auth.uid() = owner_id or auth.uid() = invited_user_id);

create policy "Users can create shared habits for their own habits"
  on shared_habits for insert
  with check (auth.uid() = owner_id);

create policy "Users can update shared habits they are invited to"
  on shared_habits for update
  using (auth.uid() = invited_user_id or auth.uid() = owner_id);

create policy "Users can delete shared habits they own"
  on shared_habits for delete
  using (auth.uid() = owner_id);

-- Indexes for shared_habits
create index if not exists shared_habits_habit_id_idx on shared_habits(habit_id);
create index if not exists shared_habits_owner_id_idx on shared_habits(owner_id);
create index if not exists shared_habits_invited_user_id_idx on shared_habits(invited_user_id);
create index if not exists shared_habits_status_idx on shared_habits(status);

-- Drop existing trigger if it exists
drop trigger if exists update_shared_habits_updated_at on shared_habits;

-- Trigger for shared_habits table
create trigger update_shared_habits_updated_at
  before update on shared_habits
  for each row
  execute function update_updated_at_column();

-- Drop existing functions and triggers
drop trigger if exists on_habit_invite on shared_habits;
drop function if exists notify_on_habit_invite();

-- Function to create notification when someone shares a habit with you
create or replace function notify_on_habit_invite()
returns trigger as $$
begin
  if new.status = 'pending' then
    insert into notifications (user_id, type, from_user_id, content, metadata)
    values (
      new.invited_user_id,
      'shared_habit_invite',
      new.owner_id,
      'invited you to share a habit',
      jsonb_build_object('shared_habit_id', new.id, 'habit_id', new.habit_id)
    );
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to create notification on habit invite
create trigger on_habit_invite
  after insert on shared_habits
  for each row
  execute function notify_on_habit_invite();

-- Drop existing trigger and function for shared habit completions
drop trigger if exists on_shared_habit_completion on habit_completions;
drop function if exists notify_on_shared_habit_completion();

-- Function to create notification when someone completes a shared habit
create or replace function notify_on_shared_habit_completion()
returns trigger as $$
declare
  habit_owner_id uuid;
  shared_users uuid[];
  is_shared_habit boolean;
begin
  -- Check if this habit is shared
  select exists(
    select 1 from shared_habits
    where habit_id = new.habit_id
    and status = 'accepted'
  ) into is_shared_habit;

  -- Only proceed if the habit is actually shared
  if not is_shared_habit then
    return new;
  end if;

  -- Get the habit owner
  select user_id into habit_owner_id
  from habits
  where id = new.habit_id;

  -- Get all users who have accepted sharing this habit
  select array_agg(invited_user_id)
  into shared_users
  from shared_habits
  where habit_id = new.habit_id
    and status = 'accepted'
    and invited_user_id != new.user_id;

  -- Also include the owner if they're not the one who completed it
  if habit_owner_id != new.user_id then
    shared_users := array_append(shared_users, habit_owner_id);
  end if;

  -- Send notification to all shared users
  if shared_users is not null and array_length(shared_users, 1) > 0 then
    insert into notifications (user_id, type, from_user_id, content, metadata)
    select
      unnest(shared_users),
      'shared_habit_completion',
      new.user_id,
      'completed a shared habit',
      jsonb_build_object('habit_id', new.habit_id, 'completion_id', new.id, 'completed_date', new.completed_date);
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to create notification on shared habit completion
create trigger on_shared_habit_completion
  after insert on habit_completions
  for each row
  execute function notify_on_shared_habit_completion();
