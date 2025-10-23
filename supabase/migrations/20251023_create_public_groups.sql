-- Create public groups feature for joinable communities

-- Create public_groups table
CREATE TABLE IF NOT EXISTS public_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT false NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure group names are unique
  UNIQUE(name)
);

-- Create user_group_memberships table
CREATE TABLE IF NOT EXISTS user_group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public_groups(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' NOT NULL CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure a user can only join a group once
  UNIQUE(user_id, group_id)
);

-- Create group_invitations table for private groups
CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public_groups(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),

  -- Ensure a user can only be invited once per group (per status)
  UNIQUE(group_id, invited_user_id, status)
);

-- Create indexes for better query performance
CREATE INDEX idx_public_groups_created_by ON public_groups(created_by);
CREATE INDEX idx_public_groups_is_private ON public_groups(is_private);
CREATE INDEX idx_user_group_memberships_user_id ON user_group_memberships(user_id);
CREATE INDEX idx_user_group_memberships_group_id ON user_group_memberships(group_id);
CREATE INDEX idx_group_invitations_invited_user_id ON group_invitations(invited_user_id);
CREATE INDEX idx_group_invitations_group_id ON group_invitations(group_id);
CREATE INDEX idx_group_invitations_status ON group_invitations(status);

-- Enable RLS
ALTER TABLE public_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public_groups

-- Anyone can view public groups
CREATE POLICY "Anyone can view public groups"
  ON public_groups
  FOR SELECT
  USING (is_private = false);

-- Members can view private groups they belong to
CREATE POLICY "Members can view private groups"
  ON public_groups
  FOR SELECT
  USING (
    is_private = true
    AND EXISTS (
      SELECT 1 FROM user_group_memberships
      WHERE group_id = public_groups.id AND user_id = auth.uid()
    )
  );

-- Authenticated users can create groups
CREATE POLICY "Authenticated users can create groups"
  ON public_groups
  FOR INSERT
  WITH CHECK (auth.uid() = created_by);

-- Group creator can update their group
CREATE POLICY "Group creator can update their group"
  ON public_groups
  FOR UPDATE
  USING (auth.uid() = created_by);

-- Group creator can delete their group
CREATE POLICY "Group creator can delete their group"
  ON public_groups
  FOR DELETE
  USING (auth.uid() = created_by);

-- RLS Policies for user_group_memberships

-- Anyone can view memberships of public groups
CREATE POLICY "Anyone can view public group memberships"
  ON user_group_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public_groups
      WHERE id = group_id AND is_private = false
    )
  );

-- Members can view memberships of private groups they belong to
CREATE POLICY "Members can view private group memberships"
  ON user_group_memberships
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public_groups
      WHERE id = group_id AND is_private = true
    )
    AND EXISTS (
      SELECT 1 FROM user_group_memberships AS ugm
      WHERE ugm.group_id = user_group_memberships.group_id AND ugm.user_id = auth.uid()
    )
  );

-- Users can join public groups
CREATE POLICY "Users can join public groups"
  ON user_group_memberships
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public_groups
      WHERE id = group_id AND is_private = false
    )
  );

-- Users can join private groups if they have an accepted invitation
CREATE POLICY "Users can join private groups with invitation"
  ON user_group_memberships
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public_groups
      WHERE id = group_id AND is_private = true
    )
    AND EXISTS (
      SELECT 1 FROM group_invitations
      WHERE group_id = user_group_memberships.group_id
      AND invited_user_id = auth.uid()
      AND status = 'accepted'
    )
  );

-- Users can leave groups they're members of
CREATE POLICY "Users can leave groups"
  ON user_group_memberships
  FOR DELETE
  USING (auth.uid() = user_id);

-- Admins can remove members from groups
CREATE POLICY "Admins can remove members"
  ON user_group_memberships
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_group_memberships AS ugm
      WHERE ugm.group_id = user_group_memberships.group_id
      AND ugm.user_id = auth.uid()
      AND ugm.role = 'admin'
    )
  );

-- RLS Policies for group_invitations

-- Users can view their own invitations
CREATE POLICY "Users can view their own invitations"
  ON group_invitations
  FOR SELECT
  USING (auth.uid() = invited_user_id);

-- Group members with admin role can view group invitations
CREATE POLICY "Admins can view group invitations"
  ON group_invitations
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_group_memberships
      WHERE group_id = group_invitations.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Admins can create invitations for private groups
CREATE POLICY "Admins can invite users to private groups"
  ON group_invitations
  FOR INSERT
  WITH CHECK (
    auth.uid() = invited_by
    AND EXISTS (
      SELECT 1 FROM user_group_memberships
      WHERE group_id = group_invitations.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
    AND EXISTS (
      SELECT 1 FROM public_groups
      WHERE id = group_invitations.group_id AND is_private = true
    )
  );

-- Users can update their own invitation status (accept/decline)
CREATE POLICY "Users can update their own invitations"
  ON group_invitations
  FOR UPDATE
  USING (auth.uid() = invited_user_id);

-- Admins can delete invitations
CREATE POLICY "Admins can delete invitations"
  ON group_invitations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_group_memberships
      WHERE group_id = group_invitations.group_id
      AND user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Add updated_at triggers
CREATE TRIGGER update_public_groups_updated_at
  BEFORE UPDATE ON public_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_group_invitations_updated_at
  BEFORE UPDATE ON group_invitations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically make group creator an admin
CREATE OR REPLACE FUNCTION add_creator_as_admin()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_group_memberships (user_id, group_id, role)
  VALUES (NEW.created_by, NEW.id, 'admin');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-add creator as admin when group is created
CREATE TRIGGER auto_add_creator_as_admin
  AFTER INSERT ON public_groups
  FOR EACH ROW
  EXECUTE FUNCTION add_creator_as_admin();
