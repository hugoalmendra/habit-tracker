-- Allow viewing badges for users with public profiles

-- Badge Definitions are public to everyone
DROP POLICY IF EXISTS "Badge definitions are viewable by everyone" ON badge_definitions;
CREATE POLICY "Badge definitions are viewable by everyone"
ON badge_definitions
FOR SELECT
USING (true);

-- User Badges
DROP POLICY IF EXISTS "Users can view their own badges" ON user_badges;
DROP POLICY IF EXISTS "Users can view badges of public profiles" ON user_badges;

CREATE POLICY "Users can view their own badges"
ON user_badges
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view badges of public profiles"
ON user_badges
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = user_badges.user_id
    AND profiles.is_public = true
  )
);

-- Badge Progress
DROP POLICY IF EXISTS "Users can view their own badge progress" ON badge_progress;
DROP POLICY IF EXISTS "Users can view badge progress of public profiles" ON badge_progress;

CREATE POLICY "Users can view their own badge progress"
ON badge_progress
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view badge progress of public profiles"
ON badge_progress
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = badge_progress.user_id
    AND profiles.is_public = true
  )
);

-- Posts (for recent activity)
DROP POLICY IF EXISTS "Users can view their own posts" ON posts;
DROP POLICY IF EXISTS "Users can view posts from public profiles" ON posts;

CREATE POLICY "Users can view their own posts"
ON posts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can view posts from public profiles"
ON posts
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.id = posts.user_id
    AND profiles.is_public = true
  )
);
