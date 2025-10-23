import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkjbwpqvxtmkwwanhfar.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTI3MjMsImV4cCI6MjA3NDk2ODcyM30.QFmLAwjNgRTDLEtXi6OvVMj4hx0EL0_V9APqUpfEL_g'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function listUsers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, display_name, created_at')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching users:', error)
    return
  }

  console.log(`\nTotal users: ${data?.length || 0}\n`)
  console.log('ID                                   | Email                          | Display Name           | Created At')
  console.log('─'.repeat(120))

  data?.forEach((user) => {
    const id = user.id.slice(0, 36).padEnd(36)
    const email = (user.email || 'N/A').slice(0, 30).padEnd(30)
    const displayName = (user.display_name || 'N/A').slice(0, 22).padEnd(22)
    const createdAt = new Date(user.created_at).toLocaleString()

    console.log(`${id} | ${email} | ${displayName} | ${createdAt}`)
  })
}

listUsers()
