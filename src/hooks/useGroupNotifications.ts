import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface GroupNotifications {
  totalCount: number
  invitationsCount: number
  newMessagesCount: number
  isLoading: boolean
}

export function useGroupNotifications(): GroupNotifications {
  const { user } = useAuth()

  // Get pending group invitations count
  const { data: invitationsCount = 0, isLoading: loadingInvitations } = useQuery({
    queryKey: ['group-notifications-invitations', user?.id],
    queryFn: async () => {
      if (!user) return 0

      const { count } = await supabase
        .from('group_invitations' as any)
        .select('*', { count: 'exact', head: true })
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')

      return count || 0
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  // Get new discussion messages count (since last visit)
  const { data: newMessagesCount = 0, isLoading: loadingMessages } = useQuery({
    queryKey: ['group-notifications-messages', user?.id],
    queryFn: async () => {
      if (!user) return 0

      // Get last visit timestamp from localStorage
      const lastVisit = localStorage.getItem('groups_last_visit')
      const lastVisitDate = lastVisit ? new Date(lastVisit) : new Date(0)

      // Get groups user is a member of
      const { data: memberships } = await supabase
        .from('user_group_memberships' as any)
        .select('group_id')
        .eq('user_id', user.id)

      if (!memberships || memberships.length === 0) return 0

      const groupIds = (memberships as any).map((m: any) => m.group_id)

      // Count new discussions in user's groups since last visit
      const { count } = await supabase
        .from('group_discussions' as any)
        .select('*', { count: 'exact', head: true })
        .in('group_id', groupIds)
        .gt('created_at', lastVisitDate.toISOString())
        .neq('user_id', user.id) // Exclude own messages

      return count || 0
    },
    enabled: !!user,
    refetchInterval: 30000, // Refetch every 30 seconds
  })

  const totalCount = invitationsCount + newMessagesCount
  const isLoading = loadingInvitations || loadingMessages

  return {
    totalCount,
    invitationsCount,
    newMessagesCount,
    isLoading,
  }
}

// Helper function to mark groups as visited (call this when user navigates to /groups)
export function markGroupsAsVisited() {
  localStorage.setItem('groups_last_visit', new Date().toISOString())
}
