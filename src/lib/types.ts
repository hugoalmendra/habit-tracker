export type { Database } from '../types/supabase'
export type { Json } from '../types/supabase'

import type { Database } from '../types/supabase'

export type Habit = Database['public']['Tables']['habits']['Row']
export type HabitCompletion = Database['public']['Tables']['habit_completions']['Row']
export type Profile = Database['public']['Tables']['profiles']['Row']

// Habit frequency types
export type FrequencyType = 'daily' | 'specific_days' | 'weekly_target'

export type SpecificDaysConfig = {
  days: number[] // 0=Sunday, 1=Monday, ..., 6=Saturday
}

export type WeeklyTargetConfig = {
  target: number // Number of completions needed per week (1-7)
  reset_day: number // Day when week resets (0=Sunday, 1=Monday, ...)
}

export type FrequencyConfig = SpecificDaysConfig | WeeklyTargetConfig | null
