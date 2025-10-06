import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useMonthlyStats } from '@/hooks/useMonthlyStats'
import { motion } from 'framer-motion'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay } from 'date-fns'

const CATEGORY_COLORS: Record<string, string> = {
  Health: '#34C759',
  Hustle: '#FF9500',
  Heart: '#FF3B30',
  Harmony: '#AF52DE',
  Happiness: '#FFCC00',
}

export default function Progress() {
  const { theme } = useTheme()
  const [currentDate, setCurrentDate] = useState(new Date())
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth() + 1

  const { completions: monthlyCompletions, habits: monthlyHabits, isLoading } = useMonthlyStats({
    year,
    month,
  })

  const monthlyData = {
    completions: monthlyCompletions,
    habits: monthlyHabits,
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const previousMonth = () => {
    setCurrentDate(new Date(year, month - 2, 1))
  }

  const nextMonth = () => {
    setCurrentDate(new Date(year, month, 1))
  }

  const completionsByDate = new Map<string, number>()
  monthlyData?.completions.forEach((completion) => {
    const date = completion.completed_date
    completionsByDate.set(date, (completionsByDate.get(date) || 0) + 1)
  })

  const totalHabits = monthlyData?.habits.length || 0
  const totalCompletions = monthlyData?.completions.length || 0
  const daysInMonthCount = daysInMonth.length
  const maxPossibleCompletions = totalHabits * daysInMonthCount
  const completionRate = maxPossibleCompletions > 0
    ? ((totalCompletions / maxPossibleCompletions) * 100).toFixed(1)
    : 0

  // Calculate current streak
  let currentStreak = 0
  const today = new Date()
  for (let i = 0; i < daysInMonthCount; i++) {
    const checkDate = new Date(today)
    checkDate.setDate(today.getDate() - i)
    const dateStr = format(checkDate, 'yyyy-MM-dd')
    const completions = completionsByDate.get(dateStr) || 0
    if (completions > 0) {
      currentStreak++
    } else if (i > 0) {
      break
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              asChild
            >
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <img
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="The Way of Kaizen"
              className="h-8 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        {/* Stats Cards */}
        <div className="mb-10 grid gap-5 md:grid-cols-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border-border/40 shadow-apple rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Habits
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalHabits}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border-border/40 shadow-apple rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{totalCompletions}</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border-border/40 shadow-apple rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Completion Rate
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{completionRate}%</div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="border-border/40 shadow-apple rounded-2xl">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Current Streak
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{currentStreak} days</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Calendar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          <Card className="border-border/40 shadow-apple-lg rounded-2xl">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-foreground">Monthly Calendar</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={previousMonth}
                    className="h-9 w-9 rounded-lg border-border/60 hover:bg-secondary"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="min-w-[150px] text-center font-semibold text-foreground">
                    {format(currentDate, 'MMMM yyyy')}
                  </span>
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={nextMonth}
                    className="h-9 w-9 rounded-lg border-border/60 hover:bg-secondary"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-muted-foreground">Loading...</div>
                </div>
              ) : (
                <div className="grid grid-cols-7 gap-2">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                    <div key={day} className="p-2 text-center text-sm font-semibold text-muted-foreground">
                      {day}
                    </div>
                  ))}
                  {/* Empty cells for days before month starts */}
                  {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                    <div key={`empty-${i}`} className="p-2" />
                  ))}
                  {/* Calendar days */}
                  {daysInMonth.map((day) => {
                    const dateStr = format(day, 'yyyy-MM-dd')
                    const completions = completionsByDate.get(dateStr) || 0
                    const isToday = isSameDay(day, new Date())
                    const intensity = totalHabits > 0 ? (completions / totalHabits) * 100 : 0

                    return (
                      <motion.div
                        key={dateStr}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: day.getDate() * 0.01 }}
                        className={`relative aspect-square rounded-xl p-2 text-center transition-all hover:scale-105 ${
                          isToday ? 'ring-2 ring-primary' : ''
                        }`}
                        style={{
                          backgroundColor:
                            intensity > 0
                              ? `hsl(356 100% 64% / ${intensity / 100})`
                              : 'hsl(var(--secondary))',
                        }}
                      >
                        <div className={`text-sm font-medium ${intensity > 50 ? 'text-white' : 'text-foreground'}`}>
                          {day.getDate()}
                        </div>
                        {completions > 0 && (
                          <div className={`text-xs ${intensity > 50 ? 'text-white' : 'text-muted-foreground'}`}>
                            {completions}/{totalHabits}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Habits Breakdown */}
        {monthlyData && monthlyData.habits.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10"
          >
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardHeader>
                <CardTitle className="text-foreground">Habits Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {monthlyData.habits.map((habit) => {
                    const habitCompletions = monthlyData.completions.filter(
                      (c) => c.habit_id === habit.id
                    ).length
                    const habitRate = ((habitCompletions / daysInMonthCount) * 100).toFixed(1)
                    const habitColor = CATEGORY_COLORS[habit.category] || habit.color

                    return (
                      <div key={habit.id} className="flex items-center gap-4">
                        <div
                          className="h-4 w-4 rounded-full shrink-0"
                          style={{ backgroundColor: habitColor || undefined }}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="mb-1.5 flex items-center justify-between gap-4">
                            <span className="font-medium text-foreground truncate">{habit.name}</span>
                            <span className="text-sm text-muted-foreground shrink-0">
                              {habitCompletions}/{daysInMonthCount} ({habitRate}%)
                            </span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-secondary">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${habitRate}%` }}
                              transition={{ duration: 0.5, delay: 0.2 }}
                              className="h-full"
                              style={{ backgroundColor: habitColor || undefined }}
                            />
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  )
}
