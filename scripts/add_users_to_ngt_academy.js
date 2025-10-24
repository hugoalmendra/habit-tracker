import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkjbwpqvxtmkwwanhfar.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM5MjcyMywiZXhwIjoyMDc0OTY4NzIzfQ.k5Qo396_jeJr6GIyn8UppPkiDU5XvEZANFblqSekZy8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function addUsersToNGTAcademy() {
  try {
    // Find NGT Academy group
    const { data: group, error: groupError } = await supabase
      .from('public_groups')
      .select('id, name')
      .ilike('name', '%NGT Academy%')
      .single()

    if (groupError) {
      console.error('Error finding NGT Academy group:', groupError.message)
      return
    }

    if (!group) {
      console.log('NGT Academy group not found')
      return
    }

    console.log(`\nFound group: ${group.name}`)
    console.log(`Group ID: ${group.id}\n`)

    // Get all @nexgent.com users except hugo@nexgent.com
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .ilike('email', '%@nexgent.com')
      .neq('email', 'hugo@nexgent.com')

    if (usersError) throw usersError

    console.log(`Found ${users.length} users to add\n`)

    // Check who's already a member
    const { data: existingMembers, error: membersError } = await supabase
      .from('user_group_memberships')
      .select('user_id')
      .eq('group_id', group.id)
      .in('user_id', users.map(u => u.id))

    if (membersError) throw membersError

    const existingUserIds = new Set(existingMembers?.map(m => m.user_id) || [])
    const usersToAdd = users.filter(u => !existingUserIds.has(u.id))

    console.log(`${existingUserIds.size} user(s) already members`)
    console.log(`${usersToAdd.length} user(s) to add\n`)

    if (usersToAdd.length === 0) {
      console.log('All users are already members of NGT Academy!')
      return
    }

    // Add users to the group
    const memberships = usersToAdd.map(user => ({
      group_id: group.id,
      user_id: user.id,
      role: 'member',
      joined_at: new Date().toISOString()
    }))

    const { data: inserted, error: insertError } = await supabase
      .from('user_group_memberships')
      .insert(memberships)
      .select()

    if (insertError) {
      console.error('Error adding users:', insertError.message)
      return
    }

    console.log('✅ Successfully added users to NGT Academy:\n')
    usersToAdd.forEach((user, index) => {
      console.log(`${index + 1}. ${user.display_name || 'No name'} (${user.email})`)
    })

    console.log(`\nTotal: ${usersToAdd.length} user(s) added to NGT Academy`)

  } catch (error) {
    console.error('Error:', error.message)
  }
}

addUsersToNGTAcademy()
