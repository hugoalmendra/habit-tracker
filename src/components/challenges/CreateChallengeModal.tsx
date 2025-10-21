import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, ChevronLeft, ChevronRight, Plus, Trash2, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChallenges } from '@/hooks/useChallenges'
import { format, addDays } from 'date-fns'
import type { FrequencyType, SpecificDaysConfig, WeeklyTargetConfig } from '@/lib/types'
import IconPicker from '@/components/ui/IconPicker'

interface CreateChallengeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const HABIT_CATEGORIES = [
  { name: 'Health', color: '#34C759', emoji: '💪' },
  { name: 'Career', color: '#FF9500', emoji: '🚀' },
  { name: 'Spirit', color: '#FF3B30', emoji: '❤️' },
  { name: 'Mindset', color: '#AF52DE', emoji: '🧘' },
  { name: 'Joy', color: '#FFCC00', emoji: '😊' },
]

const DAY_NAMES = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface ChallengeHabit {
  name: string
  description?: string
  category: string
  color: string
  frequency_type: FrequencyType
  frequency_config: SpecificDaysConfig | WeeklyTargetConfig | null
}

export default function CreateChallengeModal({ open, onOpenChange }: CreateChallengeModalProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [iconName, setIconName] = useState<string | null>(null)
  const [startDate, setStartDate] = useState(format(new Date(), 'yyyy-MM-dd'))
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
  const [habits, setHabits] = useState<ChallengeHabit[]>([
    {
      name: '',
      description: '',
      category: 'Health',
      color: '#34C759',
      frequency_type: 'daily',
      frequency_config: null
    }
  ])
  const [isPublic, setIsPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [expandedHabits, setExpandedHabits] = useState<Set<number>>(new Set([0]))

  const { createChallenge } = useChallenges()

  const handleSubmit = async () => {
    if (!name.trim()) return

    // Filter out empty habits
    const validHabits = habits.filter(h => h.name.trim())
    if (validHabits.length === 0) {
      alert('Please add at least one habit to the challenge')
      return
    }

    setIsSubmitting(true)
    try {
      const challengeData = {
        name: name.trim(),
        description: description.trim() || undefined,
        icon_name: iconName,
        start_date: startDate,
        end_date: endDate,
        badge_icon: '🏆',
        badge_color: '#FFD700',
        is_public: isPublic,
        habits: validHabits.map(h => ({
          ...h,
          description: h.description?.trim() || undefined
        }))
      }

      await createChallenge(challengeData)
      handleClose()
    } catch (error) {
      console.error('Error creating challenge:', error)
      alert(`Failed to create challenge: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setName('')
    setDescription('')
    setIconName(null)
    setStartDate(format(new Date(), 'yyyy-MM-dd'))
    setEndDate(format(addDays(new Date(), 30), 'yyyy-MM-dd'))
    setHabits([{
      name: '',
      description: '',
      category: 'Health',
      color: '#34C759',
      frequency_type: 'daily',
      frequency_config: null
    }])
    setIsPublic(false)
    onOpenChange(false)
  }

  const addHabit = () => {
    const newIndex = habits.length
    setHabits([...habits, {
      name: '',
      description: '',
      category: 'Health',
      color: '#34C759',
      frequency_type: 'daily',
      frequency_config: null
    }])
    // Collapse all previous habits and expand only the new one
    setExpandedHabits(new Set([newIndex]))
  }

  const removeHabit = (index: number) => {
    if (habits.length > 1) {
      setHabits(habits.filter((_, i) => i !== index))
      // Remove from expanded set
      const newExpanded = new Set(expandedHabits)
      newExpanded.delete(index)
      setExpandedHabits(newExpanded)
    }
  }

  const toggleHabit = (index: number) => {
    // Accordion behavior: only one habit expanded at a time
    if (expandedHabits.has(index)) {
      // If clicking on the expanded habit, collapse it
      setExpandedHabits(new Set())
    } else {
      // Expand the clicked habit and collapse all others
      setExpandedHabits(new Set([index]))
    }
  }

  const updateHabit = (index: number, field: keyof ChallengeHabit, value: any) => {
    const newHabits = [...habits]
    newHabits[index] = { ...newHabits[index], [field]: value }
    setHabits(newHabits)
  }

  const toggleDay = (habitIndex: number, day: number) => {
    const habit = habits[habitIndex]
    const config = habit.frequency_config as SpecificDaysConfig
    const currentDays = config?.days || [0, 1, 2, 3, 4, 5, 6]
    const newDays = currentDays.includes(day)
      ? currentDays.filter(d => d !== day)
      : [...currentDays, day].sort((a, b) => a - b)

    updateHabit(habitIndex, 'frequency_config', { days: newDays })
  }

  const canProceedStep1 = name.trim().length > 0

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg rounded-2xl bg-background shadow-apple-lg max-h-[90vh] flex flex-col pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 z-10 rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 p-6 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <Trophy className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-semibold tracking-tight">Create Challenge</h2>
                  <p className="text-sm text-muted-foreground">Step {step} of 3</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-6">
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: '33%' }}
                    animate={{ width: `${(step / 3) * 100}%` }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </div>

              {/* Content - scrollable */}
              <div className="flex-1 overflow-y-auto px-6 py-6">
                <AnimatePresence mode="wait">
                  {/* Step 1: Basic Info */}
                  {step === 1 && (
                    <motion.div
                      key="step1"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      {/* Challenge Name */}
                      <div>
                        <label htmlFor="name" className="mb-2 block text-sm font-medium">
                          Challenge Name
                        </label>
                        <input
                          id="name"
                          type="text"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="30-Day Running Challenge"
                          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                          autoFocus
                        />
                      </div>

                      {/* Description */}
                      <div>
                        <label htmlFor="description" className="mb-2 block text-sm font-medium">
                          Description (Optional)
                        </label>
                        <textarea
                          id="description"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          placeholder="Build healthy habits together with friends"
                          rows={4}
                          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                        />
                      </div>

                      {/* Icon Picker */}
                      <IconPicker
                        value={iconName}
                        onChange={setIconName}
                        label="Challenge Icon (optional)"
                      />
                    </motion.div>
                  )}

                  {/* Step 2: Habits & Dates */}
                  {step === 2 && (
                    <motion.div
                      key="step2"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      {/* Dates */}
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label htmlFor="start-date" className="mb-2 block text-sm font-medium">
                            Start Date
                          </label>
                          <input
                            id="start-date"
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                        <div>
                          <label htmlFor="end-date" className="mb-2 block text-sm font-medium">
                            End Date
                          </label>
                          <input
                            id="end-date"
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            min={startDate}
                            className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                          />
                        </div>
                      </div>

                      {/* Habits */}
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium">Challenge Habits</label>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addHabit}
                            className="rounded-lg"
                          >
                            <Plus className="h-4 w-4 mr-1" />
                            Add Habit
                          </Button>
                        </div>
                        <div className="space-y-4">
                          {habits.map((habit, index) => {
                            const isExpanded = expandedHabits.has(index)
                            return (
                              <div key={index} className="rounded-xl border border-border/60 bg-secondary/30 overflow-hidden">
                                {/* Header - Always Visible */}
                                <div className="flex items-center gap-2 p-3">
                                  <input
                                    type="text"
                                    value={habit.name}
                                    onChange={(e) => updateHabit(index, 'name', e.target.value)}
                                    placeholder="Habit name (e.g., Morning Run)"
                                    className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                                  />
                                  {habits.length > 1 && (
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => removeHabit(index)}
                                      className="shrink-0 h-9 w-9 text-destructive hover:bg-destructive/10"
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() => toggleHabit(index)}
                                    className="shrink-0 p-1 hover:bg-secondary rounded transition-colors"
                                  >
                                    {isExpanded ? (
                                      <ChevronUp className="h-4 w-4" />
                                    ) : (
                                      <ChevronDown className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>

                                {/* Collapsible Content */}
                                <AnimatePresence>
                                  {isExpanded && (
                                    <motion.div
                                      initial={{ height: 0, opacity: 0 }}
                                      animate={{ height: 'auto', opacity: 1 }}
                                      exit={{ height: 0, opacity: 0 }}
                                      transition={{ duration: 0.2 }}
                                      className="space-y-3 px-4 pb-4"
                                    >
                                      {/* Description */}
                                      <textarea
                                value={habit.description}
                                onChange={(e) => updateHabit(index, 'description', e.target.value)}
                                placeholder="Description (optional)"
                                rows={2}
                                className="w-full rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                              />

                              {/* Category */}
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">Category</label>
                                <div className="flex flex-wrap gap-2">
                                  {HABIT_CATEGORIES.map((cat) => (
                                    <button
                                      key={cat.name}
                                      type="button"
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        const newHabits = [...habits]
                                        newHabits[index] = {
                                          ...newHabits[index],
                                          category: cat.name,
                                          color: cat.color
                                        }
                                        setHabits(newHabits)
                                      }}
                                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                                        habit.category === cat.name
                                          ? 'ring-2 ring-foreground ring-offset-1 ring-offset-background bg-secondary'
                                          : 'opacity-60 hover:opacity-100 hover:bg-secondary/50'
                                      }`}
                                    >
                                      <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: cat.color }}
                                      />
                                      {cat.name}
                                    </button>
                                  ))}
                                </div>
                              </div>

                              {/* Frequency */}
                              <div>
                                <label className="text-xs font-medium text-muted-foreground mb-2 block">Frequency</label>
                                <div className="space-y-2">
                                  {/* Daily */}
                                  <div
                                    onClick={(e) => {
                                      e.preventDefault()
                                      e.stopPropagation()
                                      const newHabits = [...habits]
                                      newHabits[index] = {
                                        ...newHabits[index],
                                        frequency_type: 'daily',
                                        frequency_config: null
                                      }
                                      setHabits(newHabits)
                                    }}
                                    className="flex items-center gap-2 p-2 rounded-lg border border-border/40 hover:bg-secondary/50 cursor-pointer"
                                  >
                                    <input
                                      type="radio"
                                      name={`frequency-${index}`}
                                      checked={habit.frequency_type === 'daily'}
                                      onChange={() => {}}
                                      className="h-3.5 w-3.5 text-primary pointer-events-none"
                                    />
                                    <div className="flex-1">
                                      <div className="font-medium text-xs">Daily</div>
                                    </div>
                                  </div>

                                  {/* Specific Days */}
                                  <div className="flex flex-col gap-2 p-2 rounded-lg border border-border/40 hover:bg-secondary/50">
                                    <div
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        const newHabits = [...habits]
                                        newHabits[index] = {
                                          ...newHabits[index],
                                          frequency_type: 'specific_days',
                                          frequency_config: { days: [0, 1, 2, 3, 4, 5, 6] }
                                        }
                                        setHabits(newHabits)
                                      }}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <input
                                        type="radio"
                                        name={`frequency-${index}`}
                                        checked={habit.frequency_type === 'specific_days'}
                                        onChange={() => {}}
                                        className="h-3.5 w-3.5 text-primary pointer-events-none"
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium text-xs">Specific Days</div>
                                      </div>
                                    </div>
                                    {habit.frequency_type === 'specific_days' && (
                                      <div className="flex gap-1.5 pl-5">
                                        {DAY_NAMES.map((day, dayIndex) => {
                                          const config = habit.frequency_config as SpecificDaysConfig
                                          const selectedDays = config?.days || [0, 1, 2, 3, 4, 5, 6]
                                          return (
                                            <button
                                              key={dayIndex}
                                              type="button"
                                              onClick={(e) => {
                                                e.stopPropagation()
                                                toggleDay(index, dayIndex)
                                              }}
                                              className={`h-7 w-7 rounded-md text-xs font-medium transition-all ${
                                                selectedDays.includes(dayIndex)
                                                  ? 'bg-primary text-primary-foreground'
                                                  : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                                              }`}
                                            >
                                              {day}
                                            </button>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>

                                  {/* Weekly Target */}
                                  <div className="flex flex-col gap-2 p-2 rounded-lg border border-border/40 hover:bg-secondary/50">
                                    <div
                                      onClick={(e) => {
                                        e.preventDefault()
                                        e.stopPropagation()
                                        const newHabits = [...habits]
                                        newHabits[index] = {
                                          ...newHabits[index],
                                          frequency_type: 'weekly_target',
                                          frequency_config: { target: 3, reset_day: 0 }
                                        }
                                        setHabits(newHabits)
                                      }}
                                      className="flex items-center gap-2 cursor-pointer"
                                    >
                                      <input
                                        type="radio"
                                        name={`frequency-${index}`}
                                        checked={habit.frequency_type === 'weekly_target'}
                                        onChange={() => {}}
                                        className="h-3.5 w-3.5 text-primary pointer-events-none"
                                      />
                                      <div className="flex-1">
                                        <div className="font-medium text-xs">Weekly Target</div>
                                      </div>
                                    </div>
                                    {habit.frequency_type === 'weekly_target' && (
                                      <div className="flex flex-col gap-2 pl-5" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground">Complete</span>
                                          <select
                                            value={(habit.frequency_config as WeeklyTargetConfig)?.target || 3}
                                            onChange={(e) => {
                                              e.stopPropagation()
                                              const config = habit.frequency_config as WeeklyTargetConfig
                                              updateHabit(index, 'frequency_config', {
                                                target: Number(e.target.value),
                                                reset_day: config?.reset_day || 0
                                              })
                                            }}
                                            className="h-7 px-2 rounded-md border border-border/50 bg-background text-xs"
                                          >
                                            {[1, 2, 3, 4, 5, 6, 7].map(n => (
                                              <option key={n} value={n}>{n}</option>
                                            ))}
                                          </select>
                                          <span className="text-xs text-muted-foreground">times/week</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-muted-foreground">Week starts</span>
                                          <select
                                            value={(habit.frequency_config as WeeklyTargetConfig)?.reset_day || 0}
                                            onChange={(e) => {
                                              e.stopPropagation()
                                              const config = habit.frequency_config as WeeklyTargetConfig
                                              updateHabit(index, 'frequency_config', {
                                                target: config?.target || 3,
                                                reset_day: Number(e.target.value)
                                              })
                                            }}
                                            className="h-7 px-2 rounded-md border border-border/50 bg-background text-xs"
                                          >
                                            {FULL_DAY_NAMES.map((day, dayIndex) => (
                                              <option key={dayIndex} value={dayIndex}>{day}</option>
                                            ))}
                                          </select>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                </div>
                                      </div>
                                    </motion.div>
                                  )}
                                </AnimatePresence>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 3: Privacy & Review */}
                  {step === 3 && (
                    <motion.div
                      key="step3"
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-5"
                    >
                      {/* Public Toggle */}
                      <div className="flex items-center justify-between p-4 rounded-xl bg-secondary/50">
                        <div>
                          <p className="font-medium text-sm">Public Challenge</p>
                          <p className="text-xs text-muted-foreground">Anyone can join this challenge</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setIsPublic(!isPublic)}
                          className={`relative h-6 w-11 rounded-full transition-colors ${
                            isPublic ? 'bg-primary' : 'bg-border'
                          }`}
                        >
                          <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${
                            isPublic ? 'translate-x-5' : 'translate-x-0.5'
                          }`} />
                        </button>
                      </div>

                      {/* Review */}
                      <div className="rounded-xl border border-border/40 p-4 space-y-3">
                        <h3 className="font-semibold text-sm">Review Your Challenge</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{name || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Duration:</span>
                            <span className="font-medium">
                              {format(new Date(startDate), 'MMM d')} - {format(new Date(endDate), 'MMM d, yyyy')}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Habits:</span>
                            <span className="font-medium">
                              {habits.filter(h => h.name.trim()).length} habit{habits.filter(h => h.name.trim()).length !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Visibility:</span>
                            <span className="font-medium">{isPublic ? 'Public' : 'Private'}</span>
                          </div>
                        </div>
                        {habits.filter(h => h.name.trim()).length > 0 && (
                          <div className="mt-3 pt-3 border-t border-border/40">
                            <p className="text-xs font-medium text-muted-foreground mb-2">Habits:</p>
                            <ul className="space-y-1">
                              {habits.filter(h => h.name.trim()).map((habit, index) => (
                                <li key={index} className="text-xs">
                                  • {habit.name} ({habit.frequency_type === 'daily' ? 'Daily' : habit.frequency_type === 'specific_days' ? 'Specific Days' : 'Weekly Target'})
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Footer - Navigation */}
              <div className="p-6 pt-4 border-t border-border/40">
                <div className="flex gap-3">
                  {step > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setStep(step - 1)}
                      className="rounded-xl"
                    >
                      <ChevronLeft className="h-4 w-4 mr-1" />
                      Back
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button
                      type="button"
                      onClick={() => setStep(step + 1)}
                      disabled={step === 1 && !canProceedStep1}
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      onClick={handleSubmit}
                      disabled={!name.trim() || isSubmitting}
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? 'Creating...' : 'Create Challenge'}
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
