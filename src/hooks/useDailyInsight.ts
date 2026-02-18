import { useState, useCallback } from 'react'
import { useHabits, getWeekStart, getWeekEnd } from './useHabits'
import { useCompletions } from './useCompletions'
import { useAuth } from '@/contexts/AuthContext'
import { generateDailyInsight } from '@/lib/ai'
import type { DailyInsightContext } from '@/lib/ai'
import { calculateXP, getRankFromXP } from '@/lib/xpSystem'
import { format, subDays } from 'date-fns'
import type { FrequencyType, WeeklyTargetConfig } from '@/lib/types'

const INSIGHT_CACHE_KEY = 'kaizen_daily_insight'

interface CachedInsight {
  date: string
  insight: string
  generatedAt: string
}

function getCachedInsight(): CachedInsight | null {
  try {
    const raw = localStorage.getItem(INSIGHT_CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedInsight
    const today = format(new Date(), 'yyyy-MM-dd')
    if (cached.date === today) return cached
    return null
  } catch {
    return null
  }
}

function setCachedInsight(insight: string): void {
  const data: CachedInsight = {
    date: format(new Date(), 'yyyy-MM-dd'),
    insight,
    generatedAt: new Date().toISOString(),
  }
  localStorage.setItem(INSIGHT_CACHE_KEY, JSON.stringify(data))
}

export function useDailyInsight() {
  const { user } = useAuth()
  const { habits } = useHabits()
  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const { completions: allCompletions } = useCompletions()
  const { completions: todayCompletions } = useCompletions({
    startDate: todayStr,
    endDate: todayStr,
  })

  const cached = getCachedInsight()
  const [insight, setInsight] = useState<string | null>(cached?.insight || null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generateInsight = useCallback(async (forceRegenerate = false) => {
    if (!user || !habits) return
    if (!forceRegenerate && insight) return

    setIsGenerating(true)
    setError(null)

    try {
      const completedHabitIds = new Set(
        (todayCompletions || []).map(c => c.habit_id)
      )

      const activeHabits = habits || []

      const completedToday = activeHabits
        .filter(h => completedHabitIds.has(h.id))
        .map(h => h.name)

      const pendingToday = activeHabits
        .filter(h => !completedHabitIds.has(h.id))
        .map(h => h.name)

      // Calculate streak
      let currentStreak = 0
      const completionsByDate = new Map<string, number>()
      ;(allCompletions || []).forEach(c => {
        completionsByDate.set(
          c.completed_date,
          (completionsByDate.get(c.completed_date) || 0) + 1
        )
      })
      for (let i = 0; i < 365; i++) {
        const checkDate = format(subDays(new Date(), i), 'yyyy-MM-dd')
        if (completionsByDate.has(checkDate)) {
          currentStreak++
        } else if (i > 0) {
          break
        }
      }

      // Monthly completion rate
      const now = new Date()
      const monthStart = format(new Date(now.getFullYear(), now.getMonth(), 1), 'yyyy-MM-dd')
      const monthCompletions = (allCompletions || []).filter(c => c.completed_date >= monthStart)
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
      const maxPossible = activeHabits.length * daysInMonth
      const monthlyCompletionRate = maxPossible > 0
        ? parseFloat(((monthCompletions.length / maxPossible) * 100).toFixed(1))
        : 0

      // XP and rank
      const totalXP = calculateXP((allCompletions || []).length)
      const rank = getRankFromXP(totalXP)

      // Category breakdown
      const categoryBreakdown: Record<string, { completed: number; total: number }> = {}
      for (const h of activeHabits) {
        const cat = h.category || 'Health'
        if (!categoryBreakdown[cat]) categoryBreakdown[cat] = { completed: 0, total: 0 }
        categoryBreakdown[cat].total++
        if (completedHabitIds.has(h.id)) categoryBreakdown[cat].completed++
      }

      // Weekly target progress
      const weeklyProgress: DailyInsightContext['weeklyProgress'] = []
      for (const h of activeHabits) {
        if ((h.frequency_type as FrequencyType) === 'weekly_target' && h.frequency_config) {
          const config = h.frequency_config as WeeklyTargetConfig
          const weekStart = getWeekStart(new Date(), config.reset_day || 0)
          const weekEnd = getWeekEnd(new Date(), config.reset_day || 0)
          const weekStartStr = format(weekStart, 'yyyy-MM-dd')
          const weekEndStr = format(weekEnd, 'yyyy-MM-dd')
          const count = (allCompletions || []).filter(
            c => c.habit_id === h.id && c.completed_date >= weekStartStr && c.completed_date <= weekEndStr
          ).length
          weeklyProgress.push({
            habitName: h.name,
            completedThisWeek: count,
            target: config.target,
          })
        }
      }

      const context: DailyInsightContext = {
        habits: activeHabits.map(h => ({
          name: h.name,
          category: h.category,
          description: h.description,
          frequency_type: h.frequency_type || 'daily',
        })),
        completedToday,
        pendingToday,
        currentStreak,
        weeklyProgress,
        monthlyCompletionRate,
        totalXP,
        rankName: rank.name,
        rankLevel: rank.level,
        categoryBreakdown,
      }

      const result = await generateDailyInsight(context)
      setInsight(result)
      setCachedInsight(result)
    } catch (err) {
      console.error('Failed to generate daily insight:', err)
      setError('Failed to generate insight. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [user, habits, todayCompletions, allCompletions, insight])

  return {
    insight,
    isGenerating,
    error,
    generateInsight: () => generateInsight(false),
    regenerateInsight: () => generateInsight(true),
  }
}
