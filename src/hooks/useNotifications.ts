import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Notification {
  id: string
  user_id: string
  type: 'follow' | 'recognition' | 'shared_habit_invite' | 'shared_habit_completion' | 'achievement' | 'challenge_invite' | 'post_reaction' | 'post_comment'
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

const NOTIFICATIONS_PER_PAGE = 15

export function useNotifications() {
  const queryClient = useQueryClient()
  const { user } = useAuth()
  const [page, setPage] = useState(0)
  const [allNotifications, setAllNotifications] = useState<Notification[]>([])
  const [hasMore, setHasMore] = useState(true)

  // Get notifications with pagination
  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications', user?.id, page],
    queryFn: async () => {
      const offset = page * NOTIFICATIONS_PER_PAGE

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .range(offset, offset + NOTIFICATIONS_PER_PAGE - 1)

      if (error) throw error

      // Check if we have more notifications
      if (data.length < NOTIFICATIONS_PER_PAGE) {
        setHasMore(false)
      }

      // Fetch profile data for each notification that has a from_user_id
      const notificationsWithProfiles = await Promise.all(
        (data || []).map(async (notification) => {
          if (notification.from_user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, photo_url')
              .eq('id', notification.from_user_id)
              .maybeSingle()

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

  // Update allNotifications when new data comes in
  useEffect(() => {
    if (notifications) {
      if (page === 0) {
        setAllNotifications(notifications)
      } else {
        setAllNotifications(prev => [...prev, ...notifications])
      }
    }
  }, [notifications, page])

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

  // Real-time subscription for new notifications
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          // Reset to first page and invalidate queries when notifications change
          setPage(0)
          setHasMore(true)
          queryClient.invalidateQueries({ queryKey: ['notifications'] })
          queryClient.invalidateQueries({ queryKey: ['notifications-unread-count'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, queryClient])

  // Load more function
  const loadMore = () => {
    if (!isLoading && hasMore) {
      setPage(prev => prev + 1)
    }
  }

  return {
    notifications: allNotifications,
    unreadCount,
    isLoading,
    hasMore,
    loadMore,
    markAsRead: markAsReadMutation.mutateAsync,
    markAllAsRead: markAllAsReadMutation.mutateAsync,
    deleteNotification: deleteNotificationMutation.mutateAsync,
  }
}
