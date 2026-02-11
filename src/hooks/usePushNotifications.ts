import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import {
  isPushSupported,
  isIOSPushSupported,
  getPermissionState,
  subscribeToPush,
  unsubscribeFromPush,
  ensureNotificationPreferences,
} from '@/lib/pushNotifications'

export interface NotificationPreferences {
  push_enabled: boolean
  push_habit_reminders: boolean
  push_social_activity: boolean
  push_challenge_updates: boolean
  push_shared_habits: boolean
  push_achievements: boolean
  reminder_time: string
  reminder_timezone: string
}

export function usePushNotifications() {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  const supported = isPushSupported()
  const iosPushSupported = isIOSPushSupported()
  const permissionState = supported ? getPermissionState() : 'denied' as NotificationPermission

  const { data: preferences, isLoading } = useQuery({
    queryKey: ['notification-preferences', user?.id],
    queryFn: async () => {
      await ensureNotificationPreferences(user!.id)
      const { data, error } = await supabase
        .from('notification_preferences')
        .select('*')
        .eq('user_id', user!.id)
        .single()
      if (error) throw error
      return data as unknown as NotificationPreferences
    },
    enabled: !!user,
  })

  const { data: subscriptionCount } = useQuery({
    queryKey: ['push-subscription-count', user?.id],
    queryFn: async () => {
      const { count, error } = await supabase
        .from('push_subscriptions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user!.id)
      if (error) throw error
      return count || 0
    },
    enabled: !!user,
  })

  const subscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')
      return subscribeToPush(user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-subscription-count'] })
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
  })

  const unsubscribeMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Not authenticated')
      return unsubscribeFromPush(user.id)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['push-subscription-count'] })
    },
  })

  const updatePreferencesMutation = useMutation({
    mutationFn: async (updates: Partial<NotificationPreferences>) => {
      if (!user) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('notification_preferences')
        .update(updates)
        .eq('user_id', user.id)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-preferences'] })
    },
  })

  return {
    supported,
    iosPushSupported,
    permissionState,
    preferences,
    subscriptionCount: subscriptionCount || 0,
    isLoading,
    subscribe: subscribeMutation.mutateAsync,
    unsubscribe: unsubscribeMutation.mutateAsync,
    updatePreferences: updatePreferencesMutation.mutateAsync,
    isSubscribing: subscribeMutation.isPending,
  }
}
