import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Notification {
  id: string
  user_id: string
  type: 'follow' | 'recognition' | 'shared_habit_invite' | 'shared_habit_completion' | 'achievement' | 'challenge_invite'
  from_user_id: string | null
  content: string
  metadata: Record<string, any> | null
  read: boolean
  created_at: string
  from_user?: {
    id: string
    display_name: string | null
    photo_url: string | null
  }
}

export function useNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get all notifications
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Fetch profile data for each notification that has a from_user_id
      const notificationsWithProfiles = await Promise.all(
        (data || []).map(async (notification) => {
          if (notification.from_user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, photo_url')
              .eq('id', notification.from_user_id)
              .single()

            return {
              ...notification,
              from_user: profile,
            }
          }
          return notification
        })
      )

      return notificationsWithProfiles as Notification[]
    },
    enabled: !!user,
  })

  // Get unread count
  const { data: unreadCount } = useQuery({
    queryKey: ['notifications-unread-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
        .eq('read', false)

      if (error) throw error
      return count || 0
    },
    enabled: !!user,
  })

  // Mark notification as read
  const markAsReadMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  // Mark all as read
  const markAllAsReadMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user!.id)
        .eq('read', false)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  // Delete notification
  const deleteNotificationMutation = useMutation({
    mutationFn: async (notificationId: string) => {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
      queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
    },
  })

  return {
    notifications,
    unreadCount,
    isLoading,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
  }
}
