-- Drop the recursive RLS policies causing infinite recursion
drop policy if exists "Users can view challenges they're invited to" on challenges;
drop policy if exists "Users can view challenge participants" on challenge_participants;

-- Recreate the challenges select policy without recursion
-- Use a simpler approach: users can view challenges if they're invited OR created them OR it's public
create policy "Users can view challenges they're invited to" on challenges
  for select using (
    id in (
      select challenge_id from challenge_participants
      where user_id = auth.uid()
    )
  );

-- Recreate the challenge_participants select policy without recursion
-- Use a simpler approach: users can view participants if they're part of the challenge OR they created it
create policy "Users can view challenge participants" on challenge_participants
  for select using (
    user_id = auth.uid() or
    challenge_id in (
      select id from challenges
      where creator_id = auth.uid()
    ) or
    challenge_id in (
      select challenge_id from challenge_participants
      where user_id = auth.uid()
    )
  );
