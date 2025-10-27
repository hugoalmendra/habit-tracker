-- Fix member visibility issue caused by recursive RLS policy
-- The issue: select_private_group_memberships policy causes only 1 member to be visible
-- due to self-referencing recursion in PostgreSQL RLS

-- Drop the problematic recursive policy
DROP POLICY IF EXISTS "select_private_group_memberships" ON user_group_memberships;

-- Recreate it with SECURITY DEFINER function to avoid recursion
-- First, create a helper function that bypasses RLS
CREATE OR REPLACE FUNCTION is_group_member(p_group_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM user_group_memberships
    WHERE group_id = p_group_id
    AND user_id = p_user_id
  );
$$;

-- Recreate the policy using the security definer function
CREATE POLICY "select_private_group_memberships"
ON user_group_memberships FOR SELECT
USING (
  -- Allow viewing memberships of groups where current user is a member
  -- Use security definer function to avoid recursive RLS check
  is_group_member(group_id, auth.uid())
  AND group_id IN (
    SELECT id FROM public_groups WHERE is_private = true
  )
);

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION is_group_member(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION is_group_member(UUID, UUID) TO anon;

-- Verify the fix
SELECT 'Member visibility policy fixed!' as status;
