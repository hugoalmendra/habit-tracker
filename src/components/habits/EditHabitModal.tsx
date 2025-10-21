import { useState, useEffect } from 'react'
import { Dialog, DialogDrawerContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHabits } from '@/hooks/useHabits'
import type { Habit, FrequencyType, SpecificDaysConfig, WeeklyTargetConfig } from '@/lib/types'

interface EditHabitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit
}

type HabitCategory = 'Health' | 'Career' | 'Spirit' | 'Mindset' | 'Joy'

const CATEGORIES: { name: HabitCategory; color: string; subcategories: string[] }[] = [
  { name: 'Health', color: '#34C759', subcategories: ['Energy', 'Exercise', 'Grounding', 'Nutrition', 'Routine and Rituals'] },
  { name: 'Career', color: '#FF9500', subcategories: ['Training', 'Cash'] },
  { name: 'Spirit', color: '#FF3B30', subcategories: ['Gratitude', 'God'] },
  { name: 'Mindset', color: '#AF52DE', subcategories: ['Appreciation', 'Relationships', 'Abundance'] },
  { name: 'Joy', color: '#FFCC00', subcategories: ['Purpose', 'Play'] },
]

const DAY_NAMES = ['Su', 'M', 'Tu', 'W', 'Th', 'F', 'Sa']
const FULL_DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

