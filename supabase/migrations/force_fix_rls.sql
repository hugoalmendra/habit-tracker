-- FORCE FIX: Disable RLS temporarily and recreate with simple policies
-- Run this in Supabase SQL Editor

-- Step 1: Completely disable RLS on all tables
ALTER TABLE public_groups DISABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_memberships DISABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL existing policies (using CASCADE to ensure they're gone)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT policyname, tablename FROM pg_policies WHERE tablename IN ('public_groups', 'user_group_memberships', 'group_invitations')) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I CASCADE', r.policyname, r.tablename);
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE public_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_group_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE group_invitations ENABLE ROW LEVEL SECURITY;

-- Step 4: Create SIMPLE policies without any recursion

-- =============================================
-- PUBLIC_GROUPS - Ultra-simple policies
-- =============================================

-- Allow SELECT on public groups OR groups you created
CREATE POLICY "public_groups_select" ON public_groups
FOR SELECT USING (
  is_private = false
  OR created_by = auth.uid()
);

-- Allow INSERT only if you're the creator
CREATE POLICY "public_groups_insert" ON public_groups
FOR INSERT WITH CHECK (
  created_by = auth.uid()
);

-- Allow UPDATE only if you're the creator
CREATE POLICY "public_groups_update" ON public_groups
FOR UPDATE USING (
  created_by = auth.uid()
);

-- Allow DELETE only if you're the creator
CREATE POLICY "public_groups_delete" ON public_groups
FOR DELETE USING (
  created_by = auth.uid()
);

-- =============================================
-- USER_GROUP_MEMBERSHIPS - Simple policies
-- =============================================

-- Allow SELECT if you're the user OR it's your group membership
CREATE POLICY "memberships_select" ON user_group_memberships
FOR SELECT USING (
  user_id = auth.uid()
);

-- Allow INSERT if you're joining as yourself
CREATE POLICY "memberships_insert" ON user_group_memberships
FOR INSERT WITH CHECK (
  user_id = auth.uid()
);

-- Allow DELETE if it's your own membership
CREATE POLICY "memberships_delete" ON user_group_memberships
FOR DELETE USING (
  user_id = auth.uid()
);

-- =============================================
-- GROUP_INVITATIONS - Simple policies
-- =============================================

-- Allow SELECT if you're the invited user
CREATE POLICY "invitations_select" ON group_invitations
FOR SELECT USING (
  invited_user_id = auth.uid()
);

-- Allow INSERT if you're the inviter
CREATE POLICY "invitations_insert" ON group_invitations
FOR INSERT WITH CHECK (
  invited_by = auth.uid()
);

-- Allow UPDATE if you're the invited user
CREATE POLICY "invitations_update" ON group_invitations
FOR UPDATE USING (
  invited_user_id = auth.uid()
);

-- Allow DELETE if you're the inviter
CREATE POLICY "invitations_delete" ON group_invitations
FOR DELETE USING (
  invited_by = auth.uid()
);

-- Verify the fix
SELECT 'RLS policies recreated successfully!' as status;
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('public_groups', 'user_group_memberships', 'group_invitations')
ORDER BY tablename, cmd;
