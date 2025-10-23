-- STEP 2: Enable RLS and Create Policies
-- Run this AFTER step1_create_tables.sql succeeds

-- Enable RLS
ALTER TABLE public_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for public_groups
CREATE POLICY "Anyone can view public groups"
  ON public_groups FOR SELECT
  USING (is_private = false);

CREATE POLICY "Members can view private groups"
  ON public_groups FOR SELECT
  USING (
    is_private = true
    AND EXISTS (
      SELECT 1 FROM user_group_memberships
      WHERE group_id = public_groups.id
      AND user_id = auth.uid()
    )
  );

CREATE POLICY "Authenticated users can create groups"
  ON public_groups FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Group creator can update their group"
  ON public_groups FOR UPDATE
  USING (auth.uid() = created_by);

CREATE POLICY "Group creator can delete their group"
  ON public_groups FOR DELETE
  USING (auth.uid() = created_by);

-- Verify RLS is enabled
SELECT 'RLS enabled for public_groups!' as status;
