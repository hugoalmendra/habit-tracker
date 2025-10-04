import { router } from '../trpc/trpc'
import { habitsRouter } from './habits'
import { completionsRouter } from './completions'

export const appRouter = router({
  habits: habitsRouter,
  completions: completionsRouter,
})

export type AppRouter = typeof appRouter
