import { supabase } from '@/lib/supabase'

export async function createContext() {
  const { data: { session } } = await supabase.auth.getSession()

  return {
    supabase,
    session,
    userId: session?.user?.id,
  }
}

export type Context = Awaited<ReturnType<typeof createContext>>
