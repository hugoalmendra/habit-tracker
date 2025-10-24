-- Create group_discussions table for chat-like messages in groups
CREATE TABLE IF NOT EXISTS group_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES public_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discussion_reactions table for likes/reactions on messages
CREATE TABLE IF NOT EXISTS discussion_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES group_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like', -- 'like', 'love', 'celebrate', etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(discussion_id, user_id, reaction_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_group_discussions_group_id ON group_discussions(group_id);
CREATE INDEX IF NOT EXISTS idx_group_discussions_user_id ON group_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_group_discussions_created_at ON group_discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_discussion_reactions_discussion_id ON discussion_reactions(discussion_id);
CREATE INDEX IF NOT EXISTS idx_discussion_reactions_user_id ON discussion_reactions(user_id);

-- Enable RLS
ALTER TABLE group_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for group_discussions

-- Members can view discussions in their groups
CREATE POLICY "group_discussions_select_policy" ON group_discussions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_group_memberships
    WHERE user_group_memberships.group_id = group_discussions.group_id
    AND user_group_memberships.user_id = auth.uid()
  )
);

-- Members can create discussions in their groups
CREATE POLICY "group_discussions_insert_policy" ON group_discussions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM user_group_memberships
    WHERE user_group_memberships.group_id = group_discussions.group_id
    AND user_group_memberships.user_id = auth.uid()
  )
);

-- Users can update their own messages
CREATE POLICY "group_discussions_update_policy" ON group_discussions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Users can delete their own messages, admins can delete any message
CREATE POLICY "group_discussions_delete_policy" ON group_discussions
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM user_group_memberships
      WHERE user_group_memberships.group_id = group_discussions.group_id
      AND user_group_memberships.user_id = auth.uid()
      AND user_group_memberships.role = 'admin'
    )
  )
);

-- Admins can pin/unpin messages
CREATE POLICY "group_discussions_pin_policy" ON group_discussions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM user_group_memberships
    WHERE user_group_memberships.group_id = group_discussions.group_id
    AND user_group_memberships.user_id = auth.uid()
    AND user_group_memberships.role = 'admin'
  )
);

-- RLS Policies for discussion_reactions

-- Members can view reactions in their groups
CREATE POLICY "discussion_reactions_select_policy" ON discussion_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_discussions
    JOIN user_group_memberships ON user_group_memberships.group_id = group_discussions.group_id
    WHERE group_discussions.id = discussion_reactions.discussion_id
    AND user_group_memberships.user_id = auth.uid()
  )
);

-- Members can add reactions
CREATE POLICY "discussion_reactions_insert_policy" ON discussion_reactions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM group_discussions
    JOIN user_group_memberships ON user_group_memberships.group_id = group_discussions.group_id
    WHERE group_discussions.id = discussion_reactions.discussion_id
    AND user_group_memberships.user_id = auth.uid()
  )
);

-- Users can remove their own reactions
CREATE POLICY "discussion_reactions_delete_policy" ON discussion_reactions
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_group_discussion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_group_discussion_updated_at_trigger
BEFORE UPDATE ON group_discussions
FOR EACH ROW
EXECUTE FUNCTION update_group_discussion_updated_at();
