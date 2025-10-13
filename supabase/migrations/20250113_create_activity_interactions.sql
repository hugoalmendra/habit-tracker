-- Create activity_likes table
CREATE TABLE IF NOT EXISTS activity_likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES feed_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(activity_id, user_id)
);

-- Create activity_comments table
CREATE TABLE IF NOT EXISTS activity_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  activity_id UUID NOT NULL REFERENCES feed_activities(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS activity_likes_activity_id_idx ON activity_likes(activity_id);
CREATE INDEX IF NOT EXISTS activity_likes_user_id_idx ON activity_likes(user_id);
CREATE INDEX IF NOT EXISTS activity_comments_activity_id_idx ON activity_comments(activity_id);
CREATE INDEX IF NOT EXISTS activity_comments_user_id_idx ON activity_comments(user_id);
CREATE INDEX IF NOT EXISTS activity_comments_created_at_idx ON activity_comments(created_at DESC);

-- Enable RLS
ALTER TABLE activity_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_comments ENABLE ROW LEVEL SECURITY;

-- Policies for activity_likes
CREATE POLICY "Users can view all likes"
  ON activity_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like activities"
  ON activity_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike their own likes"
  ON activity_likes FOR DELETE
  USING (auth.uid() = user_id);

-- Policies for activity_comments
CREATE POLICY "Users can view all comments"
  ON activity_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can comment on activities"
  ON activity_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments"
  ON activity_comments FOR DELETE
  USING (auth.uid() = user_id);
