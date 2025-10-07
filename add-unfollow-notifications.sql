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

-- Trigger to create notification on unfollow (drop first if exists)
drop trigger if exists on_unfollow on followers;

create trigger on_unfollow
  after delete on followers
  for each row
  execute function notify_on_unfollow();
