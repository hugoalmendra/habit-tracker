import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://rkjbwpqvxtmkwwanhfar.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJramJ3cHF2eHRta3d3YW5oZmFyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1OTM5MjcyMywiZXhwIjoyMDc0OTY4NzIzfQ.k5Qo396_jeJr6GIyn8UppPkiDU5XvEZANFblqSekZy8'

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function debugGroupMembers() {
  try {
    // Find NGT Academy group
    const { data: group, error: groupError } = await supabase
      .from('public_groups')
      .select('id, name')
      .eq('name', 'NGT Academy')
      .single()

    if (groupError) throw groupError
    if (!group) {
      console.log('NGT Academy group not found')
      return
    }

    console.log('Group found:', group.name)
    console.log('Group ID:', group.id)
    console.log('\nQuerying members exactly as the hook does...\n')

    // Query exactly as useGroupMembers does
    const { data: membersData, error } = await supabase
      .from('user_group_memberships')
      .select('*')
      .eq('group_id', group.id)
      .order('joined_at', { ascending: true })

    if (error) {
      console.error('Error fetching members:', error)
      return
    }

    console.log(`Total members from query: ${membersData?.length || 0}`)
    console.log('\nFetching profiles for each member...\n')

    // Fetch profiles exactly as the hook does
    const membersWithProfiles = await Promise.all(
      (membersData || []).map(async (member) => {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('id, display_name, photo_url')
          .eq('id', member.user_id)
          .maybeSingle()

        if (profileError) {
          console.error(`Error fetching profile for ${member.user_id}:`, profileError)
        }

        return {
          ...member,
          profile
        }
      })
    )

    console.log(`Members with profiles: ${membersWithProfiles.length}`)
    console.log('\nMembers list:')
    membersWithProfiles.forEach((member, index) => {
      console.log(`${index + 1}. ${member.profile?.display_name || 'Unknown'}`)
      console.log(`   User ID: ${member.user_id}`)
      console.log(`   Role: ${member.role}`)
      console.log(`   Profile loaded: ${member.profile ? 'Yes' : 'No'}`)
      console.log()
    })

  } catch (error) {
    console.error('Error:', error)
  }
}

debugGroupMembers()
