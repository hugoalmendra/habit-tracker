-- ==========================================
-- FIX RLS POLICIES FOR SHARED HABITS
-- ==========================================

-- Drop existing policy
drop policy if exists "Users can view shared habits" on habits;

-- Add policy to allow viewing habits that are shared with the user
create policy "Users can view shared habits"
  on habits for select
  using (
    exists (
      select 1 from shared_habits
      where shared_habits.habit_id = habits.id
      and shared_habits.invited_user_id = auth.uid()
      and shared_habits.status = 'accepted'
    )
  );

-- Drop existing policy for completions
drop policy if exists "Users can view completions for shared habits" on habit_completions;

-- Add policy to allow viewing completions for shared habits
create policy "Users can view completions for shared habits"
  on habit_completions for select
  using (
    exists (
      select 1 from shared_habits
      where shared_habits.habit_id = habit_completions.habit_id
      and (shared_habits.owner_id = auth.uid() or shared_habits.invited_user_id = auth.uid())
      and shared_habits.status = 'accepted'
    )
  );

-- Add policy to allow creating completions for shared habits
drop policy if exists "Users can create completions for shared habits" on habit_completions;
create policy "Users can create completions for shared habits"
  on habit_completions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from shared_habits
      where shared_habits.habit_id = habit_completions.habit_id
      and (shared_habits.owner_id = auth.uid() or shared_habits.invited_user_id = auth.uid())
      and shared_habits.status = 'accepted'
    )
  );

-- Add policy to allow deleting completions for shared habits
drop policy if exists "Users can delete completions for shared habits" on habit_completions;
create policy "Users can delete completions for shared habits"
  on habit_completions for delete
  using (
    auth.uid() = user_id
    and exists (
      select 1 from shared_habits
      where shared_habits.habit_id = habit_completions.habit_id
      and (shared_habits.owner_id = auth.uid() or shared_habits.invited_user_id = auth.uid())
      and shared_habits.status = 'accepted'
    )
  );
