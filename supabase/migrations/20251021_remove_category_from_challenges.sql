-- Remove category field from challenges table
-- Challenges can contain habits from different categories

ALTER TABLE challenges DROP COLUMN IF EXISTS category;
