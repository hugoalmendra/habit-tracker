import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkjbwpqvxtmkwwanhfar.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTI3MjMsImV4cCI6MjA3NDk2ODcyM30.QFmLAwjNgRTDLEtXi6OvVMj4hx0EL0_V9APqUpfEL_g'

// Create a client using the anon key (same as frontend)
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRLS() {
  try {
    console.log('Testing RLS with anon key (no auth.uid())...\n')

    const groupId = 'a2e1cb2d-7ffc-4494-ad6a-8a3f03c3ff42'

    // Test 1: Query as unauthenticated user
    console.log('--- Test 1: Unauthenticated user (no login) ---')
    const { data: unauthMembers, error: unauthError } = await supabase
      .from('user_group_memberships')
      .select('*')
      .eq('group_id', groupId)

    console.log('Members visible (unauthenticated):', unauthMembers?.length || 0)
    if (unauthError) {
      console.log('Error:', unauthError.message)
    }

    // Test 2: Check if we can see the group itself
    console.log('\n--- Test 2: Can we see the public_groups table? ---')
    const { data: groups, error: groupError } = await supabase
      .from('public_groups')
      .select('id, name, is_private')
      .eq('id', groupId)
      .single()

    console.log('Group visible:', groups ? 'Yes' : 'No')
    if (groups) {
      console.log('Group name:', groups.name)
      console.log('Is private:', groups.is_private)
    }
    if (groupError) {
      console.log('Error:', groupError.message)
    }

    // Test 3: Check what the RLS policy sees
    console.log('\n--- Test 3: Testing the specific RLS query ---')
    const { data: policyTest, error: policyError } = await supabase
      .from('public_groups')
      .select('id')
      .eq('id', groupId)
      .eq('is_private', false)

    console.log('Policy test (is_private = false):', policyTest ? 'Pass' : 'Fail')
    if (policyError) {
      console.log('Error:', policyError.message)
    }

    // Conclusion
    console.log('\n=== CONCLUSION ===')
    if (!groups) {
      console.log('❌ The anon key cannot see the public_groups table at all!')
      console.log('This suggests a more fundamental RLS issue.')
    } else if (unauthMembers && unauthMembers.length === 22) {
      console.log('✅ RLS is working! All 22 members are visible.')
    } else {
      console.log(`⚠️  RLS is limiting visibility to ${unauthMembers?.length || 0} members`)
      console.log('Expected: 22 members')
      console.log('\nThe select_public_group_memberships policy may not be working correctly.')
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

testRLS()
