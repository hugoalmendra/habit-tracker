-- Add frequency support to habits
-- Allows habits to be configured as daily, specific days, or weekly targets

-- Add frequency columns to habits table
ALTER TABLE habits
ADD COLUMN frequency_type TEXT DEFAULT 'daily' CHECK (frequency_type IN ('daily', 'specific_days', 'weekly_target')),
ADD COLUMN frequency_config JSONB DEFAULT NULL;

-- Create index for faster filtering by frequency type
CREATE INDEX idx_habits_frequency_type ON habits(frequency_type);

-- Add comment explaining the frequency_config structure
COMMENT ON COLUMN habits.frequency_config IS 'Configuration for habit frequency. Structure:
  - specific_days: {"days": [0,1,2,3,4,5,6]} where 0=Sunday, 6=Saturday
  - weekly_target: {"target": 3, "reset_day": 0} where target is completions needed and reset_day is when week starts (0=Sunday)';

-- Update existing habits to have daily frequency (backward compatibility)
UPDATE habits
SET frequency_type = 'daily',
    frequency_config = NULL
WHERE frequency_type IS NULL;
