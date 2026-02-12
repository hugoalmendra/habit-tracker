import { useState } from 'react'
import { Dialog, DialogDrawerContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHabits } from '@/hooks/useHabits'
import { format, addDays, addMonths } from 'date-fns'
import type { FrequencyType, SpecificDaysConfig, WeeklyTargetConfig } from '@/lib/types'

type DurationOption = 'ongoing' | '1_week' | '2_weeks' | '1_month' | '3_months' | 'custom'

const DURATION_OPTIONS: { value: DurationOption; label: string; desc: string }[] = [
  { value: 'ongoing', label: 'Ongoing', desc: 'No end date' },
  { value: '1_week', label: '1 Week', desc: 'Ends in 7 days' },
  { value: '2_weeks', label: '2 Weeks', desc: 'Ends in 14 days' },
  { value: '1_month', label: '1 Month', desc: 'Ends in ~30 days' },
  { value: '3_months', label: '3 Months', desc: 'Ends in ~90 days' },
  { value: 'custom', label: 'Custom', desc: 'Pick an end date' },
]

function calculateEndDate(duration: DurationOption, customDate: string): string | null {
  const today = new Date()
  switch (duration) {
    case 'ongoing': return null
    case '1_week': return format(addDays(today, 7), 'yyyy-MM-dd')
    case '2_weeks': return format(addDays(today, 14), 'yyyy-MM-dd')
    case '1_month': return format(addMonths(today, 1), 'yyyy-MM-dd')
    case '3_months': return format(addMonths(today, 3), 'yyyy-MM-dd')
    case 'custom': return customDate || null
  }
}

interface AddHabitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
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

export default function AddHabitModal({ open, onOpenChange }: AddHabitModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<HabitCategory>('Health')
  const [frequencyType, setFrequencyType] = useState<FrequencyType>('daily')
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6])
  const [weeklyTarget, setWeeklyTarget] = useState(3)
  const [weekResetDay, setWeekResetDay] = useState(0)
  const [duration, setDuration] = useState<DurationOption>('ongoing')
  const [customEndDate, setCustomEndDate] = useState('')
  const { createHabit, isCreating } = useHabits()

  const selectedCategory = CATEGORIES.find(c => c.name === category)!
  const color = selectedCategory.color

  const toggleDay = (day: number) => {
    setSelectedDays(prev =>
      prev.includes(day)
        ? prev.filter(d => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    try {
      let frequencyConfig = null
      if (frequencyType === 'specific_days') {
        frequencyConfig = { days: selectedDays } as SpecificDaysConfig
      } else if (frequencyType === 'weekly_target') {
        frequencyConfig = { target: weeklyTarget, reset_day: weekResetDay } as WeeklyTargetConfig
      }

      await createHabit({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        color,
        frequency_type: frequencyType,
        frequency_config: frequencyConfig,
        start_date: format(new Date(), 'yyyy-MM-dd'),
        end_date: calculateEndDate(duration, customEndDate),
      })
      handleClose()
    } catch (error) {
      console.error('Error creating habit:', error)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setCategory('Health')
    setFrequencyType('daily')
    setSelectedDays([0, 1, 2, 3, 4, 5, 6])
    setWeeklyTarget(3)
    setWeekResetDay(0)
    setDuration('ongoing')
    setCustomEndDate('')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogDrawerContent className="md:max-w-[600px] max-md:pb-safe max-h-[90vh] flex flex-col overflow-hidden">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
          <DialogHeader className="space-y-2 max-md:space-y-1.5 pb-5 max-md:pb-4 px-6 pt-6 max-md:px-4 max-md:pt-4 flex-shrink-0">
            <DialogTitle className="text-2xl max-md:text-xl font-semibold tracking-tight">
              Create New Habit
            </DialogTitle>
            <DialogDescription className="text-base max-md:text-sm text-muted-foreground">
              Add a new habit to track with custom frequency.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 max-md:gap-3.5 py-2 px-6 max-md:px-4 overflow-y-auto flex-1 min-h-0">
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

            {/* Duration / Timeline */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Duration</Label>
              <div className="space-y-2">
                {DURATION_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-3 p-3 rounded-xl border border-border/50 hover:bg-secondary/50 transition-all cursor-pointer"
                  >
                    <input
                      type="radio"
                      name="duration"
                      checked={duration === opt.value}
                      onChange={() => setDuration(opt.value)}
                      className="h-4 w-4 text-primary"
                    />
                    <div className="flex-1">
                      <div className="font-medium text-sm">{opt.label}</div>
                      <div className="text-xs text-muted-foreground">{opt.desc}</div>
                    </div>
                  </label>
                ))}
                {duration === 'custom' && (
                  <div className="pl-7">
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      min={format(new Date(), 'yyyy-MM-dd')}
                      className="h-9 px-3 rounded-lg border border-border/50 bg-background text-sm w-full focus:border-primary/50 focus:ring-1 focus:ring-primary/20"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
          <DialogFooter className="pt-6 pb-6 px-6 gap-3 max-md:px-4 max-md:pb-4 border-t border-border/40 flex-shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="h-11 rounded-xl px-5 text-base font-medium border-border/60 hover:bg-secondary transition-all"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isCreating || !name.trim()}
              className="h-11 rounded-xl px-5 text-base font-medium bg-primary text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
            >
              {isCreating ? 'Creating...' : 'Create Habit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogDrawerContent>
    </Dialog>
  )
}
