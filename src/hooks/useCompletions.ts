import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { HabitCompletion } from '@/lib/types'

interface UseCompletionsOptions {
  habitId?: string
  startDate?: string
  endDate?: string
}

export function useCompletions(options: UseCompletionsOptions = {}) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: completions, isLoading } = useQuery({
    queryKey: ['completions', user?.id, options],
    queryFn: async () => {
      if (!user?.id) return []

      let query = supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', user.id)

      if (options.habitId) {
        query = query.eq('habit_id', options.habitId)
      }
      if (options.startDate) {
        query = query.gte('completed_date', options.startDate)
      }
      if (options.endDate) {
        query = query.lte('completed_date', options.endDate)
      }

      const { data, error } = await query.order('completed_date', { ascending: false })

      if (error) throw error
      return data as HabitCompletion[]
    },
    enabled: !!user,
  })

  const toggleMutation = useMutation({
    mutationFn: async (input: { habitId: string; date: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      // Check if completion exists
      const { data: existing } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', input.habitId)
        .eq('completed_date', input.date)
        .maybeSingle()

      if (existing) {
        // Delete if exists
        const { error } = await supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id)

        if (error) throw error

        return { completed: false }
      } else {
        // Create if doesn't exist
        const { error } = await supabase
          .from('habit_completions')
          .insert({
            habit_id: input.habitId,
            user_id: user.id,
            completed_date: input.date,
          })

        if (error) throw error

        return { completed: true }
      }
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches for all completion queries
      await queryClient.cancelQueries({ queryKey: ['completions'] })
      await queryClient.cancelQueries({ queryKey: ['weekly-completions'] })

      // Snapshot previous values
      const previousData = queryClient.getQueriesData({ queryKey: ['completions'] })

      // Optimistically update all completion queries
      queryClient.setQueriesData({ queryKey: ['completions'] }, (old: HabitCompletion[] | undefined) => {
        if (!old) return old

        // Check if completion already exists
        const existingIndex = old.findIndex(
          (c) => c.habit_id === input.habitId && c.completed_date === input.date
        )

        if (existingIndex >= 0) {
          // Remove completion (uncomplete)
          return old.filter((_, i) => i !== existingIndex)
        } else {
          // Add completion
          return [
            {
              id: 'optimistic-' + Date.now(),
              habit_id: input.habitId,
              user_id: user?.id || '',
              completed_date: input.date,
              created_at: new Date().toISOString(),
            },
            ...old,
          ]
        }
      })

      return { previousData }
    },
    onError: (_err, _input, context) => {
      // Rollback on error - restore all previous query data
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      // Refetch after mutation completes
      queryClient.invalidateQueries({ queryKey: ['completions'] })
      queryClient.invalidateQueries({ queryKey: ['weekly-completions'] })
      queryClient.invalidateQueries({ queryKey: ['challenges'] })
      queryClient.invalidateQueries({ queryKey: ['challenge-participants'] })
    },
  })

  return {
    completions,
    isLoading,
    toggleCompletion: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
  }
}

// Hook to get weekly completion count for a specific habit
export function useWeeklyCompletions(habitId: string, weekStart: string, weekEnd: string) {
  const { user } = useAuth()

  const { data: weeklyCount = 0, isLoading } = useQuery({
    queryKey: ['weekly-completions', user?.id, habitId, weekStart, weekEnd],
    queryFn: async () => {
      if (!user?.id || !habitId) return 0

      const { data, error } = await supabase
        .from('habit_completions')
        .select('id')
        .eq('user_id', user.id)
        .eq('habit_id', habitId)
        .gte('completed_date', weekStart)
        .lte('completed_date', weekEnd)

      if (error) throw error
      return data?.length || 0
    },
    enabled: !!user && !!habitId && !!weekStart && !!weekEnd,
  })

  return {
    weeklyCount,
    isLoading,
  }
}
