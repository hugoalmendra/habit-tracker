import { z } from 'zod'
import { router, protectedProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'

export const completionsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        habitId: z.string().uuid().optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      let query = ctx.supabase
        .from('habit_completions')
        .select('*')
        .eq('user_id', ctx.userId)

      if (input.habitId) {
        query = query.eq('habit_id', input.habitId)
      }

      if (input.startDate) {
        query = query.gte('completed_date', input.startDate)
      }

      if (input.endDate) {
        query = query.lte('completed_date', input.endDate)
      }

      const { data, error } = await query.order('completed_date', { ascending: false })

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),

  toggle: protectedProcedure
    .input(
      z.object({
        habitId: z.string().uuid(),
        date: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // First, check if completion exists
      const { data: existing } = await ctx.supabase
        .from('habit_completions')
        .select('id')
        .eq('habit_id', input.habitId)
        .eq('completed_date', input.date)
        .single()

      if (existing) {
        // Delete if exists
        const { error } = await ctx.supabase
          .from('habit_completions')
          .delete()
          .eq('id', existing.id)
          .eq('user_id', ctx.userId)

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        }

        return { completed: false }
      } else {
        // Create if doesn't exist
        const { error } = await ctx.supabase
          .from('habit_completions')
          .insert({
            habit_id: input.habitId,
            user_id: ctx.userId,
            completed_date: input.date,
          })

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        }

        return { completed: true }
      }
    }),

  getMonthlyStats: protectedProcedure
    .input(
      z.object({
        year: z.number(),
        month: z.number().min(1).max(12),
      })
    )
    .query(async ({ ctx, input }) => {
      const startDate = `${input.year}-${String(input.month).padStart(2, '0')}-01`
      const endDate = `${input.year}-${String(input.month).padStart(2, '0')}-31`

      const { data: completions, error: completionsError } = await ctx.supabase
        .from('habit_completions')
        .select('*, habits(*)')
        .eq('user_id', ctx.userId)
        .gte('completed_date', startDate)
        .lte('completed_date', endDate)

      if (completionsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: completionsError.message,
        })
      }

      const { data: habits, error: habitsError } = await ctx.supabase
        .from('habits')
        .select('*')
        .eq('user_id', ctx.userId)

      if (habitsError) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: habitsError.message,
        })
      }

      return {
        completions,
        habits,
      }
    }),
})
