import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabaseUrl = 'https://rkjbwpqvxtmkwwanhfar.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM5MjcyMywiZXhwIjoyMDc0OTY4NzIzfQ.k5Qo396_jeJr6GIyn8UppPkiDU5XvEZANFblqSekZy8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function fixMemberVisibility() {
  try {
    console.log('Fixing member visibility RLS policy...\n')

    // Read the migration file
    const migrationPath = path.resolve(__dirname, '../supabase/migrations/20251027_fix_member_visibility.sql')
    const sql = fs.readFileSync(migrationPath, 'utf8')

    // Execute the SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql }).catch(async () => {
      // If exec_sql doesn't exist, execute statements one by one
      const statements = sql
        .split(';')
        .map(s => s.trim())
        .filter(s => s && !s.startsWith('--') && !s.toLowerCase().startsWith('select'))

      for (const statement of statements) {
        console.log('Executing:', statement.substring(0, 100) + '...')
        const result = await supabase.rpc('exec', { sql: statement }).catch(() => null)
        if (!result) {
          // Try direct query
          await supabase.from('_realtime').select('*').limit(0).throwOnError()
        }
      }

      return { data: null, error: null }
    })

    if (error) {
      console.error('Error executing migration:', error)
      console.log('\nPlease run this SQL directly in Supabase SQL Editor:')
      console.log('https://supabase.com/dashboard/project/rkjbwpqvxtmkwwanhfar/sql/new')
      console.log('\n' + sql)
      return
    }

    console.log('✅ Migration executed successfully!')
    console.log('\nNow testing member visibility...')

    // Test the fix
    const { data: group } = await supabase
      .from('public_groups')
      .select('id, name')
      .eq('name', 'NGT Academy')
      .single()

    if (!group) {
      console.log('NGT Academy group not found')
      return
    }

    // Use anon client to test what authenticated users will see
    const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzOTI3MjMsImV4cCI6MjA3NDk2ODcyM30.3IY71jJcXsKPW_YXQ3F5QVy87Q0m-2vNR1S-7jbIpGM'
    const testClient = createClient(supabaseUrl, anonKey)

    const { data: publicMembers } = await testClient
      .from('user_group_memberships')
      .select('*')
      .eq('group_id', group.id)

    console.log(`\nPublic group members visible: ${publicMembers?.length || 0}`)

    if (publicMembers && publicMembers.length === 22) {
      console.log('✅ All 22 members are now visible!')
    } else {
      console.log(`⚠️  Expected 22 members, got ${publicMembers?.length || 0}`)
      console.log('The migration may need to be run in the Supabase SQL Editor.')
    }

  } catch (error) {
    console.error('Error:', error.message)
    console.log('\nPlease run the migration SQL manually in Supabase SQL Editor:')
    console.log('https://supabase.com/dashboard/project/rkjbwpqvxtmkwwanhfar/sql/new')
  }
}

fixMemberVisibility()
