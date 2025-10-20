import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trophy, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChallenges, Challenge } from '@/hooks/useChallenges'
import { format } from 'date-fns'

interface EditChallengeModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challenge: Challenge
}

const CATEGORIES = [
  { name: 'Health', color: '#34C759', emoji: '💪' },
  { name: 'Career', color: '#FF9500', emoji: '🚀' },
  { name: 'Spirit', color: '#FF2D55', emoji: '❤️' },
  { name: 'Mindset', color: '#5E5CE6', emoji: '🧘' },
  { name: 'Joy', color: '#FFD60A', emoji: '😊' },
]

export default function EditChallengeModal({ open, onOpenChange, challenge }: EditChallengeModalProps) {
  const [step, setStep] = useState(1)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<string>('Health')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { updateChallenge } = useChallenges()

  // Populate form with existing challenge data
  useEffect(() => {
    if (challenge && open) {
      setName(challenge.name)
      setDescription(challenge.description || '')
      setCategory(challenge.category)
      setStartDate(challenge.start_date.split('T')[0])
      setEndDate(challenge.end_date.split('T')[0])
      setIsPublic(challenge.is_public)
    }
  }, [challenge, open])

  const selectedCategory = CATEGORIES.find(c => c.name === category) || CATEGORIES[0]

  const handleSubmit = async () => {
    if (!name.trim()) return

    setIsSubmitting(true)
    try {
      const updates = {
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        start_date: startDate,
        end_date: endDate,
        badge_icon: selectedCategory.emoji,
        badge_color: selectedCategory.color,
        is_public: isPublic,
      }

      await updateChallenge({ challengeId: challenge.id, updates })
      handleClose()
    } catch (error) {
      console.error('Error updating challenge:', error)
      alert(`Failed to update challenge: ${error instanceof Error ? error.message : 'Unknown error'}`)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    onOpenChange(false)
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
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg rounded-2xl bg-background shadow-apple-lg max-h-[90vh] flex flex-col"
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
                  <h2 className="text-2xl font-semibold tracking-tight">Edit Challenge</h2>
                  <p className="text-sm text-muted-foreground">Step {step} of 2</p>
                </div>
              </div>

              {/* Progress bar */}
              <div className="px-6">
                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                  <motion.div
                    className="h-full bg-primary"
                    initial={{ width: '50%' }}
                    animate={{ width: `${(step / 2) * 100}%` }}
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
                          placeholder="Run at least 5km every day for 30 days"
                          rows={4}
                          className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
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
                                className="h-8 w-8 rounded-full flex items-center justify-center"
                                style={{ backgroundColor: cat.color }}
                              />
                              <span className="text-xs font-medium">{cat.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* Step 2: Dates, Privacy & Review */}
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
                        <h3 className="font-semibold text-sm">Review Your Changes</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Name:</span>
                            <span className="font-medium">{name || 'Not set'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Category:</span>
                            <span className="font-medium">{category}</span>
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
                              {challenge.habits?.length || 0} habit{(challenge.habits?.length || 0) !== 1 ? 's' : ''}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Visibility:</span>
                            <span className="font-medium">{isPublic ? 'Public' : 'Private'}</span>
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground pt-2">
                          Note: Challenge habits cannot be edited after creation.
                        </p>
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
                      Back
                    </Button>
                  )}
                  {step < 2 ? (
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
                      {isSubmitting ? 'Saving...' : 'Save Changes'}
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
