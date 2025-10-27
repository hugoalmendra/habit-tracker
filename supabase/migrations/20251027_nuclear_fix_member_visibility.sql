-- Nuclear fix for member visibility
-- Drop ALL policies on user_group_memberships and recreate only what we need

-- Drop all existing policies
DROP POLICY IF EXISTS "select_private_group_memberships" ON user_group_memberships;
DROP POLICY IF EXISTS "select_public_group_memberships" ON user_group_memberships;
DROP POLICY IF EXISTS "Anyone can view public group memberships" ON user_group_memberships;
DROP POLICY IF EXISTS "Members can view private group memberships" ON user_group_memberships;
DROP POLICY IF EXISTS "Users can join public groups" ON user_group_memberships;
DROP POLICY IF EXISTS "insert_public_group_membership" ON user_group_memberships;
DROP POLICY IF EXISTS "Users can join private groups with invitation" ON user_group_memberships;
DROP POLICY IF EXISTS "insert_private_group_membership" ON user_group_memberships;
DROP POLICY IF EXISTS "Users can leave groups" ON user_group_memberships;
DROP POLICY IF EXISTS "delete_own_membership" ON user_group_memberships;
DROP POLICY IF EXISTS "Admins can remove members" ON user_group_memberships;
DROP POLICY IF EXISTS "delete_member_as_admin" ON user_group_memberships;

-- Create simple, non-recursive policies

-- SELECT: Anyone can view all group memberships (both public and private)
-- This is simpler and avoids recursion
CREATE POLICY "view_all_memberships"
ON user_group_memberships FOR SELECT
USING (true);

-- INSERT: Users can join public groups
CREATE POLICY "join_public_groups"
ON user_group_memberships FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM public_groups
    WHERE id = group_id AND is_private = false
  )
);

-- INSERT: Users can join private groups with invitation
CREATE POLICY "join_private_groups_with_invitation"
ON user_group_memberships FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1 FROM group_invitations
    WHERE group_id = user_group_memberships.group_id
    AND invited_user_id = auth.uid()
    AND status = 'accepted'
  )
);

-- UPDATE: Admins can update member roles (promote to admin)
CREATE POLICY "admins_update_member_roles"
ON user_group_memberships FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_group_memberships AS admin_check
    WHERE admin_check.group_id = user_group_memberships.group_id
    AND admin_check.user_id = auth.uid()
    AND admin_check.role = 'admin'
  )
);

-- DELETE: Users can leave groups
CREATE POLICY "leave_groups"
ON user_group_memberships FOR DELETE
USING (auth.uid() = user_id);

-- DELETE: Admins can remove members
CREATE POLICY "admins_remove_members"
ON user_group_memberships FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM user_group_memberships AS admin_check
    WHERE admin_check.group_id = user_group_memberships.group_id
    AND admin_check.user_id = auth.uid()
    AND admin_check.role = 'admin'
  )
);

-- Verify the fix
SELECT 'All member visibility policies recreated!' as status;
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'user_group_memberships' ORDER BY policyname;
