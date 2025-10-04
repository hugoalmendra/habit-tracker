import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { Card, CardContent } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { User } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval } from 'date-fns'

interface Profile {
  display_name: string | null
  photo_url: string | null
  bio: string | null
  is_public: boolean
}

interface Habit {
  id: string
  name: string
  color: string
  created_at: string
}

interface Completion {
  completed_date: string
  habit_id: string
}

export default function PublicProfile() {
  const { userId } = useParams()
  const { theme } = useTheme()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [loading, setLoading] = useState(true)
  const [currentDate] = useState(new Date())

  useEffect(() => {
    loadPublicProfile()
  }, [userId])

  const loadPublicProfile = async () => {
    if (!userId) return

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, photo_url, bio, is_public')
        .eq('id', userId)
        .single()

      if (profileError) throw profileError

      if (!profileData?.is_public) {
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile(profileData as Profile)

      // Load habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('id, name, color, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (habitsError) throw habitsError
      setHabits((habitsData || []) as Habit[])

      // Load this month's completions
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('completed_date, habit_id')
        .eq('user_id', userId)
        .gte('completed_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('completed_date', format(monthEnd, 'yyyy-MM-dd'))

      if (completionsError) throw completionsError
      setCompletions(completionsData || [])
    } catch (error) {
      console.error('Error loading public profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-lg font-medium text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border/40 shadow-apple-lg rounded-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Profile Not Found
            </h2>
            <p className="text-muted-foreground">
              This profile is either private or doesn't exist.
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const completionsByDate = new Map<string, number>()
  completions.forEach((completion) => {
    const date = completion.completed_date
    completionsByDate.set(date, (completionsByDate.get(date) || 0) + 1)
  })

  const totalHabits = habits.length
  const totalCompletions = completions.length

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto px-6 py-4 flex justify-center">
          <img
            src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
            alt="The Way of Kaizen"
            className="h-8 w-auto"
          />
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {/* Profile Header */}
          <Card className="border-border/40 shadow-apple-lg rounded-2xl">
            <CardContent className="p-8">
              <div className="flex items-start gap-6">
                {/* Profile Photo with Fallback */}
                <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border shrink-0 bg-secondary/50 flex items-center justify-center">
                  {profile.photo_url ? (
                    <img
                      src={profile.photo_url}
                      alt={profile.display_name || 'User'}
                      className="h-full w-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none'
                        e.currentTarget.parentElement?.classList.add('show-fallback')
                      }}
                    />
                  ) : (
                    <User className="h-10 w-10 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground mb-2">
                    {profile.display_name || 'Anonymous'}
                  </h1>
                  {profile.bio && (
                    <p className="text-base text-muted-foreground">{profile.bio}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-5 md:grid-cols-3">
            <Card className="border-border/40 shadow-apple rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Total Habits
                </div>
                <div className="text-3xl font-bold text-foreground">{totalHabits}</div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-apple rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  This Month
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {totalCompletions}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-apple rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Active Days
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {completionsByDate.size}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Current Habits */}
          {habits.length > 0 && (
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">
                  Current Habits
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-secondary/50"
                    >
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                      <span className="font-medium text-foreground">{habit.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Activity Calendar */}
          <Card className="border-border/40 shadow-apple-lg rounded-2xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">
                {format(currentDate, 'MMMM yyyy')} Activity
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-xs font-semibold text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                {daysInMonth.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const completionsCount = completionsByDate.get(dateStr) || 0
                  const intensity = totalHabits > 0 ? (completionsCount / totalHabits) * 100 : 0

                  return (
                    <div
                      key={dateStr}
                      className="relative aspect-square rounded-xl p-2 text-center transition-all"
                      style={{
                        backgroundColor:
                          intensity > 0
                            ? `hsl(356 100% 64% / ${intensity / 100})`
                            : 'hsl(var(--secondary))',
                      }}
                    >
                      <div
                        className={`text-sm font-medium ${
                          intensity > 50 ? 'text-white' : 'text-foreground'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>
    </div>
  )
}
