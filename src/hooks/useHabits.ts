import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import { format } from 'date-fns'
import type { Habit, FrequencyType, FrequencyConfig, SpecificDaysConfig } from '@/lib/types'

// Helper function to check if a habit is within its active timeline
export function isHabitActive(habit: Habit, date: Date): boolean {
  const dateStr = format(date, 'yyyy-MM-dd')

  if (habit.start_date && dateStr < habit.start_date) {
    return false
  }

  if (habit.end_date && dateStr > habit.end_date) {
    return false
  }

  return true
}

// Helper function to check if a habit should be displayed on a specific date
export function shouldDisplayHabit(habit: Habit, date: Date): boolean {
  const frequencyType = (habit.frequency_type as FrequencyType) || 'daily'

  if (frequencyType === 'daily') {
    return true
  }

  if (frequencyType === 'specific_days' && habit.frequency_config) {
    const config = habit.frequency_config as SpecificDaysConfig
    const dayOfWeek = date.getDay() // 0=Sunday, 1=Monday, ..., 6=Saturday
    return config.days.includes(dayOfWeek)
  }

  if (frequencyType === 'weekly_target') {
    // Weekly target habits are always displayed until target is met
    // The hiding logic will be handled at a higher level with completion data
    return true
  }

  return true
}

// Helper function to get the start of the week based on reset day
export function getWeekStart(date: Date, resetDay: number = 0): Date {
  const result = new Date(date)
  const day = result.getDay()
  const diff = (day < resetDay ? day + 7 : day) - resetDay
  result.setDate(result.getDate() - diff)
  result.setHours(0, 0, 0, 0)
  return result
}

// Helper function to get the end of the week
export function getWeekEnd(date: Date, resetDay: number = 0): Date {
  const weekStart = getWeekStart(date, resetDay)
  const weekEnd = new Date(weekStart)
  weekEnd.setDate(weekEnd.getDate() + 6)
  weekEnd.setHours(23, 59, 59, 999)
  return weekEnd
}

export function useHabits() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: habits, isLoading, error } = useQuery({
    queryKey: ['habits', user?.id],
    queryFn: async () => {
      if (!user?.id) return []

      // First get all habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('*')
        .eq('user_id', user.id)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (habitsError) throw habitsError

      // Then get challenge associations for these habits
      const habitIds = habitsData?.map(h => h.id) || []
      const { data: challengeHabits } = await supabase
        .from('challenge_habits')
        .select('habit_id, challenge_id, challenges(name, end_date)')
        .in('habit_id', habitIds)

      // Create a map of habit_id to challenge info
      const challengeMap = new Map(
        challengeHabits?.map(ch => [
          ch.habit_id,
          {
            challenge_id: ch.challenge_id,
            challenge_name: (ch.challenges as any)?.name,
            challenge_end_date: (ch.challenges as any)?.end_date
          }
        ]) || []
      )

      // Merge challenge info into habits
      const habitsWithChallenges = habitsData?.map(habit => ({
        ...habit,
        challenge_id: challengeMap.get(habit.id)?.challenge_id || null,
        challenge_name: challengeMap.get(habit.id)?.challenge_name || null,
        challenge_end_date: challengeMap.get(habit.id)?.challenge_end_date || null,
      }))

      return habitsWithChallenges as Habit[]
    },
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: async (input: {
      name: string
      description?: string
      category?: string
      color?: string
      frequency_type?: FrequencyType
      frequency_config?: FrequencyConfig
      start_date?: string
      end_date?: string | null
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('habits')
        .insert({
          user_id: user.id,
          name: input.name,
          description: input.description,
          category: input.category || 'Health',
          color: input.color || '#3b82f6',
          frequency_type: input.frequency_type || 'daily',
          frequency_config: input.frequency_config as any,
          start_date: input.start_date || format(new Date(), 'yyyy-MM-dd'),
          end_date: input.end_date || null,
        })
        .select()
        .maybeSingle()

      if (error) throw error
      return data as Habit
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  const updateMutation = useMutation({
    mutationFn: async (input: {
      id: string
      name?: string
      description?: string | null
      category?: string
      color?: string
      frequency_type?: FrequencyType
      frequency_config?: FrequencyConfig
      end_date?: string | null
    }) => {
      const { id, ...updates } = input
      const { data, error} = await supabase
        .from('habits')
        .update({
          ...updates,
          frequency_config: updates.frequency_config as any,
        })
        .eq('id', id)
        .select()
        .maybeSingle()

      if (error) throw error
      return data as Habit
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  const updateOrderMutation = useMutation({
    mutationFn: async (habitOrders: { id: string; display_order: number }[]) => {
      // Update each habit's display_order
      for (const habit of habitOrders) {
        const { error } = await supabase
          .from('habits')
          .update({ display_order: habit.display_order })
          .eq('id', habit.id)

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['habits'] })
    },
  })

  return {
    habits,
    isLoading,
    error,
    createHabit: createMutation.mutateAsync,
    updateHabit: updateMutation.mutateAsync,
    deleteHabit: deleteMutation.mutateAsync,
    updateHabitOrder: updateOrderMutation.mutateAsync,
    isCreating: createMutation.isPending,
    isUpdating: updateMutation.isPending,
    isDeleting: deleteMutation.isPending,
  }
}
