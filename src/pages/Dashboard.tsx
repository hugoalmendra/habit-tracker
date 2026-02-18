import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useHabits, shouldDisplayHabit, isHabitActive, getWeekStart, getWeekEnd } from '@/hooks/useHabits'
import { useCompletions } from '@/hooks/useCompletions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, Moon, Sun, Sparkles, ChevronLeft, ChevronRight, Archive, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import HabitCard from '@/components/habits/HabitCard'
import AddHabitModal from '@/components/habits/AddHabitModal'
import AIGenerateModal from '@/components/habits/AIGenerateModal'
import KaizenQuote from '@/components/dashboard/KaizenQuote'
import LifeReport from '@/components/dashboard/LifeReport'
import AchievementPopup from '@/components/celebrations/AchievementPopup'
import NotificationsDropdown from '@/components/social/NotificationsDropdown'
import AvatarDropdown from '@/components/layout/AvatarDropdown'
import GlobalSearch from '@/components/layout/GlobalSearch'
import GroupsNotificationBadge from '@/components/groups/GroupsNotificationBadge'
import Spinner from '@/components/ui/Spinner'
import { useAchievements } from '@/hooks/useAchievements'
import { useBadgeAchievements } from '@/hooks/useBadgeAchievements'
import { format, addDays, subDays, isToday, isFuture } from 'date-fns'
import type { FrequencyType, WeeklyTargetConfig } from '@/lib/types'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'

const CATEGORIES = ['All', 'Health', 'Career', 'Spirit', 'Mindset', 'Joy'] as const

