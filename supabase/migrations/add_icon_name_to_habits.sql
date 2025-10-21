-- Add icon_name column to habits table
ALTER TABLE habits
ADD COLUMN icon_name TEXT;

-- Add comment to describe the column
COMMENT ON COLUMN habits.icon_name IS 'Name of the Lucide icon to display for this habit (e.g., Dumbbell, Book, Coffee)';
