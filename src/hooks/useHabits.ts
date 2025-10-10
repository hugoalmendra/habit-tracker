import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Habit } from '@/lib/types'

export function useHabits() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: habits, isLoading, error } = useQuery({
    queryKey: ['habits'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('habits')
        .select('*')
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Habit[]
    },
    enabled: !!user,
  })

  const createMutation = useMutation({
    mutationFn: async (input: { name: string; description?: string; category?: string; color?: string }) => {
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
    mutationFn: async (input: { id: string; name?: string; description?: string | null; category?: string; color?: string }) => {
      const { id, ...updates } = input
      const { data, error } = await supabase
        .from('habits')
        .update(updates)
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
