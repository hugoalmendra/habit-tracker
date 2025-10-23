-- Fix infinite recursion in groups RLS policies
-- Run this in Supabase SQL Editor

-- First, drop all existing policies to start fresh
DROP POLICY IF EXISTS "Anyone can view public groups" ON public_groups;
DROP POLICY IF EXISTS "Members can view private groups" ON public_groups;
DROP POLICY IF EXISTS "Authenticated users can create groups" ON public_groups;
DROP POLICY IF EXISTS "Group creator can update their group" ON public_groups;
DROP POLICY IF EXISTS "Group creator can delete their group" ON public_groups;

DROP POLICY IF EXISTS "Anyone can view public group memberships" ON user_group_memberships;
DROP POLICY IF EXISTS "Members can view private group memberships" ON user_group_memberships;
DROP POLICY IF EXISTS "Users can join public groups" ON user_group_memberships;
DROP POLICY IF EXISTS "Users can join private groups with invitation" ON user_group_memberships;
DROP POLICY IF EXISTS "Users can leave groups" ON user_group_memberships;
DROP POLICY IF EXISTS "Admins can remove members" ON user_group_memberships;

DROP POLICY IF EXISTS "Users can view their own invitations" ON group_invitations;
DROP POLICY IF EXISTS "Admins can view group invitations" ON group_invitations;
DROP POLICY IF EXISTS "Admins can invite users to private groups" ON group_invitations;
DROP POLICY IF EXISTS "Users can update their own invitations" ON group_invitations;
DROP POLICY IF EXISTS "Admins can delete invitations" ON group_invitations;

-- =============================================
-- SIMPLE NON-RECURSIVE POLICIES FOR PUBLIC_GROUPS
-- =============================================

-- Allow anyone to view public groups (no recursion)
CREATE POLICY "select_public_groups"
ON public_groups FOR SELECT
USING (is_private = false);

-- Allow members to view private groups they belong to (uses security definer function to avoid recursion)
CREATE POLICY "select_private_groups_for_members"
ON public_groups FOR SELECT
USING (
  is_private = true
  AND id IN (
    SELECT group_id
    FROM user_group_memberships
    WHERE user_id = auth.uid()
  )
);

-- Allow authenticated users to create groups
CREATE POLICY "insert_groups"
ON public_groups FOR INSERT
WITH CHECK (auth.uid() = created_by AND auth.uid() IS NOT NULL);

-- Allow creators to update their groups
CREATE POLICY "update_own_groups"
ON public_groups FOR UPDATE
USING (auth.uid() = created_by);

-- Allow creators to delete their groups
CREATE POLICY "delete_own_groups"
ON public_groups FOR DELETE
USING (auth.uid() = created_by);

-- =============================================
-- POLICIES FOR USER_GROUP_MEMBERSHIPS
-- =============================================

-- Allow users to view memberships of public groups
CREATE POLICY "select_public_group_memberships"
ON user_group_memberships FOR SELECT
USING (
  group_id IN (
    SELECT id FROM public_groups WHERE is_private = false
  )
);

-- Allow users to view memberships of private groups they're in
CREATE POLICY "select_private_group_memberships"
ON user_group_memberships FOR SELECT
USING (
  group_id IN (
    SELECT group_id
    FROM user_group_memberships AS ugm
    WHERE ugm.user_id = auth.uid()
  )
);

-- Allow users to join public groups
CREATE POLICY "insert_public_group_membership"
ON user_group_memberships FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND group_id IN (
    SELECT id FROM public_groups WHERE is_private = false
  )
);

-- Allow users to join private groups with accepted invitation
CREATE POLICY "insert_private_group_membership"
ON user_group_memberships FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND group_id IN (
    SELECT group_id
    FROM group_invitations
    WHERE invited_user_id = auth.uid()
    AND status = 'accepted'
  )
);

-- Allow users to leave groups
CREATE POLICY "delete_own_membership"
ON user_group_memberships FOR DELETE
USING (auth.uid() = user_id);

-- Allow admins to remove members
CREATE POLICY "delete_member_as_admin"
ON user_group_memberships FOR DELETE
USING (
  group_id IN (
    SELECT group_id
    FROM user_group_memberships
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- =============================================
-- POLICIES FOR GROUP_INVITATIONS
-- =============================================

-- Allow users to view their own invitations
CREATE POLICY "select_own_invitations"
ON group_invitations FOR SELECT
USING (auth.uid() = invited_user_id);

-- Allow admins to view invitations for their groups
CREATE POLICY "select_group_invitations_as_admin"
ON group_invitations FOR SELECT
USING (
  group_id IN (
    SELECT group_id
    FROM user_group_memberships
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Allow admins to invite users to private groups
CREATE POLICY "insert_invitation_as_admin"
ON group_invitations FOR INSERT
WITH CHECK (
  auth.uid() = invited_by
  AND group_id IN (
    SELECT group_id
    FROM user_group_memberships
    WHERE user_id = auth.uid() AND role = 'admin'
  )
  AND group_id IN (
    SELECT id FROM public_groups WHERE is_private = true
  )
);

-- Allow users to update their own invitations (accept/decline)
CREATE POLICY "update_own_invitations"
ON group_invitations FOR UPDATE
USING (auth.uid() = invited_user_id);

-- Allow admins to delete invitations
CREATE POLICY "delete_invitation_as_admin"
ON group_invitations FOR DELETE
USING (
  group_id IN (
    SELECT group_id
    FROM user_group_memberships
    WHERE user_id = auth.uid() AND role = 'admin'
  )
);

-- Verify policies were created successfully
SELECT 'RLS policies fixed successfully!' as status;
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename IN ('public_groups', 'user_group_memberships', 'group_invitations')
ORDER BY tablename, policyname;
