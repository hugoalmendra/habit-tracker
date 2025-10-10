import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useHabits } from '@/hooks/useHabits'
import type { Habit } from '@/lib/types'

interface EditHabitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  habit: Habit
}

type HabitCategory = 'Health' | 'Hustle' | 'Heart' | 'Harmony' | 'Happiness'

const CATEGORIES: { name: HabitCategory; color: string; subcategories: string[] }[] = [
  { name: 'Health', color: '#34C759', subcategories: ['Energy', 'Exercise', 'Grounding', 'Nutrition', 'Routine and Rituals'] },
  { name: 'Hustle', color: '#FF9500', subcategories: ['Training', 'Cash'] },
  { name: 'Heart', color: '#FF3B30', subcategories: ['Gratitude', 'God'] },
  { name: 'Harmony', color: '#AF52DE', subcategories: ['Appreciation', 'Relationships', 'Abundance'] },
  { name: 'Happiness', color: '#FFCC00', subcategories: ['Purpose', 'Play'] },
]

export default function EditHabitModal({ open, onOpenChange, habit }: EditHabitModalProps) {
  const [name, setName] = useState(habit.name)
  const [description, setDescription] = useState(habit.description || '')
  const [category, setCategory] = useState<HabitCategory>(habit.category as HabitCategory)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { updateHabit } = useHabits()

  const selectedCategory = CATEGORIES.find(c => c.name === category)!
  const color = selectedCategory.color

  useEffect(() => {
    if (open) {
      setName(habit.name)
      setDescription(habit.description || '')
      setCategory(habit.category as HabitCategory)
    }
  }, [open, habit])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      await updateHabit({
        id: habit.id,
        name: name.trim(),
        description: description.trim() || null,
        category,
        color,
      })
      onOpenChange(false)
    } catch (error) {
      console.error('Error updating habit:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => onOpenChange(false)}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-apple-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={() => onOpenChange(false)}
                className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <h2 className="mb-6 text-2xl font-semibold tracking-tight">Edit Habit</h2>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Habit Name */}
                <div>
                  <label htmlFor="name" className="mb-2 block text-sm font-medium">
                    Habit Name
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g., Morning meditation"
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                    required
                    autoFocus
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="mb-2 block text-sm font-medium">
                    Description (optional)
                  </label>
                  <textarea
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="What does this habit mean to you?"
                    rows={3}
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="mb-3 block text-sm font-medium">Category</label>
                  <div className="grid grid-cols-5 gap-2">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.name}
                        type="button"
                        onClick={() => setCategory(cat.name)}
                        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all hover:scale-105 active:scale-95 ${
                          category === cat.name
                            ? 'ring-2 ring-foreground ring-offset-2 ring-offset-background bg-secondary'
                            : 'opacity-70 hover:opacity-100 hover:bg-secondary/50'
                        }`}
                      >
                        <div
                          className="h-8 w-8 rounded-full"
                          style={{ backgroundColor: cat.color }}
                        />
                        <span className="text-xs font-medium">{cat.name}</span>
                      </button>
                    ))}
                  </div>
                  {selectedCategory.subcategories.length > 0 && (
                    <div className="text-xs text-muted-foreground pt-2">
                      <span className="font-medium">Includes:</span> {selectedCategory.subcategories.join(', ')}
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!name.trim() || isSubmitting}
                    className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
