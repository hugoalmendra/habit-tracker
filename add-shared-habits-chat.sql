-- ==========================================
-- SHARED HABITS CHAT (Phase 3)
-- ==========================================

-- Create shared_habit_messages table for chat functionality
create table if not exists shared_habit_messages (
  id uuid default uuid_generate_v4() primary key,
  shared_habit_id uuid references shared_habits on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  message text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on shared_habit_messages
alter table shared_habit_messages enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view messages for shared habits they're part of" on shared_habit_messages;
drop policy if exists "Users can create messages for shared habits they're part of" on shared_habit_messages;
drop policy if exists "Users can update their own messages" on shared_habit_messages;
drop policy if exists "Users can delete their own messages" on shared_habit_messages;

-- Shared habit messages policies
create policy "Users can view messages for shared habits they're part of"
  on shared_habit_messages for select
  using (
    exists (
      select 1 from shared_habits
      where id = shared_habit_id
      and (owner_id = auth.uid() or invited_user_id = auth.uid())
      and status = 'accepted'
    )
  );

create policy "Users can create messages for shared habits they're part of"
  on shared_habit_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from shared_habits
      where id = shared_habit_id
      and (owner_id = auth.uid() or invited_user_id = auth.uid())
      and status = 'accepted'
    )
  );

create policy "Users can update their own messages"
  on shared_habit_messages for update
  using (auth.uid() = user_id);

create policy "Users can delete their own messages"
  on shared_habit_messages for delete
  using (auth.uid() = user_id);

-- Indexes for shared_habit_messages
create index if not exists shared_habit_messages_shared_habit_id_idx on shared_habit_messages(shared_habit_id);
create index if not exists shared_habit_messages_user_id_idx on shared_habit_messages(user_id);
create index if not exists shared_habit_messages_created_at_idx on shared_habit_messages(created_at desc);

-- Trigger for shared_habit_messages table
drop trigger if exists update_shared_habit_messages_updated_at on shared_habit_messages;
create trigger update_shared_habit_messages_updated_at
  before update on shared_habit_messages
  for each row
  execute function update_updated_at_column();

-- Enable Realtime for shared_habit_messages
alter publication supabase_realtime add table shared_habit_messages;

-- Enable Realtime for habit_completions (for real-time completion sync)
alter publication supabase_realtime add table habit_completions;
