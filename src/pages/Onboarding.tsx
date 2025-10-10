import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Sparkles, Loader2, Check } from 'lucide-react'
import { useHabits } from '@/hooks/useHabits'
import { generateHabits } from '@/lib/ai'

interface SuggestedHabit {
  name: string
  description: string
  color: string
}

export default function Onboarding() {
  const { theme } = useTheme()
  const [goal, setGoal] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestedHabits, setSuggestedHabits] = useState<SuggestedHabit[]>([])
  const [selectedHabits, setSelectedHabits] = useState<Set<number>>(new Set())
  const [isCreating, setIsCreating] = useState(false)
  const navigate = useNavigate()
  const { createHabit } = useHabits()

  const handleGenerate = async () => {
    if (!goal.trim()) return

    setIsGenerating(true)
    try {
      const habits = await generateHabits(goal)
      setSuggestedHabits(habits)
      // Select all habits by default
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

      // Create habits sequentially
      for (const habit of habitsToCreate) {
        await createHabit(habit)
      }

      navigate('/dashboard')
    } catch (error) {
      console.error('Failed to create habits:', error)
      // TODO: Show error toast
    } finally {
      setIsCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl"
      >
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center mb-6">
            <img
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="The Way of Kaizen"
              className="h-12 w-auto"
            />
          </div>
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-4">
            What do you want to Kaizen?
          </h1>
          <p className="text-lg text-muted-foreground">
            Tell us your goal, and we'll help you build the right habits
          </p>
        </div>

        <Card className="border-border/40 shadow-apple-lg rounded-2xl overflow-hidden">
          <CardContent className="p-8">
            {suggestedHabits.length === 0 ? (
              <div className="space-y-6">
                <Textarea
                  placeholder="e.g., My health, My productivity, My relationships..."
                  value={goal}
                  onChange={(e) => setGoal(e.target.value)}
                  className="min-h-32 text-lg rounded-xl border-border/50 bg-secondary/50 px-4 py-3 placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all resize-none"
                  disabled={isGenerating}
                />
                <div className="space-y-3">
                  <Button
                    onClick={handleGenerate}
                    disabled={!goal.trim() || isGenerating}
                    className="w-full h-14 rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
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
                  <Button
                    onClick={() => navigate('/dashboard')}
                    variant="ghost"
                    className="w-full h-12 rounded-xl text-base font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                  >
                    Skip for now
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-border/40">
                  <h3 className="text-xl font-semibold tracking-tight">
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

                <div className="space-y-3">
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
                        className={`w-full text-left p-5 rounded-xl border transition-all ${
                          selectedHabits.has(index)
                            ? 'border-primary/40 bg-primary/5 shadow-apple-sm'
                            : 'border-border/40 bg-background hover:bg-secondary/50'
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`mt-0.5 h-6 w-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                              selectedHabits.has(index)
                                ? 'border-primary bg-primary'
                                : 'border-border/60'
                            }`}
                          >
                            {selectedHabits.has(index) && (
                              <Check className="h-4 w-4 text-primary-foreground" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-3 mb-1.5">
                              <div
                                className="h-3 w-3 rounded-full shrink-0"
                                style={{ backgroundColor: habit.color }}
                              />
                              <h4 className="font-semibold text-foreground">
                                {habit.name}
                              </h4>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {habit.description}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </AnimatePresence>
                </div>

                <div className="pt-4">
                  <Button
                    onClick={handleCreateHabits}
                    disabled={selectedHabits.size === 0 || isCreating}
                    className="w-full h-14 rounded-xl text-base font-medium active:scale-[0.98] transition-all shadow-apple-sm"
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
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}
