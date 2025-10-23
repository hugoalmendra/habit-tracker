-- STEP 1: Create Tables
-- Run this first, then check for errors before proceeding

-- Drop existing tables if they exist
DROP TABLE IF EXISTS group_invitations CASCADE;
DROP TABLE IF EXISTS user_group_memberships CASCADE;
DROP TABLE IF EXISTS public_groups CASCADE;

-- Create public_groups table
CREATE TABLE public_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  avatar_url TEXT,
  is_private BOOLEAN DEFAULT false NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create user_group_memberships table
CREATE TABLE user_group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  group_id UUID REFERENCES public_groups(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' NOT NULL CHECK (role IN ('member', 'admin')),
  joined_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, group_id)
);

-- Create group_invitations table
CREATE TABLE group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID REFERENCES public_groups(id) ON DELETE CASCADE NOT NULL,
  invited_by UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  invited_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT DEFAULT 'pending' NOT NULL CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_public_groups_created_by ON public_groups(created_by);
CREATE INDEX idx_public_groups_is_private ON public_groups(is_private);
CREATE INDEX idx_user_group_memberships_user_id ON user_group_memberships(user_id);
CREATE INDEX idx_user_group_memberships_group_id ON user_group_memberships(group_id);
CREATE INDEX idx_group_invitations_invited_user_id ON group_invitations(invited_user_id);
CREATE INDEX idx_group_invitations_status ON group_invitations(status);

-- Verify tables were created
SELECT 'Tables created successfully!' as status;
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename IN ('public_groups', 'user_group_memberships', 'group_invitations');
