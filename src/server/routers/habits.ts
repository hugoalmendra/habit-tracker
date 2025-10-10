import { z } from 'zod'
import { router, protectedProcedure } from '../trpc/trpc'
import { TRPCError } from '@trpc/server'

export const habitsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const { data, error } = await ctx.supabase
      .from('habits')
      .select('*')
      .eq('user_id', ctx.userId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: false })

    if (error) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: error.message,
      })
    }

    return data
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(100),
        description: z.string().max(500).optional(),
        category: z.enum(['Health', 'Hustle', 'Heart', 'Harmony', 'Happiness']).default('Health'),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).default('#3b82f6'),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { data, error } = await ctx.supabase
        .from('habits')
        .insert({
          user_id: ctx.userId,
          name: input.name,
          description: input.description,
          category: input.category,
          color: input.color,
        })
        .select()
        .maybeSingle()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.string().uuid(),
        name: z.string().min(1).max(100).optional(),
        description: z.string().max(500).optional(),
        color: z.string().regex(/^#[0-9A-F]{6}$/i).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...updates } = input

      const { data, error } = await ctx.supabase
        .from('habits')
        .update(updates)
        .eq('id', id)
        .eq('user_id', ctx.userId)
        .select()
        .maybeSingle()

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return data
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      const { error } = await ctx.supabase
        .from('habits')
        .delete()
        .eq('id', input.id)
        .eq('user_id', ctx.userId)

      if (error) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: error.message,
        })
      }

      return { success: true }
    }),

  updateOrder: protectedProcedure
    .input(
      z.object({
        habitOrders: z.array(
          z.object({
            id: z.string().uuid(),
            display_order: z.number(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Update each habit's display_order
      for (const habit of input.habitOrders) {
        const { error } = await ctx.supabase
          .from('habits')
          .update({ display_order: habit.display_order })
          .eq('id', habit.id)
          .eq('user_id', ctx.userId)

        if (error) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: error.message,
          })
        }
      }

      return { success: true }
    }),
})
