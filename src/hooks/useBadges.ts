import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface BadgeDefinition {
  id: string
  name: string
  description: string
  icon: string
  color: string
  category: 'category_mastery' | 'perfect_streak' | 'time_based' | 'social' | 'quantity' | 'comeback' | 'challenge' | 'special_occasion'
  requirement_value: number | null
  requirement_type: string | null
  sort_order: number
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  earned_at: string
  metadata: any
  badge?: BadgeDefinition
}

export interface BadgeProgress {
  id: string
  user_id: string
  badge_id: string
  current_value: number
  metadata: any
  updated_at: string
  badge?: BadgeDefinition
}

export function useBadgeDefinitions() {
  const { data: badges, isLoading } = useQuery({
    queryKey: ['badge-definitions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('badge_definitions')
        .select('*')
        .order('sort_order', { ascending: true })

      if (error) throw error
      return data as BadgeDefinition[]
    },
  })

  return {
    badges,
    isLoading,
  }
}

export function useUserBadges(userId?: string) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id

  const { data: earnedBadges, isLoading } = useQuery({
    queryKey: ['user-badges', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return []

      const { data, error } = await supabase
        .from('user_badges')
        .select(`
          *,
          badge:badge_definitions(*)
        `)
        .eq('user_id', targetUserId)
        .order('earned_at', { ascending: false })

      if (error) throw error
      return data as UserBadge[]
    },
    enabled: !!targetUserId,
  })

  return {
    earnedBadges,
    isLoading,
  }
}

export function useBadgeProgress() {
  const { user } = useAuth()

  const { data: progress, isLoading } = useQuery({
    queryKey: ['badge-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('badge_progress')
        .select(`
          *,
          badge:badge_definitions(*)
        `)
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })

      if (error) throw error
      return data as BadgeProgress[]
    },
    enabled: !!user?.id,
  })

  return {
    progress,
    isLoading,
  }
}

export function useUserBadgesWithProgress(userId?: string) {
  const { user } = useAuth()
  const targetUserId = userId || user?.id
  const queryClient = useQueryClient()

  const { data: allBadges } = useBadgeDefinitions()
  const { earnedBadges } = useUserBadges(targetUserId)
  const { progress } = useBadgeProgress()

  // Real-time subscription for badge updates
  useEffect(() => {
    if (!user?.id) return

    const channel = supabase
      .channel('badges-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['user-badges', user.id] })
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'badge_progress',
          filter: `user_id=eq.${user.id}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['badge-progress', user.id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  // Combine badges with progress and earned status
  const badgesWithStatus = allBadges?.map((badge) => {
    const earned = earnedBadges?.find((eb) => eb.badge_id === badge.id)
    const progressItem = progress?.find((p) => p.badge_id === badge.id)

    return {
      ...badge,
      earned: !!earned,
      earnedAt: earned?.earned_at,
      progress: progressItem?.current_value || 0,
      progressMetadata: progressItem?.metadata,
    }
  })

  return {
    badges: badgesWithStatus || [],
    earnedCount: earnedBadges?.length || 0,
    totalCount: allBadges?.length || 0,
  }
}

// Helper function to get badge categories grouped
export function useBadgesByCategory(userId?: string) {
  const { badges } = useUserBadgesWithProgress(userId)

  const categories = {
    category_mastery: badges.filter((b) => b.category === 'category_mastery'),
    perfect_streak: badges.filter((b) => b.category === 'perfect_streak'),
    time_based: badges.filter((b) => b.category === 'time_based'),
    social: badges.filter((b) => b.category === 'social'),
    quantity: badges.filter((b) => b.category === 'quantity'),
    comeback: badges.filter((b) => b.category === 'comeback'),
    challenge: badges.filter((b) => b.category === 'challenge'),
    special_occasion: badges.filter((b) => b.category === 'special_occasion'),
  }

  return categories
}

export const CATEGORY_LABELS: Record<string, string> = {
  category_mastery: 'Category Mastery',
  perfect_streak: 'Perfect Streaks',
  time_based: 'Time-Based',
  social: 'Social Engagement',
  quantity: 'Quantity & Consistency',
  comeback: 'Comeback',
  challenge: 'Challenges',
  special_occasion: 'Special Occasions',
}
