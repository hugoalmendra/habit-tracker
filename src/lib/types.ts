export type { Database } from '../types/supabase'
export type { Json } from '../types/supabase'

import type { Database } from '../types/supabase'

export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitCompletion = Database['public']['Tables']['habit_completions']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']
