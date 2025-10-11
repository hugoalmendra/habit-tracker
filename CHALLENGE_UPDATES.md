# Challenge System Updates

## Summary of Changes

This update implements a comprehensive challenge system with the following features:

### 1. UI Changes
- ✅ Merged "My Challenges" and "Joined" tabs into a single "Joined" tab
- ✅ Added "Join Challenge" button for public challenges that users haven't joined
- ✅ Added challenge badge (Trophy icon) to habit cards linked to challenges
- ✅ Disabled edit/delete buttons for challenge-linked habits (they're auto-managed)

### 2. Database Changes (Migrations Required)

Three new migrations have been created that need to be applied to your Supabase database:

#### Migration 1: `allow_participants_invite_public.sql`
**Purpose**: Allow participants to invite others to public challenges
- Drops old policy that only allowed creators to invite
- Creates new policy allowing:
  - Creators to invite anyone to their challenges
  - Participants to invite others to PUBLIC challenges only
- Adds policy for users to join public challenges directly

#### Migration 2: `add_challenge_id_to_habits.sql`
**Purpose**: Link habits to challenges and auto-manage habit lifecycle
- Adds `challenge_id` column to habits table
- Creates trigger to auto-create habit card when joining a challenge
- Creates trigger to auto-delete habit card when challenge is completed
- Challenge habits use the challenge's name, description, category, and color

#### Migration 3: `update_private_challenge_policies.sql`
**Purpose**: Properly restrict access to private challenges
- Updates view policies so private challenges are only visible to:
  - The creator
  - Users who have been invited
- Public challenges remain visible to everyone

### 3. Behavior Changes

**Public Challenges:**
- Anyone can see and join public challenges
- When joining, a habit card is automatically created on their dashboard
- Participants can invite others to public challenges
- Habit card shows "Challenge" badge with trophy icon
- Challenge habit cannot be edited or deleted manually
- When challenge is completed, the habit card is automatically removed

**Private Challenges:**
- Only visible to creator and invited users
- Only the creator can invite people
- Invitees must accept invitation to join
- Same auto-habit behavior as public challenges

**Join Flow:**
1. User clicks "Join Challenge" button
2. User is added as participant with 'accepted' status
3. Habit card is automatically created on dashboard
4. User can now mark completions for the challenge
5. When challenge target is reached, habit card is automatically removed and badge is earned

## How to Apply Migrations

Since `psql` is not installed on your system, you'll need to apply these migrations manually. Here are your options:

### Option 1: Supabase Dashboard (Recommended)
1. Go to your Supabase project dashboard
2. Navigate to "SQL Editor"
3. Run each migration file in order:
   - First: `supabase/migrations/allow_participants_invite_public.sql`
   - Second: `supabase/migrations/add_challenge_id_to_habits.sql`
   - Third: `supabase/migrations/update_private_challenge_policies.sql`

### Option 2: Install PostgreSQL Client
```bash
brew install postgresql
```

Then run:
```bash
psql "postgresql://postgres.xcpxwscipwnycpjjbxza:HjemKode2024!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/allow_participants_invite_public.sql
psql "postgresql://postgres.xcpxwscipwnycpjjbxza:HjemKode2024!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/add_challenge_id_to_habits.sql
psql "postgresql://postgres.xcpxwscipwnycpjjbxza:HjemKode2024!@aws-0-eu-central-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/update_private_challenge_policies.sql
```

### Option 3: Supabase CLI (if linked)
First, link your project:
```bash
npx supabase link --project-ref xcpxwscipwnycpjjbxza
```

Then push migrations:
```bash
npx supabase db push
```

## Testing Checklist

After applying migrations, test the following:

- [ ] Create a new public challenge
- [ ] Verify habit card is automatically created for the creator
- [ ] Join a public challenge as another user
- [ ] Verify habit card is created with "Challenge" badge
- [ ] Mark completions on challenge habit
- [ ] Complete a challenge and verify habit card is removed
- [ ] Create a private challenge
- [ ] Verify private challenge is only visible to creator and invitees
- [ ] Verify only creator can invite to private challenges
- [ ] Verify participants can invite to public challenges
- [ ] Try to edit/delete a challenge habit (should not show buttons)

## Files Modified

- `src/pages/Challenges.tsx` - Updated tab UI and added Join button
- `src/components/habits/HabitCard.tsx` - Added challenge badge and disabled edit/delete for challenge habits
- `src/hooks/useChallenges.ts` - Added `joinChallenge` mutation
- `supabase/migrations/allow_participants_invite_public.sql` - New migration
- `supabase/migrations/add_challenge_id_to_habits.sql` - New migration
- `supabase/migrations/update_private_challenge_policies.sql` - New migration
