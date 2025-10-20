-- Create follower groups feature for easy challenge invitations

-- Create follower_groups table
CREATE TABLE IF NOT EXISTS follower_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure group names are unique per user
  UNIQUE(user_id, name)
);

-- Create follower_group_members table
CREATE TABLE IF NOT EXISTS follower_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES follower_groups(id) ON DELETE CASCADE NOT NULL,
  follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure a follower is only added once per group
  UNIQUE(group_id, follower_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_follower_groups_user_id ON follower_groups(user_id);
CREATE INDEX idx_follower_group_members_group_id ON follower_group_members(group_id);
CREATE INDEX idx_follower_group_members_follower_id ON follower_group_members(follower_id);

-- Enable RLS
ALTER TABLE follower_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE follower_group_members ENABLE ROW LEVEL SECURITY;

-- RLS Policies for follower_groups

-- Users can view their own groups
CREATE POLICY "Users can view their own groups"
  ON follower_groups
  FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create their own groups
CREATE POLICY "Users can create their own groups"
  ON follower_groups
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own groups
CREATE POLICY "Users can update their own groups"
  ON follower_groups
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own groups
CREATE POLICY "Users can delete their own groups"
  ON follower_groups
  FOR DELETE
  USING (auth.uid() = user_id);

-- RLS Policies for follower_group_members

-- Users can view members of their own groups
CREATE POLICY "Users can view members of their own groups"
  ON follower_group_members
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM follower_groups
      WHERE id = group_id AND user_id = auth.uid()
    )
  );

-- Users can add members to their own groups (only if they're following that person)
CREATE POLICY "Users can add members to their own groups"
  ON follower_group_members
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM follower_groups
      WHERE id = group_id AND user_id = auth.uid()
    )
    AND EXISTS (
      SELECT 1 FROM followers
      WHERE follower_id = auth.uid()
      AND following_id = follower_group_members.follower_id
      AND status = 'accepted'
    )
  );

-- Users can remove members from their own groups
CREATE POLICY "Users can remove members from their own groups"
  ON follower_group_members
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM follower_groups
      WHERE id = group_id AND user_id = auth.uid()
    )
  );

-- Add updated_at trigger for follower_groups
CREATE TRIGGER update_follower_groups_updated_at
  BEFORE UPDATE ON follower_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
