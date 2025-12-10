-- Fix public_groups SELECT policy to allow members to see private groups they belong to
-- Previous policy only allowed:
-- 1. Anyone to see public groups
-- 2. Creators to see their own groups
--
-- This was causing issues where members of private groups couldn't see their groups
-- and couldn't be properly added to challenges via group invitations.

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "public_groups_select" ON public_groups;

-- Create a new policy that allows:
-- 1. Anyone to see public groups
-- 2. Creators to see their own groups
-- 3. Members to see groups they belong to
CREATE POLICY "public_groups_select" ON public_groups
FOR SELECT USING (
  (is_private = false)
  OR (created_by = auth.uid())
  OR (EXISTS (
    SELECT 1 FROM user_group_memberships
    WHERE user_group_memberships.group_id = public_groups.id
    AND user_group_memberships.user_id = auth.uid()
  ))
);
