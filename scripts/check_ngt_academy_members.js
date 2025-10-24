import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkjbwpqvxtmkwwanhfar.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM5MjcyMywiZXhwIjoyMDc0OTY4NzIzfQ.k5Qo396_jeJr6GIyn8UppPkiDU5XvEZANFblqSekZy8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function checkNGTAcademyMembers() {
  try {
    // Find NGT Academy group
    const { data: group, error: groupError } = await supabase
      .from('public_groups')
      .select('id, name')
      .ilike('name', '%NGT Academy%')
      .single()

    if (groupError) throw groupError

    console.log(`\nGroup: ${group.name}`)
    console.log(`Group ID: ${group.id}\n`)

    // Get all members
    const { data: members, error: membersError } = await supabase
      .from('user_group_memberships')
      .select('user_id, role, joined_at')
      .eq('group_id', group.id)
      .order('joined_at', { ascending: false })

    if (membersError) throw membersError

    console.log(`Total members: ${members?.length || 0}\n`)

    if (members && members.length > 0) {
      // Get user profiles separately
      const userIds = members.map(m => m.user_id)
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, display_name')
        .in('id', userIds)

      members.forEach((member, index) => {
        const profile = profiles?.find(p => p.id === member.user_id)
        console.log(`${index + 1}. ${profile?.display_name || 'Unknown'}`)
        console.log(`   Email: ${profile?.email || 'No email'}`)
        console.log(`   Role: ${member.role}`)
        console.log(`   Joined: ${new Date(member.joined_at).toLocaleString()}`)
        console.log('')
      })
    } else {
      console.log('No members found!')
    }

  } catch (error) {
    console.error('Error:', error.message)
  }
}

checkNGTAcademyMembers()
