import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Check, GripVertical } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import { useCompletions } from '@/hooks/useCompletions'
import type { Habit } from '@/lib/types'
import { format } from 'date-fns'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

interface HabitCardProps {
  habit: Habit
  completed: boolean
  index: number
}

const CATEGORY_COLORS: Record<string, string> = {
  Health: '#34C759',
  Hustle: '#FF9500',
  Heart: '#FF3B30',
  Harmony: '#AF52DE',
  Happiness: '#FFCC00',
}

export default function HabitCard({ habit, completed, index }: HabitCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { deleteHabit } = useHabits()
  const { toggleCompletion, isToggling } = useCompletions()
  const today = format(new Date(), 'yyyy-MM-dd')

  const categoryColor = CATEGORY_COLORS[habit.category] || habit.color

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: habit.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  const handleToggle = async () => {
    await toggleCompletion({
      habitId: habit.id,
      date: today,
    })
  }

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${habit.name}"?`)) {
      setIsDeleting(true)
      await deleteHabit(habit.id)
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{
          opacity: isDragging ? 0.5 : 1,
          y: 0,
          scale: isDragging ? 1.05 : 1,
        }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{
          duration: 0.4,
          delay: isDragging ? 0 : index * 0.05,
          ease: [0.16, 1, 0.3, 1],
        }}
        whileHover={!isDragging ? { scale: 1.02 } : {}}
      >
        <Card
          className={`group relative overflow-hidden border-border/40 bg-background shadow-apple hover:shadow-apple-lg transition-all rounded-2xl ${
            isDeleting ? 'opacity-50' : ''
          } ${isDragging ? 'shadow-2xl ring-2 ring-primary/20' : ''}`}
        >
        <div
          className="absolute left-0 top-0 h-full w-1 rounded-l-2xl"
          style={{ backgroundColor: categoryColor || undefined }}
        />
        <CardContent className="p-4 sm:p-6 pl-5 sm:pl-7">
          <div className="flex items-start justify-between gap-2 sm:gap-4 mb-4 sm:mb-5">
            <div
              {...attributes}
              {...listeners}
              className="cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity shrink-0 touch-none"
            >
              <GripVertical className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 mb-1.5">
                <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground line-clamp-1">
                  {habit.name}
                </h3>
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded-md shrink-0 w-fit"
                  style={{
                    backgroundColor: `${categoryColor || '#3b82f6'}20`,
                    color: categoryColor || undefined
                  }}
                >
                  {habit.category}
                </span>
              </div>
              {habit.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {habit.description}
                </p>
              )}
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDelete}
              disabled={isDeleting}
              className="h-8 w-8 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive rounded-lg shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <motion.button
            onClick={handleToggle}
            disabled={isToggling}
            className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 font-medium transition-all ${
              completed
                ? 'bg-primary text-primary-foreground shadow-apple-sm'
                : 'border border-border/60 bg-secondary/50 text-foreground hover:bg-secondary hover:border-border'
            }`}
            whileTap={{ scale: 0.97 }}
            whileHover={{ scale: completed ? 1 : 1.01 }}
          >
            {completed && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 500, damping: 25 }}
              >
                <Check className="h-5 w-5" />
              </motion.div>
            )}
            <span className="text-sm">
              {completed ? 'Completed' : 'Mark Complete'}
            </span>
          </motion.button>
        </CardContent>
      </Card>
      </motion.div>
    </div>
  )
}
