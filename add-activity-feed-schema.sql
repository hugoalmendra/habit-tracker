-- ==========================================
-- ACTIVITY FEED SCHEMA (Phase 4)
-- ==========================================

-- Create posts table
create table if not exists posts (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  privacy text not null default 'public' check (privacy in ('public', 'friends', 'private')),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on posts
alter table posts enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view public posts" on posts;
drop policy if exists "Users can view friends posts" on posts;
drop policy if exists "Users can view their own posts" on posts;
drop policy if exists "Users can create their own posts" on posts;
drop policy if exists "Users can update their own posts" on posts;
drop policy if exists "Users can delete their own posts" on posts;

-- Posts policies
create policy "Users can view public posts"
  on posts for select
  using (privacy = 'public');

create policy "Users can view friends posts"
  on posts for select
  using (
    privacy = 'friends'
    and (
      user_id = auth.uid()
      or exists (
        select 1 from followers
        where followers.follower_id = auth.uid()
        and followers.following_id = posts.user_id
        and followers.status = 'accepted'
      )
    )
  );

create policy "Users can view their own posts"
  on posts for select
  using (auth.uid() = user_id);

create policy "Users can create their own posts"
  on posts for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own posts"
  on posts for update
  using (auth.uid() = user_id);

create policy "Users can delete their own posts"
  on posts for delete
  using (auth.uid() = user_id);

-- Indexes for posts
create index if not exists posts_user_id_idx on posts(user_id);
create index if not exists posts_created_at_idx on posts(created_at desc);
create index if not exists posts_privacy_idx on posts(privacy);

-- Trigger for posts table
drop trigger if exists update_posts_updated_at on posts;
create trigger update_posts_updated_at
  before update on posts
  for each row
  execute function update_updated_at_column();

-- Create post_comments table
create table if not exists post_comments (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on post_comments
alter table post_comments enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view comments on visible posts" on post_comments;
drop policy if exists "Users can create comments on visible posts" on post_comments;
drop policy if exists "Users can update their own comments" on post_comments;
drop policy if exists "Users can delete their own comments" on post_comments;

-- Post comments policies
create policy "Users can view comments on visible posts"
  on post_comments for select
  using (
    exists (
      select 1 from posts
      where posts.id = post_comments.post_id
      and (
        posts.privacy = 'public'
        or posts.user_id = auth.uid()
        or (
          posts.privacy = 'friends'
          and exists (
            select 1 from followers
            where followers.follower_id = auth.uid()
            and followers.following_id = posts.user_id
            and followers.status = 'accepted'
          )
        )
      )
    )
  );

create policy "Users can create comments on visible posts"
  on post_comments for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from posts
      where posts.id = post_comments.post_id
      and (
        posts.privacy = 'public'
        or posts.user_id = auth.uid()
        or (
          posts.privacy = 'friends'
          and exists (
            select 1 from followers
            where followers.follower_id = auth.uid()
            and followers.following_id = posts.user_id
            and followers.status = 'accepted'
          )
        )
      )
    )
  );

create policy "Users can update their own comments"
  on post_comments for update
  using (auth.uid() = user_id);

create policy "Users can delete their own comments"
  on post_comments for delete
  using (auth.uid() = user_id);

-- Indexes for post_comments
create index if not exists post_comments_post_id_idx on post_comments(post_id);
create index if not exists post_comments_user_id_idx on post_comments(user_id);
create index if not exists post_comments_created_at_idx on post_comments(created_at desc);

-- Trigger for post_comments table
drop trigger if exists update_post_comments_updated_at on post_comments;
create trigger update_post_comments_updated_at
  before update on post_comments
  for each row
  execute function update_updated_at_column();

-- Create post_reactions table
create table if not exists post_reactions (
  id uuid default uuid_generate_v4() primary key,
  post_id uuid references posts on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  reaction text not null check (reaction in ('like', 'celebrate', 'support', 'love', 'fire')),
  created_at timestamp with time zone default now(),
  unique(post_id, user_id)
);

-- Enable RLS on post_reactions
alter table post_reactions enable row level security;

-- Drop existing policies if they exist
drop policy if exists "Users can view reactions on visible posts" on post_reactions;
drop policy if exists "Users can create reactions on visible posts" on post_reactions;
drop policy if exists "Users can delete their own reactions" on post_reactions;

-- Post reactions policies
create policy "Users can view reactions on visible posts"
  on post_reactions for select
  using (
    exists (
      select 1 from posts
      where posts.id = post_reactions.post_id
      and (
        posts.privacy = 'public'
        or posts.user_id = auth.uid()
        or (
          posts.privacy = 'friends'
          and exists (
            select 1 from followers
            where followers.follower_id = auth.uid()
            and followers.following_id = posts.user_id
            and followers.status = 'accepted'
          )
        )
      )
    )
  );

create policy "Users can create reactions on visible posts"
  on post_reactions for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from posts
      where posts.id = post_reactions.post_id
      and (
        posts.privacy = 'public'
        or posts.user_id = auth.uid()
        or (
          posts.privacy = 'friends'
          and exists (
            select 1 from followers
            where followers.follower_id = auth.uid()
            and followers.following_id = posts.user_id
            and followers.status = 'accepted'
          )
        )
      )
    )
  );

create policy "Users can delete their own reactions"
  on post_reactions for delete
  using (auth.uid() = user_id);

-- Indexes for post_reactions
create index if not exists post_reactions_post_id_idx on post_reactions(post_id);
create index if not exists post_reactions_user_id_idx on post_reactions(user_id);

-- Enable Realtime for activity feed tables
alter publication supabase_realtime add table posts;
alter publication supabase_realtime add table post_comments;
alter publication supabase_realtime add table post_reactions;

-- Drop existing function and trigger for post notifications
drop trigger if exists on_post_reaction on post_reactions;
drop trigger if exists on_post_comment on post_comments;
drop function if exists notify_on_post_reaction();
drop function if exists notify_on_post_comment();

-- Function to create notification when someone reacts to your post
create or replace function notify_on_post_reaction()
returns trigger as $$
declare
  post_owner_id uuid;
begin
  -- Get the post owner
  select user_id into post_owner_id
  from posts
  where id = new.post_id;

  -- Don't notify if you react to your own post
  if post_owner_id != new.user_id then
    insert into notifications (user_id, type, from_user_id, content, metadata)
    values (
      post_owner_id,
      'post_reaction',
      new.user_id,
      'reacted to your post',
      jsonb_build_object('post_id', new.post_id, 'reaction', new.reaction)
    );
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to create notification on post reaction
create trigger on_post_reaction
  after insert on post_reactions
  for each row
  execute function notify_on_post_reaction();

-- Function to create notification when someone comments on your post
create or replace function notify_on_post_comment()
returns trigger as $$
declare
  post_owner_id uuid;
begin
  -- Get the post owner
  select user_id into post_owner_id
  from posts
  where id = new.post_id;

  -- Don't notify if you comment on your own post
  if post_owner_id != new.user_id then
    insert into notifications (user_id, type, from_user_id, content, metadata)
    values (
      post_owner_id,
      'post_comment',
      new.user_id,
      'commented on your post',
      jsonb_build_object('post_id', new.post_id, 'comment_id', new.id)
    );
  end if;

  return new;
end;
$$ language plpgsql;

-- Trigger to create notification on post comment
create trigger on_post_comment
  after insert on post_comments
  for each row
  execute function notify_on_post_comment();
