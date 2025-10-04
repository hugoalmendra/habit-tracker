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
    queryKey: ['completions', options],
    queryFn: async () => {
      let query = supabase.from('habit_completions').select('*')

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['completions'] })
    },
  })

  return {
    completions,
    isLoading,
    toggleCompletion: toggleMutation.mutateAsync,
    isToggling: toggleMutation.isPending,
  }
}
