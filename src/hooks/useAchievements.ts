import { useEffect, useState, useCallback } from 'react'
import { useCompletions } from './useCompletions'
import { calculateXP, getRankFromXP } from '@/lib/xpSystem'
import { Achievement } from '@/components/celebrations/AchievementPopup'
import { format, subDays } from 'date-fns'

const STORAGE_KEY = 'kaizen_last_level'
const STREAK_STORAGE_KEY = 'kaizen_celebrated_streaks'

export function useAchievements() {
  const { completions } = useCompletions()
  const [achievement, setAchievement] = useState<Achievement | null>(null)

  const checkLevelUp = useCallback(() => {
    if (!completions) return

    const totalXP = calculateXP(completions.length)
    const currentRank = getRankFromXP(totalXP)

    const lastLevel = localStorage.getItem(STORAGE_KEY)
    const lastLevelNum = lastLevel ? parseInt(lastLevel) : 0

    if (currentRank.level > lastLevelNum) {
      // Level up achievement!
      localStorage.setItem(STORAGE_KEY, currentRank.level.toString())

      // Don't show celebration for level 1 (initial level)
      if (currentRank.level > 1) {
        setAchievement({
          type: 'level-up',
          title: `${currentRank.name} Achieved!`,
          description: `You've reached Level ${currentRank.level}. Your dedication to continuous improvement is remarkable!`,
          color: currentRank.color,
          icon: 'trophy'
        })
      }
    }
  }, [completions])

  const checkStreakMilestone = useCallback(() => {
    if (!completions) return

    // Calculate current streak
    const sortedCompletions = [...completions].sort(
      (a, b) => new Date(b.completed_date).getTime() - new Date(a.completed_date).getTime()
    )

    let streak = 0
    const today = new Date()

    // Group completions by date
    const completionsByDate = new Map<string, number>()
    sortedCompletions.forEach(completion => {
      const date = completion.completed_date
      completionsByDate.set(date, (completionsByDate.get(date) || 0) + 1)
    })

    // Check consecutive days
    for (let i = 0; i < 365; i++) {
      const checkDate = format(subDays(today, i), 'yyyy-MM-dd')
      if (completionsByDate.has(checkDate)) {
        streak++
      } else if (i > 0) {
        // Allow missing today if checking from yesterday
        break
      }
    }

    // Milestone thresholds
    const milestones = [7, 30, 50, 100, 365]
    const celebratedStreaks = JSON.parse(
      localStorage.getItem(STREAK_STORAGE_KEY) || '[]'
    ) as number[]

    for (const milestone of milestones) {
      if (streak >= milestone && !celebratedStreaks.includes(milestone)) {
        // New milestone reached!
        celebratedStreaks.push(milestone)
        localStorage.setItem(STREAK_STORAGE_KEY, JSON.stringify(celebratedStreaks))

        const milestoneNames: Record<number, string> = {
          7: 'Week Warrior',
          30: 'Monthly Master',
          50: 'Consistency Champion',
          100: 'Centurion',
          365: 'Year of Kaizen'
        }

        setAchievement({
          type: 'streak-milestone',
          title: milestoneNames[milestone],
          description: `${milestone} day streak! Your consistency is building unstoppable momentum.`,
          color: '#FF9500',
          icon: 'flame'
        })
        break
      }
    }
  }, [completions])

  useEffect(() => {
    if (!completions || completions.length === 0) return

    checkLevelUp()
    checkStreakMilestone()
  }, [completions, checkLevelUp, checkStreakMilestone])

  const clearAchievement = () => {
    setAchievement(null)
  }

  return {
    achievement,
    clearAchievement
  }
}
