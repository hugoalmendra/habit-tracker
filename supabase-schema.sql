-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  display_name text,
  photo_url text,
  bio text,
  is_public boolean default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

create policy "Anyone can view public profiles"
  on profiles for select
  using (is_public = true);

create policy "Users can update their own profile"
  on profiles for update
  using (auth.uid() = id);

create policy "Users can insert their own profile"
  on profiles for insert
  with check (auth.uid() = id);

-- Create habits table
create table habits (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text,
  category text not null default 'Health',
  color text default '#3b82f6',
  display_order integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint habits_category_check check (category in ('Health', 'Hustle', 'Heart', 'Harmony', 'Happiness'))
);

-- Enable RLS on habits
alter table habits enable row level security;

-- Habits policies
create policy "Users can view their own habits"
  on habits for select
  using (auth.uid() = user_id);

create policy "Users can create their own habits"
  on habits for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own habits"
  on habits for update
  using (auth.uid() = user_id);

create policy "Users can delete their own habits"
  on habits for delete
  using (auth.uid() = user_id);

-- Create habit_completions table
create table habit_completions (
  id uuid default uuid_generate_v4() primary key,
  habit_id uuid references habits on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  completed_date date not null,
  created_at timestamp with time zone default now(),
  unique(habit_id, completed_date)
);

-- Enable RLS on habit_completions
alter table habit_completions enable row level security;

-- Habit completions policies
create policy "Users can view their own completions"
  on habit_completions for select
  using (auth.uid() = user_id);

create policy "Users can create their own completions"
  on habit_completions for insert
  with check (auth.uid() = user_id);

create policy "Users can delete their own completions"
  on habit_completions for delete
  using (auth.uid() = user_id);

-- Indexes for better query performance
create index habit_completions_user_date_idx on habit_completions(user_id, completed_date);
create index habit_completions_habit_date_idx on habit_completions(habit_id, completed_date);
create index habits_user_id_idx on habits(user_id);

-- Function to automatically update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

-- Trigger for habits table
create trigger update_habits_updated_at
  before update on habits
  for each row
  execute function update_updated_at_column();

-- Trigger for profiles table
create trigger update_profiles_updated_at
  before update on profiles
  for each row
  execute function update_updated_at_column();

-- ==========================================
-- SOCIAL FEATURES SCHEMA
-- ==========================================

-- Create followers table (follow/following relationships)
create table followers (
  id uuid default uuid_generate_v4() primary key,
  follower_id uuid references auth.users on delete cascade not null,
  following_id uuid references auth.users on delete cascade not null,
  status text not null default 'accepted' check (status in ('pending', 'accepted', 'rejected')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  unique(follower_id, following_id),
  constraint no_self_follow check (follower_id != following_id)
);

-- Enable RLS on followers
alter table followers enable row level security;

-- Followers policies
create policy "Users can view their own follow relationships"
  on followers for select
  using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "Users can create follow relationships"
  on followers for insert
  with check (auth.uid() = follower_id);

create policy "Users can update their follow relationships"
  on followers for update
  using (auth.uid() = follower_id or auth.uid() = following_id);

create policy "Users can delete their follow relationships"
  on followers for delete
  using (auth.uid() = follower_id);

-- Indexes for followers
create index followers_follower_idx on followers(follower_id);
create index followers_following_idx on followers(following_id);
create index followers_status_idx on followers(status);

-- Create notifications table
create table notifications (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  type text not null check (type in ('follow', 'recognition', 'shared_habit_invite', 'shared_habit_completion', 'achievement', 'challenge_invite')),
  from_user_id uuid references auth.users on delete cascade,
  content text not null,
  metadata jsonb,
  read boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS on notifications
alter table notifications enable row level security;

-- Notifications policies
create policy "Users can view their own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users can create notifications"
  on notifications for insert
  with check (true);

create policy "Users can update their own notifications"
  on notifications for update
  using (auth.uid() = user_id);

create policy "Users can delete their own notifications"
  on notifications for delete
  using (auth.uid() = user_id);

-- Indexes for notifications
create index notifications_user_id_idx on notifications(user_id);
create index notifications_read_idx on notifications(read);
create index notifications_created_at_idx on notifications(created_at desc);

-- Trigger for followers table
create trigger update_followers_updated_at
  before update on followers
  for each row
  execute function update_updated_at_column();

-- Function to create notification when someone follows you
create or replace function notify_on_follow()
returns trigger as $$
begin
  if new.status = 'accepted' then
    insert into notifications (user_id, type, from_user_id, content, metadata)
    values (
      new.following_id,
      'follow',
      new.follower_id,
      'started following you',
      jsonb_build_object('follower_id', new.follower_id)
    );
  end if;
  return new;
end;
$$ language plpgsql;

-- Trigger to create notification on new follow
create trigger on_new_follow
  after insert on followers
  for each row
  execute function notify_on_follow();

-- Function to create notification when someone unfollows you
create or replace function notify_on_unfollow()
returns trigger as $$
begin
  insert into notifications (user_id, type, from_user_id, content, metadata)
  values (
    old.following_id,
    'follow',
    old.follower_id,
    'unfollowed you',
    jsonb_build_object('follower_id', old.follower_id)
  );
  return old;
end;
$$ language plpgsql;

-- Trigger to create notification on unfollow
create trigger on_unfollow
  after delete on followers
  for each row
  execute function notify_on_unfollow();
