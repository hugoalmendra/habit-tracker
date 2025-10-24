-- Create discussion_comments table for comments on discussion posts
CREATE TABLE IF NOT EXISTS discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES group_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_discussion_comments_discussion_id ON discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_user_id ON discussion_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_discussion_comments_created_at ON discussion_comments(created_at ASC);

-- Enable RLS
ALTER TABLE discussion_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discussion_comments

-- Members can view comments in their groups
CREATE POLICY "discussion_comments_select_policy" ON discussion_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_discussions
    JOIN user_group_memberships ON user_group_memberships.group_id = group_discussions.group_id
    WHERE group_discussions.id = discussion_comments.discussion_id
    AND user_group_memberships.user_id = auth.uid()
  )
);

-- Members can create comments
CREATE POLICY "discussion_comments_insert_policy" ON discussion_comments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM group_discussions
    JOIN user_group_memberships ON user_group_memberships.group_id = group_discussions.group_id
    WHERE group_discussions.id = discussion_comments.discussion_id
    AND user_group_memberships.user_id = auth.uid()
  )
);

-- Users can update their own comments
CREATE POLICY "discussion_comments_update_policy" ON discussion_comments
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Users can delete their own comments, admins can delete any comment
CREATE POLICY "discussion_comments_delete_policy" ON discussion_comments
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM group_discussions
      JOIN user_group_memberships ON user_group_memberships.group_id = group_discussions.group_id
      WHERE group_discussions.id = discussion_comments.discussion_id
      AND user_group_memberships.user_id = auth.uid()
      AND user_group_memberships.role = 'admin'
    )
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_discussion_comment_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_discussion_comment_updated_at_trigger
BEFORE UPDATE ON discussion_comments
FOR EACH ROW
EXECUTE FUNCTION update_discussion_comment_updated_at();
