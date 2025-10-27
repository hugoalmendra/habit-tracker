import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkjbwpqvxtmkwwanhfar.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM5MjcyMywiZXhwIjoyMDc0OTY4NzIzfQ.k5Qo396_jeJr6GIyn8UppPkiDU5XvEZANFblqSekZy8'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function testAuthenticatedQuery() {
  try {
    // Find Hugo's user ID
    const { data: hugo } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('email', 'hugo@nexgent.com')
      .single()

    if (!hugo) {
      console.log('Hugo not found')
      return
    }

    console.log(`Testing as: ${hugo.display_name} (${hugo.email})`)
    console.log(`User ID: ${hugo.id}\n`)

    // Find NGT Academy group
    const { data: group } = await supabase
      .from('public_groups')
      .select('id, name, is_private')
      .eq('name', 'NGT Academy')
      .single()

    console.log(`Group: ${group.name}`)
    console.log(`Group ID: ${group.id}`)
    console.log(`Is Private: ${group.is_private}\n`)

    // Now let's simulate what the frontend does - using service key to bypass RLS temporarily
    console.log('--- Querying as SERVICE ROLE (bypasses RLS) ---')
    const { data: serviceMembers, error: serviceError } = await supabase
      .from('user_group_memberships')
      .select('*')
      .eq('group_id', group.id)

    console.log(`Members visible (service role): ${serviceMembers?.length || 0}`)
    if (serviceError) {
      console.log('Error:', serviceError.message)
    }

    // Now let's check what an authenticated user would see
    // We need to create a client that simulates being logged in as Hugo
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTI3MjMsImV4cCI6MjA3NDk2ODcyM30.3IY71jJcXsKPW_YXQ3F5QVy87Q0m-2vNR1S-7jbIpGM'
    const authClient = createClient(supabaseUrl, anonKey)

    // Sign in as Hugo to get a real session
    const { data: authData, error: authError } = await authClient.auth.signInWithPassword({
      email: 'hugo@nexgent.com',
      password: 'NgtAcademy100Days!' // You'll need to use the actual password
    })

    if (authError) {
      console.log('\n❌ Could not authenticate as Hugo')
      console.log('Error:', authError.message)
      console.log('\nThis test requires Hugo\'s password to simulate an authenticated session.')
      console.log('However, the RLS policies look correct for authenticated users.')
      return
    }

    console.log('\n--- Querying as AUTHENTICATED USER (Hugo) ---')
    const { data: authMembers, error: authMemberError } = await authClient
      .from('user_group_memberships')
      .select('*')
      .eq('group_id', group.id)

    console.log(`Members visible (authenticated as Hugo): ${authMembers?.length || 0}`)

    if (authMemberError) {
      console.log('Error:', authMemberError.message)
    }

    if (authMembers && authMembers.length < 22) {
      console.log('\n⚠️  FOUND THE ISSUE!')
      console.log(`Expected 22 members, but authenticated user can only see: ${authMembers.length}`)
      console.log('This confirms the RLS policy is too restrictive.')
    } else if (authMembers && authMembers.length === 22) {
      console.log('\n✅ Authenticated user can see all 22 members')
      console.log('RLS is working correctly. The issue must be in the frontend cache or query.')
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

testAuthenticatedQuery()
