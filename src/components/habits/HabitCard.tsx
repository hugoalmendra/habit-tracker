import { useState } from 'react'
import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Trash2, Check, GripVertical, Pencil, Trophy, Calendar, Target } from 'lucide-react'
import { useHabits, getWeekStart, getWeekEnd } from '@/hooks/useHabits'
import { useCompletions, useWeeklyCompletions } from '@/hooks/useCompletions'
import type { Habit, FrequencyType, SpecificDaysConfig, WeeklyTargetConfig } from '@/lib/types'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import EditHabitModal from './EditHabitModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'

interface HabitCardProps {
  habit: Habit & { isShared?: boolean; sharedHabitId?: string }
  completed: boolean
  selectedDate: string
  index: number
}

const CATEGORY_COLORS: Record<string, string> = {
  Health: '#34C759',
  Hustle: '#FF9500',
  Heart: '#FF3B30',
  Harmony: '#AF52DE',
  Happiness: '#FFCC00',
}

const DAY_ABBREVIATIONS = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']

export default function HabitCard({ habit, completed, selectedDate, index }: HabitCardProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const { deleteHabit } = useHabits()
  const { toggleCompletion, isToggling } = useCompletions()

  const categoryColor = CATEGORY_COLORS[habit.category] || habit.color

  // Get frequency info
  const frequencyType = (habit.frequency_type as FrequencyType) || 'daily'

  // For weekly target habits, get the weekly completion count
  const resetDay = frequencyType === 'weekly_target' && habit.frequency_config
    ? (habit.frequency_config as WeeklyTargetConfig).reset_day
    : 0
  const weekStart = getWeekStart(new Date(selectedDate), resetDay)
  const weekEnd = getWeekEnd(new Date(selectedDate), resetDay)
  const { weeklyCount } = useWeeklyCompletions(
    habit.id,
    weekStart.toISOString().split('T')[0],
    weekEnd.toISOString().split('T')[0]
  )

  // Generate frequency badge text
  const getFrequencyBadge = () => {
    if (frequencyType === 'daily') {
      return null // Don't show badge for daily habits (default)
    }

    if (frequencyType === 'specific_days' && habit.frequency_config) {
      const config = habit.frequency_config as SpecificDaysConfig
      const dayLabels = config.days
        .sort((a, b) => a - b)
        .map(d => DAY_ABBREVIATIONS[d])
        .join(' ')
      return { icon: Calendar, text: dayLabels }
    }

    if (frequencyType === 'weekly_target' && habit.frequency_config) {
      const config = habit.frequency_config as WeeklyTargetConfig
      return { icon: Target, text: `${weeklyCount}/${config.target} weekly` }
    }

    return null
  }

  const frequencyBadge = getFrequencyBadge()

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
      date: selectedDate,
    })
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    setIsDeleting(true)
    await deleteHabit(habit.id)
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
              <div className="flex flex-wrap items-center gap-2 mb-1.5">
                <h3 className="text-base sm:text-lg font-semibold tracking-tight text-foreground">
                  {habit.name}
                </h3>
                <span
                  className="px-2 py-0.5 text-xs font-medium rounded-md shrink-0"
                  style={{
                    backgroundColor: `${categoryColor || '#3b82f6'}20`,
                    color: categoryColor || undefined
                  }}
                >
                  {habit.category}
                </span>
                {frequencyBadge && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md shrink-0 bg-muted text-muted-foreground flex items-center gap-1">
                    <frequencyBadge.icon className="h-3 w-3" />
                    {frequencyBadge.text}
                  </span>
                )}
                {habit.challenge_id && habit.challenge_name && (
                  <span className="px-2 py-0.5 text-xs font-medium rounded-md shrink-0 bg-primary/10 text-primary flex items-center gap-1">
                    <Trophy className="h-3 w-3" />
                    {habit.challenge_name}
                  </span>
                )}
              </div>
              {habit.description && (
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2">
                  {habit.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100 shrink-0">
              {!habit.challenge_id && (
                <>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowEditModal(true)}
                    className="h-8 w-8 hover:bg-primary/10 hover:text-primary rounded-lg"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleDeleteClick}
                    disabled={isDeleting}
                    className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive rounded-lg"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </>
              )}
            </div>
          </div>

          <motion.button
            onClick={handleToggle}
            onTouchEnd={(e) => {
              e.preventDefault()
              if (!isToggling) {
                handleToggle()
              }
            }}
            disabled={isToggling}
            className={`flex w-full items-center justify-center gap-2.5 rounded-xl px-4 py-3.5 font-medium transition-all touch-manipulation active:scale-[0.97] ${
              completed
                ? 'bg-primary text-primary-foreground shadow-apple-sm'
                : 'border border-border/60 bg-secondary/50 text-foreground hover:bg-secondary hover:border-border'
            }`}
            whileTap={{ scale: 0.97 }}
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

      <EditHabitModal
        habit={habit}
        open={showEditModal}
        onOpenChange={setShowEditModal}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Habit"
        description={`Are you sure you want to delete "${habit.name}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
