-- Rename categories: Hustle -> Career, Heart -> Spirit, Harmony -> Mindset, Happiness -> Joy

-- Step 1: Drop the old check constraints first
ALTER TABLE habits DROP CONSTRAINT IF EXISTS habits_category_check;
ALTER TABLE challenges DROP CONSTRAINT IF EXISTS challenges_category_check;

-- Step 2: Update existing records in habits table
UPDATE habits SET category = 'Career' WHERE category = 'Hustle';
UPDATE habits SET category = 'Spirit' WHERE category = 'Heart';
UPDATE habits SET category = 'Mindset' WHERE category = 'Harmony';
UPDATE habits SET category = 'Joy' WHERE category = 'Happiness';

-- Step 3: Update existing records in challenges table
UPDATE challenges SET category = 'Career' WHERE category = 'Hustle';
UPDATE challenges SET category = 'Spirit' WHERE category = 'Heart';
UPDATE challenges SET category = 'Mindset' WHERE category = 'Harmony';
UPDATE challenges SET category = 'Joy' WHERE category = 'Happiness';

-- Step 4: Add new check constraints with updated category names
ALTER TABLE habits ADD CONSTRAINT habits_category_check
  CHECK (category = ANY (ARRAY['Health'::text, 'Career'::text, 'Spirit'::text, 'Mindset'::text, 'Joy'::text]));

ALTER TABLE challenges ADD CONSTRAINT challenges_category_check
  CHECK (category = ANY (ARRAY['Health'::text, 'Career'::text, 'Spirit'::text, 'Mindset'::text, 'Joy'::text]));
