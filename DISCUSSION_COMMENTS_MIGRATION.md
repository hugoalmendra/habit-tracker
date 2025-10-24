# Discussion Comments Migration

## Overview
This migration adds commenting functionality to group discussions.

## Database Migration Required

**IMPORTANT:** You must manually apply this migration via Supabase Dashboard before the comment features will work.

### Migration File
`supabase/migrations/20251024100000_create_discussion_comments.sql`

### How to Apply

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Navigate to **SQL Editor**
4. Open the migration file: `supabase/migrations/20251024100000_create_discussion_comments.sql`
5. Copy the entire contents
6. Paste into the SQL editor
7. Click **Run**

### What This Migration Creates

**Table: `discussion_comments`**
- Stores comments on discussion posts
- Fields: id, discussion_id, user_id, content, created_at, updated_at
- Indexes for performance on discussion_id, user_id, created_at

**RLS Policies:**
- Members can view comments in their groups
- Members can create comments
- Users can update/delete their own comments
- Admins can delete any comment in their groups

**Triggers:**
- Automatically updates `updated_at` timestamp on edit

## Features Implemented

### 1. Fixed Avatar Display
- ✅ User avatars now properly display user photo from profiles table
- ✅ Fallback to user initials when no photo available

### 2. Comment Functionality
- ✅ Click comment button (MessageCircle icon) to expand/collapse comments
- ✅ Comment count displayed next to heart icon
- ✅ Add comments with keyboard shortcut (Cmd/Ctrl + Enter)
- ✅ Delete own comments
- ✅ Admins can delete any comment
- ✅ Comments show user avatar, name, and timestamp
- ✅ Comments sorted chronologically (oldest first)

### 3. Like Functionality
- ✅ Already implemented - heart icon to like/unlike posts
- ✅ Like count displayed
- ✅ Visual feedback when user has liked (filled heart, red color)

## UI Components Modified

### GroupDiscussions.tsx
- Added user profile loading for current user's avatar
- Added comment expansion state management
- Added comment button with count next to like button
- Created `DiscussionCommentsSection` component for comments UI
- Integrated with `useDiscussionComments` hook

### useGroupDiscussions.ts Hook
- Added `comment_count` to GroupDiscussion interface
- Created `DiscussionComment` interface
- Added comment count fetching in discussions query
- Created `useDiscussionComments` hook with:
  - `comments` - fetch all comments for a discussion
  - `createComment` - add new comment
  - `deleteComment` - remove comment
  - Loading states for all operations

## Testing Checklist

After applying the migration, test these features:

1. **Avatar Display**
   - [ ] User's own avatar shows correctly in new post input
   - [ ] Other users' avatars show correctly in discussions
   - [ ] Fallback initials work when no photo

2. **Likes**
   - [ ] Click heart to like a post
   - [ ] Heart fills and turns red when liked
   - [ ] Click again to unlike
   - [ ] Like count updates correctly

3. **Comments**
   - [ ] Click comment button to expand comment section
   - [ ] See comment input field and existing comments
   - [ ] Add a comment (text + click Send or Cmd/Ctrl+Enter)
   - [ ] Comment appears in list with your avatar and name
   - [ ] Comment count increases
   - [ ] Delete your own comment
   - [ ] As admin, delete someone else's comment
   - [ ] Click comment button again to collapse comments

4. **Permissions**
   - [ ] Can only delete your own comments (or all as admin)
   - [ ] Comments only visible to group members
   - [ ] Can't comment if not a group member

## Code Quality
- ✅ All TypeScript errors resolved
- ✅ Proper type definitions for comments
- ✅ Loading states handled
- ✅ Error handling with user-friendly messages
- ✅ Optimistic UI updates via React Query invalidation

## Next Steps

1. Apply the database migration (see above)
2. Test all features in development
3. Deploy to Vercel (or push changes if auto-deploy is enabled)
4. Test in production environment
