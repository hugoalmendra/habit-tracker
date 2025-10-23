-- Enable RLS on followers table if not already enabled
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "followers_select_policy" ON followers;
DROP POLICY IF EXISTS "followers_insert_policy" ON followers;
DROP POLICY IF EXISTS "followers_update_policy" ON followers;
DROP POLICY IF EXISTS "followers_delete_policy" ON followers;

-- Policy: Anyone can view accepted followers (for public profiles)
-- This allows both authenticated and unauthenticated users to see follower counts
CREATE POLICY "followers_select_policy" ON followers
FOR SELECT
USING (
  status = 'accepted'
  OR follower_id = auth.uid()
  OR following_id = auth.uid()
);

-- Policy: Authenticated users can create follow requests
CREATE POLICY "followers_insert_policy" ON followers
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND follower_id = auth.uid()
);

-- Policy: Users can update their own follow requests (accept/reject)
CREATE POLICY "followers_update_policy" ON followers
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND (follower_id = auth.uid() OR following_id = auth.uid())
);

-- Policy: Users can delete their own follows (unfollow)
CREATE POLICY "followers_delete_policy" ON followers
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND follower_id = auth.uid()
);
