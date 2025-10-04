import { useState } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useHabits } from '@/hooks/useHabits'

interface AddHabitModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type HabitCategory = 'Health' | 'Hustle' | 'Heart' | 'Harmony' | 'Happiness'

const CATEGORIES: { name: HabitCategory; color: string; subcategories: string[] }[] = [
  { name: 'Health', color: '#34C759', subcategories: ['Energy', 'Exercise', 'Grounding', 'Nutrition', 'Routine and Rituals'] },
  { name: 'Hustle', color: '#FF9500', subcategories: ['Training', 'Cash'] },
  { name: 'Heart', color: '#FF3B30', subcategories: ['Gratitude', 'God'] },
  { name: 'Harmony', color: '#AF52DE', subcategories: ['Appreciation', 'Relationships', 'Abundance'] },
  { name: 'Happiness', color: '#FFCC00', subcategories: ['Purpose', 'Play'] },
]

export default function AddHabitModal({ open, onOpenChange }: AddHabitModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<HabitCategory>('Health')
  const { createHabit, isCreating } = useHabits()

  const selectedCategory = CATEGORIES.find(c => c.name === category)!
  const color = selectedCategory.color

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    await createHabit({
      name,
      description,
      category,
      color,
    })
    handleClose()
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setCategory('Health')
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] rounded-2xl border-border/40 shadow-apple-lg">
        <form onSubmit={handleSubmit}>
          <DialogHeader className="space-y-3 pb-6">
            <DialogTitle className="text-2xl font-semibold tracking-tight">
              Create New Habit
            </DialogTitle>
            <DialogDescription className="text-base text-muted-foreground">
              Add a new habit to track. Choose a name, description, and color.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-5 py-2">
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
            <div className="space-y-3">
              <Label className="text-sm font-medium">Category</Label>
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
                <div className="text-xs text-muted-foreground pt-1">
                  <span className="font-medium">Includes:</span> {selectedCategory.subcategories.join(', ')}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="pt-6 gap-3">
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
      </DialogContent>
    </Dialog>
  )
}