export default function EditHabitModal({ open, onOpenChange, habit }: EditHabitModalProps) {
  const [name, setName] = useState(habit.name)
  const [description, setDescription] = useState(habit.description || '')
  const [category, setCategory] = useState<HabitCategory>(habit.category as HabitCategory)
  const [frequencyType, setFrequencyType] = useState<FrequencyType>((habit.frequency_type as FrequencyType) || 'daily')
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [weeklyTarget, setWeeklyTarget] = useState(3)
  const [weekResetDay, setWeekResetDay] = useState(0)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateHabit } = useHabits()

  const selectedCategory = CATEGORIES.find(c => c.name === category)!
  const color = selectedCategory.color

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  useEffect(() => {
    if (open) {
      setName(habit.name)
      setDescription(habit.description || '')
      setCategory(habit.category as HabitCategory)
      setFrequencyType((habit.frequency_type as FrequencyType) || 'daily')

      // Load frequency config
      if (habit.frequency_type === 'specific_days' && habit.frequency_config) {
        const config = habit.frequency_config as SpecificDaysConfig
        setSelectedDays(config.days || [0, 1, 2, 3, 4, 5, 6])
      } else {
        setSelectedDays([0, 1, 2, 3, 4, 5, 6])
      }

      if (habit.frequency_type === 'weekly_target' && habit.frequency_config) {
        const config = habit.frequency_config as WeeklyTargetConfig
        setWeeklyTarget(config.target || 3)
        setWeekResetDay(config.reset_day || 0)
      } else {
        setWeeklyTarget(3)
        setWeekResetDay(0)
      }
    }
  }, [open, habit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      let frequencyConfig = null
      if (frequencyType === 'specific_days') {
        frequencyConfig = { days: selectedDays } as SpecificDaysConfig
      } else if (frequencyType === 'weekly_target') {
        frequencyConfig = { target: weeklyTarget, reset_day: weekResetDay } as WeeklyTargetConfig
      }

      await updateHabit({
        id: habit.id,
        name: name.trim(),
        description: description.trim() || null,
        category,
        color,
        frequency_type: frequencyType,
        frequency_config: frequencyConfig,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating habit:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogDrawerContent className="md:max-w-[600px] max-md:pb-safe max-h-[90vh]">
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <DialogHeader className="space-y-2 max-md:space-y-1.5 pb-5 max-md:pb-4 px-6 pt-6 max-md:px-4 max-md:pt-4">
            <DialogTitle className="text-2xl max-md:text-xl font-semibold tracking-tight">
              Edit Habit
            </DialogTitle>
            <DialogDescription className="text-base max-md:text-sm text-muted-foreground">
              Update your habit details and frequency.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 max-md:gap-3.5 py-2 px-6 max-md:px-4 overflow-y-auto flex-1">
            {/* Habit Name */}
            <div className="space-y-3">
              <Label htmlFor="name" className="text-sm font-medium">
                Habit Name
              </Label>
              <Input
                id="name"
                placeholder="e.g., Morning Exercise"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={100}
                className="h-12 rounded-xl border-border/50 bg-secondary/50 px-4 text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Description */}
            <div className="space-y-3">
              <Label htmlFor="description" className="text-sm font-medium">
                Description <span className="text-muted-foreground font-normal">(optional)</span>
              </Label>
              <Input
                id="description"
                placeholder="e.g., 30 minutes of cardio"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={500}
                className="h-12 rounded-xl border-border/50 bg-secondary/50 px-4 text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all"
              />
            </div>

            {/* Category */}
            <div className="space-y-2.5 max-md:space-y-2">
              <Label className="text-sm font-medium">Category</Label>
              <div className="grid grid-cols-5 max-md:grid-cols-3 gap-2 max-md:gap-2.5">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.name}
                    type="button"
                    onClick={() => setCategory(cat.name)}
                    className={`flex flex-col items-center gap-1.5 max-md:gap-1 p-2.5 max-md:p-2 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                      category === cat.name
                        ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background bg-secondary'
                        : 'opacity-70 hover:opacity-100 hover:bg-secondary/50'
                    }`}
                  >
                    <div
                      className="h-7 w-7 max-md:h-9 max-md:w-9 rounded-full"
                      style={{ backgroundColor: cat.color }}
                    />
                    <span className="text-[10px] max-md:text-xs font-medium leading-tight">{cat.name}</span>
                  </button>
                ))}
              </div>
              {selectedCategory.subcategories.length > 0 && (
                <div className="text-[11px] max-md:text-xs text-muted-foreground pt-1">
                  <span className="font-medium">Includes:</span> {selectedCategory.subcategories.join(', ')}
                </div>
              )}
            </div>

            {/* Frequency Selector */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Frequency</Label>
              <div className="space-y-3">
                {/* Daily Option */}
                <label className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-secondary/50 transition-all cursor-pointer">
                  <input
                    type="radio"
                    name="frequency"
                    checked={frequencyType === 'daily'}
                    onChange={() => setFrequencyType('daily')}
                    className="h-4 w-4 text-primary"
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">Daily</div>
                    <div className="text-xs text-muted-foreground">Track this habit every day</div>
                  </div>
                </label>

                {/* Specific Days Option */}
                <label className="flex flex-col gap-3 p-3 rounded-xl border border-border/50 hover:bg-secondary/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="frequency"
                      checked={frequencyType === 'specific_days'}
                      onChange={() => setFrequencyType('specific_days')}
                      className="h-4 w-4 text-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Specific Days</div>
                      <div className="text-xs text-muted-foreground">Only show on selected days</div>
                    </div>
                  </div>
                  {frequencyType === 'specific_days' && (
                    <div className="flex gap-2 pl-7">
                      {DAY_NAMES.map((day, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => toggleDay(index)}
                          className={`h-9 w-9 rounded-lg text-xs font-medium transition-all ${
                            selectedDays.includes(index)
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          {day}
                        </button>
                      ))}
                    </div>
                  )}
                </label>

                {/* Weekly Target Option */}
                <label className="flex flex-col gap-3 p-3 rounded-xl border border-border/50 hover:bg-secondary/50 transition-all cursor-pointer">
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="frequency"
                      checked={frequencyType === 'weekly_target'}
                      onChange={() => setFrequencyType('weekly_target')}
                      className="h-4 w-4 text-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">Weekly Target</div>
                      <div className="text-xs text-muted-foreground">Complete X times per week</div>
                    </div>
                  </div>
                  {frequencyType === 'weekly_target' && (
                    <div className="flex flex-col gap-3 pl-7">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Complete</span>
                        <select
                          value={weeklyTarget}
                          onChange={(e) => setWeeklyTarget(Number(e.target.value))}
                          className="h-9 px-3 rounded-lg border border-border/50 bg-background text-sm"
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map(n => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </select>
                        <span className="text-sm text-muted-foreground">times per week</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Week starts on</span>
                        <select
                          value={weekResetDay}
                          onChange={(e) => setWeekResetDay(Number(e.target.value))}
                          className="h-9 px-3 rounded-lg border border-border/50 bg-background text-sm"
                        >
                          {FULL_DAY_NAMES.map((day, index) => (
                            <option key={index} value={index}>{day}</option>
                          ))}
                        </select>
                      </div>
                    </div>
                  )}
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-6 pb-6 px-6 gap-3 max-md:px-4 max-md:pb-4 border-t border-border/40">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-11 rounded-xl px-5 text-base font-medium border-border/60 hover:bg-secondary transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="h-11 rounded-xl px-5 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogDrawerContent>
    </Dialog>
  )
}
