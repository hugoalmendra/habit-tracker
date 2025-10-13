// @ts-nocheck
import { useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Achievement } from '@/components/celebrations/AchievementPopup'

const CELEBRATED_BADGES_KEY = 'kaizen_celebrated_badges'

export function useBadgeAchievements() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [achievement, setAchievement] = useState<Achievement | null>(null)

  useEffect(() => {
    if (!user?.id) return

    // Subscribe to new badges being earned
    const channel = supabase
      .channel('badge-achievements')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_badges',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          // Get badge details
          const { data: badge } = await supabase
            .from('badge_definitions')
            .select('*')
            .eq('id', payload.new.badge_id)
            .single()

          if (!badge) return

          // Check if we've already celebrated this badge
          const celebratedBadges = JSON.parse(
            localStorage.getItem(CELEBRATED_BADGES_KEY) || '[]'
          ) as string[]

          if (!celebratedBadges.includes(badge.id)) {
            // Add to celebrated list
            celebratedBadges.push(badge.id)
            localStorage.setItem(CELEBRATED_BADGES_KEY, JSON.stringify(celebratedBadges))

            // Show achievement popup
            setAchievement({
              type: 'badge-earned',
              title: badge.name,
              description: badge.description,
              color: badge.color,
              icon: 'trophy',
            })

            // Invalidate queries to refresh badge displays
            queryClient.invalidateQueries({ queryKey: ['user-badges'] })
            queryClient.invalidateQueries({ queryKey: ['badge-progress'] })
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user?.id, queryClient])

  const clearAchievement = () => {
    setAchievement(null)
  }

  return {
    achievement,
    clearAchievement,
  }
}
