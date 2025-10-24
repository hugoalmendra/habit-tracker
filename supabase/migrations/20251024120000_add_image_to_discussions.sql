-- Add image_url column to group_discussions table
ALTER TABLE group_discussions ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN group_discussions.image_url IS 'URL of the image attached to the discussion post';
