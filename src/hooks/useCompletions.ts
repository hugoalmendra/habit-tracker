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

      // Get habit details to check if it's linked to a challenge
      const { data: habit } = await supabase
        .from('habits')
        .select('challenge_id')
        .eq('id', input.habitId)
        .maybeSingle()

      const habitData = habit as any

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

        // If habit is linked to a challenge, also delete challenge completion
        if (habitData?.challenge_id) {
          await supabase
            .from('challenge_completions')
            .delete()
            .eq('challenge_id', habitData.challenge_id)
            .eq('user_id', user.id)
            .eq('date', input.date)
        }

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

        // If habit is linked to a challenge, also create challenge completion
        if (habitData?.challenge_id) {
          await supabase
            .from('challenge_completions')
            .insert({
              challenge_id: habitData.challenge_id,
              user_id: user.id,
              date: input.date,
            })
        }

        return { completed: true }
      }
    },
    onMutate: async (input) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['completions'] })

      // Snapshot previous value
      const previousCompletions = queryClient.getQueryData(['completions', options])

      // Optimistically update
      queryClient.setQueryData(['completions', options], (old: HabitCompletion[] | undefined) => {
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

      return { previousCompletions }
    },
    onError: (_err, _input, context) => {
      // Rollback on error
      if (context?.previousCompletions) {
        queryClient.setQueryData(['completions', options], context.previousCompletions)
      }
    },
    onSettled: () => {
      // Refetch after mutation completes
      queryClient.invalidateQueries({ queryKey: ['completions'] })
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
