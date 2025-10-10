import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useSharedHabits } from '@/hooks/useSharedHabits'
import { useCompletions } from '@/hooks/useCompletions'
import { Calendar, Users, CheckCircle2, Circle, Moon, Sun } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import NotificationsDropdown from '@/components/social/NotificationsDropdown'
import AvatarDropdown from '@/components/layout/AvatarDropdown'
import GlobalSearch from '@/components/layout/GlobalSearch'
import { format, startOfWeek, addDays, isSameDay, endOfWeek } from 'date-fns'

export default function SharedHabits() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const { acceptedSharedHabits, loadingAcceptedShared } = useSharedHabits()

  // Get the current week (Sun-Sat)
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 })

  // Fetch completions for the current week
  const { completions } = useCompletions({
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd'),
  })

  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  if (loadingAcceptedShared) {
    return (
      <div className="min-h-screen bg-secondary">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
          <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
            <Link to="/dashboard">
              <img
                src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
                alt="The Way of Kaizen"
                className="h-7 sm:h-8 w-auto cursor-pointer"
              />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <nav className="hidden md:flex items-center gap-1">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/progress">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                    Progress
                  </Button>
                </Link>
                <Link to="/shared-habits">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                    Shared Habits
                  </Button>
                </Link>
                <Link to="/challenges">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                    Challenges
                  </Button>
                </Link>
                <Link to="/feed">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                    Feed
                  </Button>
                </Link>
              </nav>
              <NotificationsDropdown />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <AvatarDropdown />
            </div>
          </div>
        </header>
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    )
  }

  if (!acceptedSharedHabits || acceptedSharedHabits.length === 0) {
    return (
      <div className="min-h-screen bg-secondary">
        {/* Header */}
        <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
          <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
            <Link to="/dashboard">
              <img
                src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
                alt="The Way of Kaizen"
                className="h-7 sm:h-8 w-auto cursor-pointer"
              />
            </Link>
            <div className="flex items-center gap-2 sm:gap-3">
              <nav className="hidden md:flex items-center gap-1">
                <Link to="/dashboard">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                    Dashboard
                  </Button>
                </Link>
                <Link to="/progress">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                    Progress
                  </Button>
                </Link>
                <Link to="/shared-habits">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                    Shared Habits
                  </Button>
                </Link>
                <Link to="/challenges">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                    Challenges
                  </Button>
                </Link>
                <Link to="/feed">
                  <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                    Feed
                  </Button>
                </Link>
              </nav>
              <NotificationsDropdown />
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              >
                {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
              </Button>
              <AvatarDropdown />
            </div>
          </div>
        </header>
        <div className="container mx-auto px-6 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-foreground">Shared Habits</h1>
            <Card className="p-12 text-center">
              <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2 text-foreground">No Shared Habits Yet</h3>
              <p className="text-muted-foreground">
                When you accept shared habit invites, they'll appear here with your friends' progress.
              </p>
            </Card>
          </div>
        </div>
      </div>
    )
  }

  // Helper function to check if a user completed a habit on a specific date
  const isCompleted = (habitId: string, userId: string, date: Date): boolean => {
    if (!completions) return false
    return completions.some(
      (c) =>
        c.habit_id === habitId &&
        c.user_id === userId &&
        isSameDay(new Date(c.completed_date), date)
    )
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link to="/dashboard">
            <img
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="The Way of Kaizen"
              className="h-7 sm:h-8 w-auto cursor-pointer"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Dashboard
                </Button>
              </Link>
              <Link to="/progress">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Progress
                </Button>
              </Link>
              <Link to="/shared-habits">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Shared Habits
                </Button>
              </Link>
              <Link to="/challenges">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Challenges
                </Button>
              </Link>
              <Link to="/feed">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Feed
                </Button>
              </Link>
            </nav>
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <AvatarDropdown />
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold text-foreground">Shared Habits</h1>
            <Badge variant="secondary" className="text-sm">
              <Users className="h-4 w-4 mr-1" />
              {acceptedSharedHabits.length} {acceptedSharedHabits.length === 1 ? 'Habit' : 'Habits'}
            </Badge>
          </div>

        <div className="space-y-6">
          {acceptedSharedHabits.map((sharedHabit, index) => {
            const habit = sharedHabit.habit
            const owner = sharedHabit.owner
            const invitedUser = sharedHabit.invited_user

            if (!habit) return null

            return (
              <motion.div
                key={sharedHabit.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  {/* Header */}
                  <div className="flex items-start justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-3 h-3 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color || '#8b5cf6' }}
                      />
                      <div>
                        <h3 className="text-xl font-semibold text-foreground">{habit.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Shared by {owner?.display_name || 'Unknown User'}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline">{habit.category}</Badge>
                  </div>

                  {/* Participants */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Participants
                    </h4>
                    <div className="flex gap-4">
                      {[owner, invitedUser].map((participant) => {
                        if (!participant) return null
                        return (
                          <Link
                            key={participant.id}
                            to={participant.id === user?.id ? '/profile' : `/profile/${participant.id}`}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                          >
                            <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                              <AvatarImage src={participant.photo_url || undefined} />
                              <AvatarFallback>
                                {participant.display_name?.charAt(0).toUpperCase() || '?'}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm text-foreground hover:underline">{participant.display_name || 'Unknown'}</span>
                          </Link>
                        )
                      })}
                    </div>
                  </div>

                  {/* Weekly Progress Calendar */}
                  <div>
                    <h4 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      This Week's Progress
                    </h4>
                    <div className="space-y-3">
                      {[owner, invitedUser].map((user) => {
                        if (!user) return null
                        return (
                          <div key={user.id} className="flex items-center gap-3">
                            <div className="w-24 text-sm text-muted-foreground shrink-0">
                              {user.display_name || 'Unknown'}
                            </div>
                            <div className="flex gap-2 flex-1">
                              {weekDays.map((day) => {
                                const completed = isCompleted(habit.id, user.id, day)
                                const isToday = isSameDay(day, new Date())
                                const isPast = day < new Date() && !isToday

                                return (
                                  <div
                                    key={day.toISOString()}
                                    className={`flex-1 flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                                      isToday
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border'
                                    }`}
                                  >
                                    <span className="text-xs text-muted-foreground">
                                      {format(day, 'EEE')}
                                    </span>
                                    <span className="text-xs font-medium text-foreground">
                                      {format(day, 'd')}
                                    </span>
                                    {completed ? (
                                      <CheckCircle2 className="h-5 w-5 text-green-500" />
                                    ) : isPast ? (
                                      <Circle className="h-5 w-5 text-muted-foreground/30" />
                                    ) : (
                                      <Circle className="h-5 w-5 text-muted-foreground/50" />
                                    )}
                                  </div>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                </Card>
              </motion.div>
            )
          })}
        </div>
        </div>
      </div>
    </div>
  )
}
