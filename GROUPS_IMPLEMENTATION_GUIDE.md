# Group Stats & Discussions Implementation Guide

## Overview
This guide explains the new features added to groups:
1. **Group Statistics** - Displays comprehensive stats about group activity
2. **Discussion Feature** - Chat-like messaging system replacing the "Recent Activity" section

## What's Been Implemented

### ✅ Components Created
1. **GroupStatsCard** (`src/components/groups/GroupStatsCard.tsx`)
   - Displays total completions
   - Shows group streak (consecutive days with activity)
   - Average completions per member
   - Weekly trend (this week vs last week)
   - Top 3 most active members with their completion counts

2. **GroupDiscussions** (`src/components/groups/GroupDiscussions.tsx`)
   - Chat-like message interface
   - Post new messages
   - Edit/delete own messages
   - Like/react to messages
   - Admin features: pin/unpin messages, delete any message
   - Shows edited status and timestamps

### ✅ Hooks Created
1. **useGroupStats** (`src/hooks/useGroupStats.ts`)
   - Fetches and calculates all group statistics
   - Tracks member activity
   - Calculates streaks and trends

2. **useGroupDiscussions** (`src/hooks/useGroupDiscussions.ts`)
   - Full CRUD operations for discussions
   - Reaction management (add/remove likes)
   - Pin/unpin functionality for admins

### ✅ Database Migration
File: `supabase/migrations/20251024000000_create_group_discussions.sql`

Creates two new tables:
- `group_discussions` - stores chat messages
- `discussion_reactions` - stores likes/reactions on messages

## 🚨 REQUIRED: Apply Database Migration

Before the features will work, you MUST apply the database migration. Here's how:

### Option 1: Using Supabase Dashboard (Recommended)
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **SQL Editor**
4. Copy the contents of `supabase/migrations/20251024000000_create_group_discussions.sql`
5. Paste into the SQL editor
6. Click **Run**

### Option 2: Using Supabase CLI (if local database)
```bash
npx supabase db reset
```

## Features Breakdown

### Group Stats
The stats card shows:

1. **Total Completions** - All habit completions by group members
2. **Group Streak** - Consecutive days where at least one member completed a habit
3. **Average per Member** - Total completions divided by member count
4. **Weekly Trend** - Compares this week's activity to last week with percentage change
5. **Most Active Members** - Top 3 members ranked by completion count

### Discussion Features

#### For All Members:
- ✅ Post new messages
- ✅ Edit their own messages
- ✅ Delete their own messages
- ✅ Like/unlike messages
- ✅ See who reacted to messages
- ✅ View timestamps and edited status

#### For Admins Only:
- ✅ Pin important messages (appear at top)
- ✅ Unpin messages
- ✅ Delete any member's message

### UI/UX Details
- Messages sorted by: Pinned first, then most recent
- Real-time reaction counts
- Visual indicators for pinned messages
- Edit history indicator ("edited" label)
- Keyboard shortcut: Cmd/Ctrl + Enter to send message
- Avatar and user profile display
- Responsive design for mobile and desktop

## Testing Checklist

Once the migration is applied, test these features:

### Stats Testing
- [ ] Visit a group detail page as a member
- [ ] Verify all stats display correctly
- [ ] Check that most active members show up
- [ ] Complete a habit and verify stats update

### Discussion Testing
- [ ] Post a new message
- [ ] Edit your message
- [ ] Delete your message
- [ ] Like someone else's message
- [ ] Unlike a message
- [ ] (As admin) Pin a message
- [ ] (As admin) Unpin a message
- [ ] (As admin) Delete another member's message

## Deployment Steps

1. **Apply Migration** (see above)
2. **Commit Changes**
   ```bash
   git add .
   git commit -m "Add group stats and discussion features"
   ```
3. **Push to GitHub**
   ```bash
   git push origin main
   ```
4. **Deploy to Vercel** (automatic if connected)

## File Changes Summary

### New Files
- `src/components/groups/GroupStatsCard.tsx`
- `src/components/groups/GroupDiscussions.tsx`
- `src/hooks/useGroupStats.ts`
- `src/hooks/useGroupDiscussions.ts`
- `supabase/migrations/20251024000000_create_group_discussions.sql`

### Modified Files
- `src/pages/GroupDetail.tsx` - Integrated new components

## Database Schema

### group_discussions table
```sql
- id (uuid, primary key)
- group_id (uuid, foreign key → public_groups)
- user_id (uuid, foreign key → auth.users)
- content (text)
- is_pinned (boolean)
- created_at (timestamp)
- updated_at (timestamp)
```

### discussion_reactions table
```sql
- id (uuid, primary key)
- discussion_id (uuid, foreign key → group_discussions)
- user_id (uuid, foreign key → auth.users)
- reaction_type (text, default 'like')
- created_at (timestamp)
- UNIQUE constraint on (discussion_id, user_id, reaction_type)
```

## RLS Policies
All tables have proper Row Level Security policies:
- Members can only view discussions in groups they belong to
- Users can only edit/delete their own messages
- Admins can delete any message and pin/unpin messages
- Users can add/remove their own reactions

## Troubleshooting

### "Table does not exist" error
- The migration hasn't been applied yet
- Apply it via Supabase Dashboard SQL Editor

### Stats not updating
- Check that `habit_completions` table has data
- Verify group members are completing habits
- Check browser console for any API errors

### Can't post messages
- Verify you're a member of the group
- Check RLS policies were created correctly
- Look for errors in browser console

## Support
If you encounter issues:
1. Check browser console for errors
2. Verify migration was applied successfully
3. Test RLS policies in Supabase dashboard
4. Ensure user is authenticated and is a group member
