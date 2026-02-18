import { motion, AnimatePresence } from 'framer-motion'
import { Brain, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useDailyInsight } from '@/hooks/useDailyInsight'

export default function DailyInsight() {
  const {
    insight,
    isGenerating,
    error,
    generateInsight,
    regenerateInsight,
  } = useDailyInsight()

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 }}
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-background to-background p-5 sm:p-6 shadow-apple">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-20 h-20 bg-primary/3 rounded-full blur-2xl" />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="shrink-0 p-1.5 rounded-lg bg-primary/10">
                <Brain className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Daily Insight
              </h3>
            </div>
            {insight && (
              <Button
                variant="ghost"
                size="sm"
                onClick={regenerateInsight}
                disabled={isGenerating}
                className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
          </div>

          {/* Content */}
          <AnimatePresence mode="wait">
            {insight ? (
              <motion.div
                key="insight"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                <p className="text-sm sm:text-base leading-relaxed text-foreground">
                  {insight}
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col items-center gap-3 py-2"
              >
                <p className="text-sm text-muted-foreground text-center">
                  Get personalized insights based on your progress today
                </p>
                <Button
                  onClick={generateInsight}
                  disabled={isGenerating}
                  className="h-10 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Reflecting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Insight
                    </>
                  )}
                </Button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error state */}
          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
