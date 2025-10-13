import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Habit, HabitCompletion } from '@/lib/types'

interface MonthlyStatsOptions {
  year: number
  month: number
}

export function useMonthlyStats({ year, month }: MonthlyStatsOptions) {
  const { user } = useAuth()

  const { data, isLoading } = useQuery({
    queryKey: ['monthlyStats', user?.id, year, month],
    queryFn: async () => {
      if (!user?.id) return { completions: [], habits: [] }

      const startDate = `${year}-${String(month).padStart(2, '0')}-01`
      const endDate = `${year}-${String(month).padStart(2, '0')}-31`

      // Fetch completions for the month
      const { data: completions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)
        .gte('completed_date', startDate)
        .lte('completed_date', endDate)

      if (completionsError) throw completionsError

      // Fetch all habits
      const { data: habits, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)

      if (habitsError) throw habitsError

      return {
        completions: completions as HabitCompletion[],
        habits: habits as Habit[],
      }
    },
    enabled: !!user,
  })

  return {
    completions: data?.completions || [],
    habits: data?.habits || [],
    isLoading,
  }
}
