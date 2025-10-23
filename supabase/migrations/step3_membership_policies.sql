-- STEP 3: Add RLS Policies for user_group_memberships
-- Run this AFTER step2_enable_rls.sql succeeds

CREATE POLICY "Anyone can view public group memberships"
  ON user_group_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public_groups
      WHERE id = group_id AND is_private = false
    )
  );

CREATE POLICY "Members can view private group memberships"
  ON user_group_memberships FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public_groups
      WHERE id = group_id AND is_private = true
    )
    AND EXISTS (
      SELECT 1 FROM user_group_memberships AS ugm
      WHERE ugm.group_id = user_group_memberships.group_id
      AND ugm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join public groups"
  ON user_group_memberships FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND EXISTS (
      SELECT 1 FROM public_groups
      WHERE id = group_id AND is_private = false
    )
  );

CREATE POLICY "Users can join private groups with invitation"
  ON user_group_memberships FOR INSERT
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

CREATE POLICY "Users can leave groups"
  ON user_group_memberships FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can remove members"
  ON user_group_memberships FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_group_memberships AS ugm
      WHERE ugm.group_id = user_group_memberships.group_id
      AND ugm.user_id = auth.uid()
      AND ugm.role = 'admin'
    )
  );

SELECT 'Membership policies created!' as status;
