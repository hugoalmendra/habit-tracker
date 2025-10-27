import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkjbwpqvxtmkwwanhfar.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM5MjcyMywiZXhwIjoyMDc0OTY4NzIzfQ.k5Qo396_jeJr6GIyn8UppPkiDU5XvEZANFblqSekZy8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkRLSPolicies() {
  try {
    // Test with anon key to see if we can read all members
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTI3MjMsImV4cCI6MjA3NDk2ODcyM30.3IY71jJcXsKPW_YXQ3F5QVy87Q0m-2vNR1S-7jbIpGM'
    const anonClient = createClient(supabaseUrl, anonKey)

    console.log('\nTesting with anon key (frontend perspective)...\n')

    // Find NGT Academy group using service key first
    const { data: group } = await supabase
      .from('public_groups')
      .select('id, name, is_private')
      .eq('name', 'NGT Academy')
      .single()

    console.log('Group:', group?.name)
    console.log('Group ID:', group?.id)
    console.log('Is Private:', group?.is_private)

    // Try to fetch members with anon key (no auth)
    console.log('\n--- Test 1: Anon key (no authentication) ---')
    const { data: anonMembers, error: anonError } = await anonClient
      .from('user_group_memberships')
      .select('*')
      .eq('group_id', group.id)

    console.log('\nMembers visible with anon key:', anonMembers?.length || 0)

    if (anonError) {
      console.log('Error with anon key:', anonError.message)
    }

    if (anonMembers && anonMembers.length < 22) {
      console.log('\n⚠️  RLS is limiting what anon users can see!')
      console.log('Expected 22 members, but anon key can only see:', anonMembers.length)
      console.log('\nThis is likely the issue! RLS policies need to be updated.')
    } else if (anonMembers && anonMembers.length === 22) {
      console.log('\n✅ All members are visible with anon key')
      console.log('RLS is working correctly. The issue must be elsewhere.')
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkRLSPolicies()
