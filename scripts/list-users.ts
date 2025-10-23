import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

// Load environment variables from .env.local
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
dotenv.config({ path: join(__dirname, '../.env.local') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Error: Missing Supabase credentials in .env.local')
  console.error('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set')
  process.exit(1)
}

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
