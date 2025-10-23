import { createContext, useContext, useState, useCallback, ReactNode, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import AchievementPopup, { Achievement } from '@/components/celebrations/AchievementPopup'

interface CelebrationContextType {
  showCelebration: (achievement: Achievement) => void
}

const CelebrationContext = createContext<CelebrationContextType | null>(null)

export function CelebrationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const [currentAchievement, setCurrentAchievement] = useState<Achievement | null>(null)

  const showCelebration = useCallback((achievement: Achievement) => {
    setCurrentAchievement(achievement)
  }, [])

  const handleClose = useCallback(() => {
    setCurrentAchievement(null)
  }, [])

  // Listen for new feed activities created by the current user
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('celebration-activities')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'feed_activities',
          filter: `user_id=eq.${user.id}`,
        },
        async (payload) => {
          const activity = payload.new as any

          // Only show celebrations for specific achievement types
          if (!['challenge_completed', 'streak_milestone', 'badge_earned'].includes(activity.activity_type)) {
            return
          }

          // Fetch additional data based on activity type
          let achievement: Achievement | null = null

          if (activity.activity_type === 'challenge_completed') {
            const { data: challengeData } = await supabase
              .from('challenges')
              .select('name, badge_icon, badge_color')
              .eq('id', activity.metadata.challenge_id)
              .maybeSingle()

            if (challengeData) {
              achievement = {
                type: 'challenge-completed',
                title: 'Challenge Completed!',
                description: `You've completed the "${challengeData.name}" challenge and earned a badge!`,
                color: '#FFA500',
                icon: 'trophy',
                customIcon: challengeData.badge_icon,
                customColor: challengeData.badge_color,
              }
            }
          } else if (activity.activity_type === 'streak_milestone') {
            const streakCount = activity.metadata.streak_count || 0
            const { data: habitData } = await supabase
              .from('habits')
              .select('name')
              .eq('id', activity.metadata.habit_id)
              .maybeSingle()

            achievement = {
              type: 'streak-milestone',
              title: `${streakCount}-Day Streak!`,
              description: `Amazing! You've maintained a ${streakCount}-day streak on "${habitData?.name || 'your habit'}"!`,
              color: '#FF6B35',
              icon: 'flame',
            }
          } else if (activity.activity_type === 'badge_earned') {
            const { data: badgeData } = await supabase
              .from('badge_definitions')
              .select('name, description, icon, color')
              .eq('id', activity.metadata.badge_id)
              .maybeSingle()

            if (badgeData) {
              achievement = {
                type: 'badge-earned',
                title: `Badge Earned!`,
                description: badgeData.description || `You've earned the ${badgeData.name} badge!`,
                color: '#FFD700',
                icon: 'award',
                customIcon: badgeData.icon,
                customColor: badgeData.color,
              }
            }
          }

          if (achievement) {
            showCelebration(achievement)
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user, showCelebration])

  return (
    <CelebrationContext.Provider value={{ showCelebration }}>
      {children}
      <AchievementPopup achievement={currentAchievement} onClose={handleClose} />
    </CelebrationContext.Provider>
  )
}

export function useCelebration() {
  const context = useContext(CelebrationContext)
  if (!context) {
    throw new Error('useCelebration must be used within a CelebrationProvider')
  }
  return context
}
