import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkjbwpqvxtmkwwanhfar.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM5MjcyMywiZXhwIjoyMDc0OTY4NzIzfQ.k5Qo396_jeJr6GIyn8UppPkiDU5XvEZANFblqSekZy8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkGroupSettings() {
  try {
    const { data: group, error } = await supabase
      .from('public_groups')
      .select('*')
      .ilike('name', '%NGT Academy%')
      .single()

    if (error) throw error

    console.log('\nNGT Academy Group Settings:')
    console.log('============================')
    console.log('ID:', group.id)
    console.log('Name:', group.name)
    console.log('Is Private:', group.is_private)
    console.log('Created By:', group.created_by)
    console.log('Created At:', new Date(group.created_at).toLocaleString())
    console.log('Description:', group.description || 'No description')
    console.log('\n')

  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkGroupSettings()
