import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Challenge {
  id: string
  creator_id: string
  name: string
  description?: string
  category: 'Health' | 'Hustle' | 'Heart' | 'Harmony' | 'Happiness'
  start_date: string
  end_date: string
  target_type: 'daily_completion' | 'total_count' | 'streak'
  target_value: number
  badge_icon?: string
  badge_color?: string
  is_public: boolean
  created_at: string
  creator?: {
    display_name: string
    photo_url: string
  }
  participant_count?: number
  user_participation?: {
    status: 'invited' | 'accepted' | 'declined' | 'completed'
    current_progress: number
    current_streak: number
    badge_earned: boolean
  }
}

export interface ChallengeParticipant {
  id: string
  challenge_id: string
  user_id: string
  status: 'invited' | 'accepted' | 'declined' | 'completed'
  joined_at?: string
  completed_at?: string
  current_progress: number
  current_streak: number
  badge_earned: boolean
  user?: {
    display_name: string
    photo_url: string
  }
}

export interface ChallengeBadge {
  id: string
  user_id: string
  challenge_id: string
  badge_icon: string
  badge_color: string
  badge_name: string
  earned_at: string
}

export function useChallenges() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['challenges'],
    queryFn: async () => {
      // Get all challenges user can see
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch creator details and participant info for each challenge
      const challengesWithDetails = await Promise.all(
        (data || []).map(async (challenge) => {
          const [creatorData, participantCount, userParticipation] = await Promise.all([
            supabase
              .from('profiles')
              .select('display_name, photo_url')
              .eq('id', challenge.creator_id)
              .maybeSingle(),
            supabase
              .from('challenge_participants')
              .select('id', { count: 'exact', head: true })
              .eq('challenge_id', challenge.id)
              .in('status', ['accepted', 'completed']),
            supabase
              .from('challenge_participants')
              .select('status, current_progress, current_streak, badge_earned')
              .eq('challenge_id', challenge.id)
              .eq('user_id', user!.id)
              .maybeSingle()
          ])

          return {
            ...challenge,
            creator: creatorData.data,
            participant_count: participantCount.count || 0,
            user_participation: userParticipation.data
          }
        })
      )

      return challengesWithDetails as Challenge[]
    },
    enabled: !!user,
  })

  const createChallengeMutation = useMutation({
    mutationFn: async (input: {
      name: string
      description?: string
      category: string
      start_date: string
      end_date: string
      target_type: string
      target_value: number
      badge_icon?: string
      badge_color?: string
      is_public: boolean
    }) => {
      console.log('Creating challenge with input:', input)
      console.log('User ID:', user?.id)

      const { data, error } = await supabase
        .from('challenges')
        .insert({
          creator_id: user!.id,
          ...input,
        })
        .select()
        .maybeSingle()

      if (error) {
        console.error('Challenge creation error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('Challenge created successfully:', data)

      // Automatically add creator as a participant
      if (!data) throw new Error('Failed to create challenge')

      const { error: participantError } = await supabase
        .from('challenge_participants')
        .insert({
          challenge_id: data.id,
          user_id: user!.id,
          status: 'accepted',
          joined_at: new Date().toISOString(),
          current_progress: 0,
          current_streak: 0,
          badge_earned: false
        })

      if (participantError) {
        console.error('Error adding creator as participant:', participantError)
        // Don't throw - challenge was created successfully, this is just a bonus feature
      } else {
        console.log('Creator added as participant successfully')
      }

      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      queryClient.invalidateQueries({ queryKey: ['challenge-participants'] })
    },
    onError: (error) => {
      console.error('Challenge mutation error:', error)
    }
  })

  const inviteParticipantsMutation = useMutation({
    mutationFn: async ({ challengeId, userIds }: { challengeId: string; userIds: string[] }) => {
      console.log('Inviting participants:', { challengeId, userIds })

      const invites = userIds.map(userId => ({
        challenge_id: challengeId,
        user_id: userId,
        status: 'invited' as const
      }))

      console.log('Invite objects:', invites)

      const { data, error } = await supabase
        .from('challenge_participants')
        .insert(invites)
        .select()

      if (error) {
        console.error('Invite error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }

      console.log('Invites sent successfully:', data)
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
    },
    onError: (error) => {
      console.error('Invite mutation error:', error)
    }
  })

  const respondToInviteMutation = useMutation({
    mutationFn: async ({ challengeId, status }: { challengeId: string; status: 'accepted' | 'declined' }) => {
      const updateData: any = { status }
      if (status === 'accepted') {
        updateData.joined_at = new Date().toISOString()
      }

      const { error } = await supabase
        .from('challenge_participants')
        .update(updateData)
        .eq('challenge_id', challengeId)
        .eq('user_id', user!.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
    },
  })

  const recordCompletionMutation = useMutation({
    mutationFn: async (challengeId: string) => {
      const today = new Date().toISOString().split('T')[0]

      // Check if completion already exists for today
      const { data: existing } = await supabase
        .from('challenge_completions')
        .select('id')
        .eq('challenge_id', challengeId)
        .eq('user_id', user!.id)
        .eq('date', today)
        .maybeSingle()

      if (existing) {
        // Already completed today, do nothing
        return
      }

      // Insert new completion
      const { error } = await supabase
        .from('challenge_completions')
        .insert({
          challenge_id: challengeId,
          user_id: user!.id,
          date: today
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      queryClient.invalidateQueries({ queryKey: ['challenge-participants'] })
    },
  })

  // Real-time subscription for challenge updates
  useEffect(() => {
    if (!user) return

    const challengesChannel = supabase
      .channel('challenges-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenges',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['challenges'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_participants',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['challenges'] })
          queryClient.invalidateQueries({ queryKey: ['challenge-participants'] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'challenge_completions',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['challenges'] })
          queryClient.invalidateQueries({ queryKey: ['challenge-participants'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(challengesChannel)
    }
  }, [user, queryClient])

  return {
    challenges,
    isLoading,
    createChallenge: createChallengeMutation.mutateAsync,
    inviteParticipants: inviteParticipantsMutation.mutateAsync,
    respondToInvite: respondToInviteMutation.mutateAsync,
    recordCompletion: recordCompletionMutation.mutateAsync,
  }
}

export function useChallengeParticipants(challengeId: string) {
  const { data: participants, isLoading } = useQuery({
    queryKey: ['challenge-participants', challengeId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_participants')
        .select('*')
        .eq('challenge_id', challengeId)
        .in('status', ['accepted', 'completed'])
        .order('current_progress', { ascending: false })

      if (error) throw error

      // Fetch user details for each participant
      const participantsWithUsers = await Promise.all(
        (data || []).map(async (participant) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('display_name, photo_url')
            .eq('id', participant.user_id)
            .maybeSingle()

          return {
            ...participant,
            user: userData
          }
        })
      )

      return participantsWithUsers as ChallengeParticipant[]
    },
    enabled: !!challengeId,
  })

  return {
    participants,
    isLoading,
  }
}

export function useUserBadges() {
  const { user } = useAuth()

  const { data: badges, isLoading } = useQuery({
    queryKey: ['user-badges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenge_badges')
        .select('*')
        .eq('user_id', user!.id)
        .order('earned_at', { ascending: false })

      if (error) throw error
      return data as ChallengeBadge[]
    },
    enabled: !!user,
  })

  return {
    badges,
    isLoading,
  }
}
