import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkjbwpqvxtmkwwanhfar.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM5MjcyMywiZXhwIjoyMDc0OTY4NzIzfQ.k5Qo396_jeJr6GIyn8UppPkiDU5XvEZANFblqSekZy8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function listNexgentUsers() {
  try {
    // Query profiles table with email filter
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, email, display_name, created_at')
      .ilike('email', '%@nexgent.com')
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log('\n=== Users with @nexgent.com emails ===\n')

    if (!profiles || profiles.length === 0) {
      console.log('No users found with @nexgent.com email addresses.')
      return
    }

    console.log(`Found ${profiles.length} user(s):\n`)

    profiles.forEach((user, index) => {
      console.log(`${index + 1}. ${user.display_name || 'No name'}`)
      console.log(`   Email: ${user.email}`)
      console.log(`   User ID: ${user.id}`)
      console.log(`   Created: ${new Date(user.created_at).toLocaleString()}`)
      console.log('')
    })

  } catch (error) {
    console.error('Error fetching users:', error.message)
  }
}

listNexgentUsers()