export default function Dashboard() {
  const { theme, toggleTheme } = useTheme()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [selectedCategory, setSelectedCategory] = useState<typeof CATEGORIES[number]>('All')
  const [showCompleted, setShowCompleted] = useState(false)
  const selectedDateStr = format(selectedDate, 'yyyy-MM-dd')

  const { habits, isLoading, updateHabitOrder } = useHabits()

  // Get the earliest possible week start for any weekly target habit
  const earliestWeekStart = (habits || [])
    .filter(h => (h.frequency_type as FrequencyType) === 'weekly_target')
    .map(h => {
      const config = h.frequency_config as WeeklyTargetConfig
      const resetDay = config?.reset_day || 0
      return getWeekStart(selectedDate, resetDay)
    })
    .reduce((earliest, current) =>
      !earliest || current < earliest ? current : earliest
    , null as Date | null)

  // Fetch completions for the selected date and the full week (for weekly target calculations)
  const weekStartStr = earliestWeekStart ? format(earliestWeekStart, 'yyyy-MM-dd') : selectedDateStr
  const weekEndStr = format(selectedDate, 'yyyy-MM-dd')

  const { completions: dateCompletions } = useCompletions({
    startDate: weekStartStr,
    endDate: weekEndStr,
  })

  // Filter by category
  const categoryFilteredHabits = selectedCategory === 'All'
    ? (habits || [])
    : (habits || []).filter(h => h.category === selectedCategory)

  // Filter by frequency - only show habits that should display on the selected date
  const filteredHabits = categoryFilteredHabits.filter(habit => {
    // Check if the habit is within its active timeline
    if (!isHabitActive(habit, selectedDate)) {
      return false
    }

    // Check if the habit should be displayed based on frequency type and config
    if (!shouldDisplayHabit(habit, selectedDate)) {
      return false
    }

    // For weekly target habits, hide if target is already met for the week
    const frequencyType = (habit.frequency_type as FrequencyType) || 'daily'
    if (frequencyType === 'weekly_target' && habit.frequency_config) {
      const config = habit.frequency_config as WeeklyTargetConfig
      const resetDay = config.reset_day || 0
      const weekStart = getWeekStart(selectedDate, resetDay)
      const weekEnd = getWeekEnd(selectedDate, resetDay)

      // Count completions for this week
      const weekStartStr = format(weekStart, 'yyyy-MM-dd')
      const weekEndStr = format(weekEnd, 'yyyy-MM-dd')

      const weekCompletions = (dateCompletions || []).filter(
        c => c.habit_id === habit.id &&
             c.completed_date >= weekStartStr &&
             c.completed_date <= weekEndStr
      ).length

      // Hide if weekly target is met
      if (weekCompletions >= config.target) {
        return false
      }
    }

    return true
  })

  // Only consider completions for the selected date when showing completion status
  const completedHabitIds = new Set(
    (dateCompletions || [])
      .filter(c => c.completed_date === selectedDateStr)
      .map(c => c.habit_id)
  )

  // Expired timeline habits (end_date in the past)
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const expiredHabits = (habits || []).filter(h => h.end_date && h.end_date < todayStr)

  const { achievement, clearAchievement } = useAchievements()
  const { achievement: badgeAchievement, clearAchievement: clearBadgeAchievement } = useBadgeAchievements()

  // Combined achievement display (prioritize badge achievements)
  const displayAchievement = badgeAchievement || achievement
  const handleClearAchievement = () => {
    if (badgeAchievement) {
      clearBadgeAchievement()
    } else {
      clearAchievement()
    }
  }

  const goToPreviousDay = () => {
    setSelectedDate(subDays(selectedDate, 1))
  }

  const goToNextDay = () => {
    if (!isFuture(addDays(selectedDate, 1))) {
      setSelectedDate(addDays(selectedDate, 1))
    }
  }

  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && filteredHabits.length > 0) {
      const oldIndex = filteredHabits.findIndex((h) => h.id === active.id)
      const newIndex = filteredHabits.findIndex((h) => h.id === over.id)

      const newFilteredHabits = arrayMove(filteredHabits, oldIndex, newIndex)

      // Update display_order for reordered habits
      const habitOrders = newFilteredHabits.map((habit, index) => ({
        id: habit.id,
        display_order: index,
      }))

      try {
        await updateHabitOrder(habitOrders)
      } catch (error: any) {
        console.error('Failed to update habit order:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        if (error?.message) console.error('Error message:', error.message)
      }
    }
  }

  return (
    <div className="min-h-screen bg-secondary pb-20 md:pb-0">
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
              <Link to="/challenges">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Challenges
                </Button>
              </Link>
              <Link to="/groups">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium relative">
                  Groups
                  <GroupsNotificationBadge />
                </Button>
              </Link>
              <Link to="/feed">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Feed
                </Button>
              </Link>
            </nav>
            <GlobalSearch />
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <AvatarDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12">

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 sm:mb-10 flex flex-col gap-4"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground">
                  {isToday(selectedDate) ? 'Today' : format(selectedDate, 'MMMM d, yyyy')}
                </h2>
                <p className="mt-2 text-sm sm:text-base text-muted-foreground">
                  {format(selectedDate, 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
              <Button
                onClick={() => setIsAIModalOpen(true)}
                variant="outline"
                className="h-10 sm:h-11 flex-1 sm:flex-none rounded-xl border-border/60 px-4 sm:px-5 text-sm sm:text-base font-medium hover:bg-secondary transition-all"
              >
                <Sparkles className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                <span className="hidden sm:inline">Generate with AI</span>
                <span className="sm:hidden">AI</span>
              </Button>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="h-10 sm:h-11 flex-1 sm:flex-none rounded-xl bg-primary px-4 sm:px-6 text-sm sm:text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
              >
                <Plus className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
                Add Habit
              </Button>
            </div>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Button
                onClick={goToPreviousDay}
                variant="outline"
                size="sm"
                className="h-9 w-9 rounded-lg border-border/60 p-0"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                onClick={goToNextDay}
                variant="outline"
                size="sm"
                disabled={isFuture(addDays(selectedDate, 1))}
                className="h-9 w-9 rounded-lg border-border/60 p-0 disabled:opacity-50"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            {!isToday(selectedDate) && (
              <Button
                onClick={goToToday}
                variant="outline"
                size="sm"
                className="h-9 rounded-lg border-border/60 px-4 text-sm font-medium"
              >
                Back to Today
              </Button>
            )}
          </div>

          {/* Category Filter */}
          {(habits || []).length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {CATEGORIES.map((cat) => (
                <Button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  variant={selectedCategory === cat ? 'default' : 'outline'}
                  size="sm"
                  className="rounded-lg shrink-0"
                >
                  {cat}
                </Button>
              ))}
            </div>
          )}
        </motion.div>

        {/* Life Report - only on today's view */}
        {(habits || []).length > 0 && isToday(selectedDate) && (
          <div className="mb-8">
            <LifeReport />
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" text="Loading habits..." />
          </div>
        ) : (habits || []).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          >
            <Card className="p-16 text-center border-border/40 shadow-apple-lg rounded-2xl">
              <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-primary/10">
                <Plus className="h-12 w-12 text-primary" />
              </div>
              <h3 className="mb-3 text-2xl font-semibold tracking-tight">No habits yet</h3>
              <p className="mb-8 text-base text-muted-foreground max-w-sm mx-auto">
                Get started by creating your first habit to track!
              </p>
              <Button
                onClick={() => setIsAddModalOpen(true)}
                className="h-12 rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
              >
                <Plus className="mr-2 h-5 w-5" />
                Create Your First Habit
              </Button>
            </Card>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredHabits.map((h) => h.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                {filteredHabits.map((habit, index) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    completed={completedHabitIds.has(habit.id)}
                    selectedDate={selectedDateStr}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Completed Timeline Habits */}
        {expiredHabits.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-8"
          >
            <button
              onClick={() => setShowCompleted(!showCompleted)}
              className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <Archive className="h-4 w-4" />
              Completed Habits ({expiredHabits.length})
              <ChevronDown className={`h-4 w-4 transition-transform ${showCompleted ? 'rotate-180' : ''}`} />
            </button>
            {showCompleted && (
              <div className="grid gap-4 sm:gap-5 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 opacity-70">
                {expiredHabits.map((habit, index) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    completed={completedHabitIds.has(habit.id)}
                    selectedDate={selectedDateStr}
                    index={index}
                  />
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* Daily Quote at Bottom */}
        {(habits || []).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="mt-10"
          >
            <KaizenQuote />
          </motion.div>
        )}
      </main>

      <AddHabitModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
      />
      <AIGenerateModal
        open={isAIModalOpen}
        onOpenChange={setIsAIModalOpen}
      />
      <AchievementPopup
        achievement={displayAchievement}
        onClose={handleClearAchievement}
      />
    </div>
  )
}
