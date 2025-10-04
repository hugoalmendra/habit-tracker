import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useHabits } from '@/hooks/useHabits'
import { useCompletions } from '@/hooks/useCompletions'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Plus, LogOut, TrendingUp, Moon, Sun, Sparkles, User } from 'lucide-react'
import { motion } from 'framer-motion'
import HabitCard from '@/components/habits/HabitCard'
import AddHabitModal from '@/components/habits/AddHabitModal'
import AIGenerateModal from '@/components/habits/AIGenerateModal'
import { format } from 'date-fns'
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

export default function Dashboard() {
  const { signOut, user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isAIModalOpen, setIsAIModalOpen] = useState(false)
  const today = format(new Date(), 'yyyy-MM-dd')

  const { habits, isLoading, updateHabitOrder } = useHabits()
  const { completions: todayCompletions } = useCompletions({
    startDate: today,
    endDate: today,
  })

  const completedHabitIds = new Set(
    todayCompletions?.map((c) => c.habit_id) || []
  )

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (over && active.id !== over.id && habits) {
      const oldIndex = habits.findIndex((h) => h.id === active.id)
      const newIndex = habits.findIndex((h) => h.id === over.id)

      const newHabits = arrayMove(habits, oldIndex, newIndex)

      // Update display_order for all habits
      const habitOrders = newHabits.map((habit, index) => ({
        id: habit.id,
        display_order: index,
      }))

      await updateHabitOrder(habitOrders)
    }
  }

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <img
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="The Way of Kaizen"
              className="h-8 w-auto"
            />
          </div>
          <div className="flex items-center gap-3">
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
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              asChild
            >
              <Link to="/progress">
                <TrendingUp className="mr-2 h-4 w-4" />
                Progress
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              asChild
            >
              <Link to="/settings">
                <User className="mr-2 h-4 w-4" />
                Profile
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleSignOut}
              className="h-9 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mb-10 flex items-center justify-between"
        >
          <div>
            <h2 className="text-4xl font-semibold tracking-tight text-foreground">
              Today
            </h2>
            <p className="mt-2 text-base text-muted-foreground">
              {format(new Date(), 'EEEE, MMMM d, yyyy')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setIsAIModalOpen(true)}
              variant="outline"
              className="h-11 rounded-xl border-border/60 px-5 text-base font-medium hover:bg-secondary transition-all"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Generate with AI
            </Button>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="h-11 rounded-xl bg-primary px-6 text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
            >
              <Plus className="mr-2 h-5 w-5" />
              Add Habit
            </Button>
          </div>
        </motion.div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-lg font-medium text-muted-foreground">Loading habits...</div>
          </div>
        ) : habits?.length === 0 ? (
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
              items={habits?.map((h) => h.id) || []}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                {habits?.map((habit, index) => (
                  <HabitCard
                    key={habit.id}
                    habit={habit}
                    completed={completedHabitIds.has(habit.id)}
                    index={index}
                  />
                ))}
              </div>
            </SortableContext>
          </DndContext>
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
    </div>
  )
}
