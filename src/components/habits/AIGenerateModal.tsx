import { useState } from 'react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { generateHabits } from '@/lib/ai'
import { useHabits } from '@/hooks/useHabits'

interface AIGenerateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface SuggestedHabit {
  name: string
  description: string
  color: string
}

export default function AIGenerateModal({ open, onOpenChange }: AIGenerateModalProps) {
  const [goal, setGoal] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestedHabits, setSuggestedHabits] = useState<SuggestedHabit[]>([])
  const [selectedHabits, setSelectedHabits] = useState<Set<number>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const { createHabit } = useHabits()

  const handleGenerate = async () => {
    if (!goal.trim()) return

    setIsGenerating(true)
    try {
      const habits = await generateHabits(goal)
      setSuggestedHabits(habits)
      setSelectedHabits(new Set(habits.map((_, i) => i)))
    } catch (error) {
      console.error('Failed to generate habits:', error)
      alert(error instanceof Error ? error.message : 'Failed to generate habits. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleHabit = (index: number) => {
    const newSelected = new Set(selectedHabits)
    if (newSelected.has(index)) {
      newSelected.delete(index)
    } else {
      newSelected.add(index)
    }
    setSelectedHabits(newSelected)
  }

  const handleCreateHabits = async () => {
    setIsCreating(true)
    try {
      const habitsToCreate = suggestedHabits.filter((_, i) => selectedHabits.has(i))

      for (const habit of habitsToCreate) {
        await createHabit(habit)
      }

      handleClose()
    } catch (error) {
      console.error('Failed to create habits:', error)
      alert('Failed to create habits. Please try again.')
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setGoal('')
    setSuggestedHabits([])
    setSelectedHabits(new Set())
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] rounded-2xl border-border/40 shadow-apple-lg max-h-[90vh] overflow-y-auto">
        <div className="space-y-6 py-4">
          <div className="text-center space-y-3">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Generate Habits with AI
            </h2>
            <p className="text-base text-muted-foreground">
              Tell us what you want to improve, and we'll suggest habits
            </p>
          </div>

          {suggestedHabits.length === 0 ? (
            <div className="space-y-4">
              <Textarea
                placeholder="e.g., My health, My productivity, My relationships..."
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                className="min-h-32 text-lg rounded-xl border-border/50 bg-secondary/50 px-4 py-3 placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                disabled={isGenerating}
              />
              <Button
                onClick={handleGenerate}
                disabled={!goal.trim() || isGenerating}
                className="w-full h-12 rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Generating habits...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Generate Habits
                  </>
                )}
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-border/40">
                <h3 className="text-lg font-semibold tracking-tight">
                  Suggested Habits
                </h3>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSuggestedHabits([])
                    setSelectedHabits(new Set())
                    setGoal('')
                  }}
                  className="text-muted-foreground hover:text-foreground"
                >
                  Start Over
                </Button>
              </div>

              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                <AnimatePresence mode="popLayout">
                  {suggestedHabits.map((habit, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 20 }}
                      transition={{
                        duration: 0.3,
                        delay: index * 0.05,
                        ease: [0.16, 1, 0.3, 1],
                      }}
                      onClick={() => toggleHabit(index)}
                      className={`w-full text-left p-4 rounded-xl border transition-all ${
                        selectedHabits.has(index)
                          ? 'border-primary/40 bg-primary/5 shadow-apple-sm'
                          : 'border-border/40 bg-background hover:bg-secondary/50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                            selectedHabits.has(index)
                              ? 'border-primary bg-primary'
                              : 'border-border/60'
                          }`}
                        >
                          {selectedHabits.has(index) && (
                            <Check className="h-3 w-3 text-primary-foreground" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div
                              className="h-2.5 w-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: habit.color }}
                            />
                            <h4 className="font-semibold text-foreground text-sm">
                              {habit.name}
                            </h4>
                          </div>
                          <p className="text-xs text-muted-foreground">
                            {habit.description}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </AnimatePresence>
              </div>

              <Button
                onClick={handleCreateHabits}
                disabled={selectedHabits.size === 0 || isCreating}
                className="w-full h-12 rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
              >
                {isCreating ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Creating habits...
                  </>
                ) : (
                  `Create ${selectedHabits.size} ${selectedHabits.size === 1 ? 'Habit' : 'Habits'}`
                )}
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
