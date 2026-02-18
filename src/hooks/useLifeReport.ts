import { useState, useCallback } from 'react'
import { useHabits } from './useHabits'
import { useCompletions } from './useCompletions'
import { useAuth } from '@/contexts/AuthContext'
import { computeCategoryScores, generateLifeReport } from '@/lib/ai'
import type { CategoryScore, LifeReportAnalysis } from '@/lib/ai'
import { format, subDays } from 'date-fns'

const CACHE_KEY = 'kaizen_life_report'

interface CachedReport {
  date: string
  analysis: LifeReportAnalysis
}

function getCachedAnalysis(): CachedReport | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const cached = JSON.parse(raw) as CachedReport
    const today = format(new Date(), 'yyyy-MM-dd')
    if (cached.date === today) return cached
    return null
  } catch {
    return null
  }
}

function setCachedAnalysis(analysis: LifeReportAnalysis): void {
  const data: CachedReport = {
    date: format(new Date(), 'yyyy-MM-dd'),
    analysis,
  }
  localStorage.setItem(CACHE_KEY, JSON.stringify(data))
}

export function useLifeReport() {
  const { user } = useAuth()
  const { habits } = useHabits()

  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const thirtyDaysAgo = format(subDays(new Date(), 30), 'yyyy-MM-dd')

  const { completions } = useCompletions({
    startDate: thirtyDaysAgo,
    endDate: todayStr,
  })

  const [scores, setScores] = useState<CategoryScore[] | null>(null)
  const [analysis, setAnalysis] = useState<LifeReportAnalysis | null>(() => {
    const cached = getCachedAnalysis()
    return cached?.analysis || null
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const generate = useCallback(async (forceRegenerate = false) => {
    if (!user || !habits || !completions) return

    setError(null)

    // Compute scores instantly
    const computed = computeCategoryScores(habits, completions)
    setScores(computed)

    // Check cache for AI analysis
    if (!forceRegenerate && analysis) return

    setIsGenerating(true)
    try {
      const result = await generateLifeReport(computed)
      setAnalysis(result)
      setCachedAnalysis(result)
    } catch (err) {
      console.error('Failed to generate life report:', err)
      setError('Failed to generate analysis. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }, [user, habits, completions, analysis])

  return {
    scores,
    analysis,
    isGenerating,
    error,
    generate: () => generate(false),
    regenerate: () => generate(true),
  }
}
