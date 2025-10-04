-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Create profiles table
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  email text unique not null,
  full_name text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on profiles
alter table profiles enable row level security;

-- Profiles policies
create policy "Users can view their own profile"
  on profiles for select
  using (auth.uid() = id);

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
