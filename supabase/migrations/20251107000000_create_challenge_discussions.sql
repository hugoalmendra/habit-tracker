-- Create challenge_discussions table for posts in challenges
CREATE TABLE IF NOT EXISTS challenge_discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenge_id UUID NOT NULL REFERENCES challenges(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  image_url TEXT,
  is_pinned BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create challenge_discussion_reactions table for likes/reactions on posts
CREATE TABLE IF NOT EXISTS challenge_discussion_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES challenge_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT DEFAULT 'like',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(discussion_id, user_id, reaction_type)
);

-- Create challenge_discussion_comments table for comments on posts
CREATE TABLE IF NOT EXISTS challenge_discussion_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES challenge_discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_challenge_discussions_challenge_id ON challenge_discussions(challenge_id);
CREATE INDEX IF NOT EXISTS idx_challenge_discussions_user_id ON challenge_discussions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_discussions_created_at ON challenge_discussions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_challenge_discussion_reactions_discussion_id ON challenge_discussion_reactions(discussion_id);
CREATE INDEX IF NOT EXISTS idx_challenge_discussion_reactions_user_id ON challenge_discussion_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_challenge_discussion_comments_discussion_id ON challenge_discussion_comments(discussion_id);
CREATE INDEX IF NOT EXISTS idx_challenge_discussion_comments_user_id ON challenge_discussion_comments(user_id);

-- Enable RLS
ALTER TABLE challenge_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_discussion_reactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenge_discussion_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies for challenge_discussions

-- Participants can view discussions in challenges they've accepted
CREATE POLICY "challenge_discussions_select_policy" ON challenge_discussions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM challenge_participants
    WHERE challenge_participants.challenge_id = challenge_discussions.challenge_id
    AND challenge_participants.user_id = auth.uid()
    AND challenge_participants.status IN ('accepted', 'completed')
  )
);

-- Participants can create discussions in challenges they've accepted
CREATE POLICY "challenge_discussions_insert_policy" ON challenge_discussions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM challenge_participants
    WHERE challenge_participants.challenge_id = challenge_discussions.challenge_id
    AND challenge_participants.user_id = auth.uid()
    AND challenge_participants.status IN ('accepted', 'completed')
  )
);

-- Users can update their own posts
CREATE POLICY "challenge_discussions_update_policy" ON challenge_discussions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Users can delete their own posts, challenge creator can delete any post
CREATE POLICY "challenge_discussions_delete_policy" ON challenge_discussions
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM challenges
      WHERE challenges.id = challenge_discussions.challenge_id
      AND challenges.creator_id = auth.uid()
    )
  )
);

-- Challenge creator can pin/unpin posts
CREATE POLICY "challenge_discussions_pin_policy" ON challenge_discussions
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND EXISTS (
    SELECT 1 FROM challenges
    WHERE challenges.id = challenge_discussions.challenge_id
    AND challenges.creator_id = auth.uid()
  )
);

-- RLS Policies for challenge_discussion_reactions

-- Participants can view reactions in challenges they've accepted
CREATE POLICY "challenge_discussion_reactions_select_policy" ON challenge_discussion_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM challenge_discussions
    JOIN challenge_participants ON challenge_participants.challenge_id = challenge_discussions.challenge_id
    WHERE challenge_discussions.id = challenge_discussion_reactions.discussion_id
    AND challenge_participants.user_id = auth.uid()
    AND challenge_participants.status IN ('accepted', 'completed')
  )
);

-- Participants can add reactions
CREATE POLICY "challenge_discussion_reactions_insert_policy" ON challenge_discussion_reactions
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM challenge_discussions
    JOIN challenge_participants ON challenge_participants.challenge_id = challenge_discussions.challenge_id
    WHERE challenge_discussions.id = challenge_discussion_reactions.discussion_id
    AND challenge_participants.user_id = auth.uid()
    AND challenge_participants.status IN ('accepted', 'completed')
  )
);

-- Users can remove their own reactions
CREATE POLICY "challenge_discussion_reactions_delete_policy" ON challenge_discussion_reactions
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
);

-- RLS Policies for challenge_discussion_comments

-- Participants can view comments in challenges they've accepted
CREATE POLICY "challenge_discussion_comments_select_policy" ON challenge_discussion_comments
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM challenge_discussions
    JOIN challenge_participants ON challenge_participants.challenge_id = challenge_discussions.challenge_id
    WHERE challenge_discussions.id = challenge_discussion_comments.discussion_id
    AND challenge_participants.user_id = auth.uid()
    AND challenge_participants.status IN ('accepted', 'completed')
  )
);

-- Participants can add comments
CREATE POLICY "challenge_discussion_comments_insert_policy" ON challenge_discussion_comments
FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
  AND EXISTS (
    SELECT 1 FROM challenge_discussions
    JOIN challenge_participants ON challenge_participants.challenge_id = challenge_discussions.challenge_id
    WHERE challenge_discussions.id = challenge_discussion_comments.discussion_id
    AND challenge_participants.user_id = auth.uid()
    AND challenge_participants.status IN ('accepted', 'completed')
  )
);

-- Users can update their own comments
CREATE POLICY "challenge_discussion_comments_update_policy" ON challenge_discussion_comments
FOR UPDATE
USING (
  auth.uid() IS NOT NULL
  AND user_id = auth.uid()
)
WITH CHECK (
  user_id = auth.uid()
);

-- Users can delete their own comments, challenge creator can delete any comment
CREATE POLICY "challenge_discussion_comments_delete_policy" ON challenge_discussion_comments
FOR DELETE
USING (
  auth.uid() IS NOT NULL
  AND (
    user_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM challenge_discussions
      JOIN challenges ON challenges.id = challenge_discussions.challenge_id
      WHERE challenge_discussions.id = challenge_discussion_comments.discussion_id
      AND challenges.creator_id = auth.uid()
    )
  )
);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_challenge_discussion_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at for discussions
CREATE TRIGGER update_challenge_discussion_updated_at_trigger
BEFORE UPDATE ON challenge_discussions
FOR EACH ROW
EXECUTE FUNCTION update_challenge_discussion_updated_at();

-- Trigger to automatically update updated_at for comments
CREATE TRIGGER update_challenge_discussion_comment_updated_at_trigger
BEFORE UPDATE ON challenge_discussion_comments
FOR EACH ROW
EXECUTE FUNCTION update_challenge_discussion_updated_at();
