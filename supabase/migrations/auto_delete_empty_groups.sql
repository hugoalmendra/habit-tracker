-- Auto-delete groups when the last member leaves
-- This trigger runs after a member is deleted from user_group_memberships

CREATE OR REPLACE FUNCTION delete_group_if_empty()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if the group has any remaining members
  IF NOT EXISTS (
    SELECT 1
    FROM user_group_memberships
    WHERE group_id = OLD.group_id
  ) THEN
    -- Delete the group if no members remain
    DELETE FROM public_groups WHERE id = OLD.group_id;
  END IF;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS trigger_delete_empty_groups ON user_group_memberships;

CREATE TRIGGER trigger_delete_empty_groups
  AFTER DELETE ON user_group_memberships
  FOR EACH ROW
  EXECUTE FUNCTION delete_group_if_empty();

-- Verify the trigger was created
SELECT 'Trigger created successfully!' as status;
SELECT tgname, tgrelid::regclass, tgtype
FROM pg_trigger
WHERE tgname = 'trigger_delete_empty_groups';
