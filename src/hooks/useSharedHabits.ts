import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface SharedHabit {
  id: string
  habit_id: string
  owner_id: string
  invited_user_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  habit?: {
    id: string
    name: string
    color: string | null
    category: string
  }
  owner?: {
    id: string
    display_name: string | null
    photo_url: string | null
  }
  invited_user?: {
    id: string
    display_name: string | null
    photo_url: string | null
  }
}

export function useSharedHabits() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get habits I've shared with others (I'm the owner)
  const { data: sharedByMe, isLoading: loadingSharedByMe } = useQuery({
    queryKey: ['shared-habits-by-me', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_habits')
        .select('*')
        .eq('owner_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch habit and invited user details
      const sharedWithDetails = await Promise.all(
        (data || []).map(async (share) => {
          const [habitData, userData] = await Promise.all([
            supabase
              .from('habits')
              .select('id, name, color, category')
              .eq('id', share.habit_id)
              .single(),
            supabase
              .from('profiles')
              .select('id, display_name, photo_url')
              .eq('id', share.invited_user_id)
              .single()
          ])

          return {
            ...share,
            habit: habitData.data,
            invited_user: userData.data
          }
        })
      )

      return sharedWithDetails as SharedHabit[]
    },
    enabled: !!user,
  })

  // Get habits shared with me (I'm invited)
  const { data: sharedWithMe, isLoading: loadingSharedWithMe } = useQuery({
    queryKey: ['shared-habits-with-me', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_habits')
        .select('*')
        .eq('invited_user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch habit and owner details
      const sharedWithDetails = await Promise.all(
        (data || []).map(async (share) => {
          const [habitData, userData] = await Promise.all([
            supabase
              .from('habits')
              .select('id, name, color, category')
              .eq('id', share.habit_id)
              .single(),
            supabase
              .from('profiles')
              .select('id, display_name, photo_url')
              .eq('id', share.owner_id)
              .single()
          ])

          return {
            ...share,
            habit: habitData.data,
            owner: userData.data
          }
        })
      )

      return sharedWithDetails as SharedHabit[]
    },
    enabled: !!user,
  })

  // Share a habit with a user
  const shareHabitMutation = useMutation({
    mutationFn: async ({ habitId, userId }: { habitId: string; userId: string }) => {
      const { error } = await supabase
        .from('shared_habits')
        .insert({
          habit_id: habitId,
          owner_id: user!.id,
          invited_user_id: userId,
          status: 'pending'
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-habits-by-me'] })
    },
  })

  // Accept a shared habit invite
  const acceptInviteMutation = useMutation({
    mutationFn: async (sharedHabitId: string) => {
      const { error } = await supabase
        .from('shared_habits')
        .update({ status: 'accepted' })
        .eq('id', sharedHabitId)
        .eq('invited_user_id', user!.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-habits-with-me'] })
    },
  })

  // Decline a shared habit invite
  const declineInviteMutation = useMutation({
    mutationFn: async (sharedHabitId: string) => {
      const { error } = await supabase
        .from('shared_habits')
        .update({ status: 'declined' })
        .eq('id', sharedHabitId)
        .eq('invited_user_id', user!.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-habits-with-me'] })
    },
  })

  // Unshare a habit (owner removes the share)
  const unshareHabitMutation = useMutation({
    mutationFn: async (sharedHabitId: string) => {
      const { error } = await supabase
        .from('shared_habits')
        .delete()
        .eq('id', sharedHabitId)
        .eq('owner_id', user!.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['shared-habits-by-me'] })
    },
  })

  // Get accepted shared habits (for displaying in shared habits view)
  const { data: acceptedSharedHabits, isLoading: loadingAcceptedShared } = useQuery({
    queryKey: ['accepted-shared-habits', user?.id],
    queryFn: async () => {
      // Get habits where I'm either the owner or invited user and status is accepted
      const { data, error } = await supabase
        .from('shared_habits')
        .select('*')
        .eq('status', 'accepted')
        .or(`owner_id.eq.${user!.id},invited_user_id.eq.${user!.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch habit details, owner details, and all participants
      const sharedWithDetails = await Promise.all(
        (data || []).map(async (share) => {
          const [habitData, ownerData] = await Promise.all([
            supabase
              .from('habits')
              .select('id, name, color, category')
              .eq('id', share.habit_id)
              .single(),
            supabase
              .from('profiles')
              .select('id, display_name, photo_url')
              .eq('id', share.owner_id)
              .single()
          ])

          // Get all users sharing this habit
          const { data: allShares } = await supabase
            .from('shared_habits')
            .select('invited_user_id')
            .eq('habit_id', share.habit_id)
            .eq('status', 'accepted')

          const participantIds = [
            share.owner_id,
            ...((allShares || []).map((s) => s.invited_user_id))
          ]

          return {
            ...share,
            habit: habitData.data,
            owner: ownerData.data,
            participant_ids: participantIds
          }
        })
      )

      return sharedWithDetails as SharedHabit[]
    },
    enabled: !!user,
  })

  // Real-time subscription for shared habit updates
  useEffect(() => {
    if (!user) return

    const sharedHabitsChannel = supabase
      .channel('shared-habits-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_habits',
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['shared-habits-by-me'] })
          queryClient.invalidateQueries({ queryKey: ['accepted-shared-habits'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_habits',
          filter: `invited_user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['shared-habits-with-me'] })
          queryClient.invalidateQueries({ queryKey: ['accepted-shared-habits'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(sharedHabitsChannel)
    }
  }, [user, queryClient])

  return {
    sharedByMe,
    sharedWithMe,
    acceptedSharedHabits,
    loadingSharedByMe,
    loadingSharedWithMe,
    loadingAcceptedShared,
    shareHabit: shareHabitMutation.mutateAsync,
    acceptInvite: acceptInviteMutation.mutateAsync,
    declineInvite: declineInviteMutation.mutateAsync,
    unshareHabit: unshareHabitMutation.mutateAsync,
  }
}
