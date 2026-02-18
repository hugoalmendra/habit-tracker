import { motion, AnimatePresence } from 'framer-motion'
import { BarChart3, Loader2, RefreshCw, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useLifeReport } from '@/hooks/useLifeReport'

export default function LifeReport() {
  const {
    scores,
    analysis,
    isGenerating,
    error,
    generate,
    regenerate,
  } = useLifeReport()

  const hasGenerated = scores !== null

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
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
                <BarChart3 className="h-4 w-4 text-primary" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Life Report
              </h3>
            </div>
            <div className="flex items-center gap-2">
              {hasGenerated && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={regenerate}
                  disabled={isGenerating}
                  className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
                >
                  <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isGenerating ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
              )}
              <span className="text-xs text-muted-foreground">Last 30 days</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {!hasGenerated ? (
              /* Initial state — generate button */
              <motion.div
                key="generate"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                className="flex flex-col items-center gap-3 py-4"
              >
                <p className="text-sm text-muted-foreground text-center">
                  See which areas of your life need the most attention
                </p>
                <Button
                  onClick={generate}
                  disabled={isGenerating}
                  className="h-10 rounded-xl bg-primary px-5 text-sm font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Generate Life Report
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              /* Generated state — scores + analysis */
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -5 }}
                transition={{ duration: 0.3 }}
              >
                {/* Category score bars */}
                <div className="space-y-3">
                  {scores!.map((score, index) => (
                    <div key={score.category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <div
                            className="h-2.5 w-2.5 rounded-full shrink-0"
                            style={{ backgroundColor: score.color }}
                          />
                          <span className="text-sm font-medium">{score.category}</span>
                          <span className="text-xs text-muted-foreground">{score.label}</span>
                        </div>
                        {score.hasHabits ? (
                          <span className="text-sm font-bold tabular-nums">{score.completionRate}%</span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No habits</span>
                        )}
                      </div>
                      {score.hasHabits && (
                        <div className="h-2.5 rounded-full bg-secondary/50 overflow-hidden">
                          <motion.div
                            className="h-full rounded-full"
                            style={{ backgroundColor: score.color }}
                            initial={{ width: 0 }}
                            animate={{ width: `${score.completionRate}%` }}
                            transition={{
                              duration: 0.8,
                              delay: index * 0.1,
                              ease: [0.16, 1, 0.3, 1],
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* AI Analysis */}
                <div className="mt-5 pt-4 border-t border-border/20">
                  {isGenerating ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing your habits...
                    </div>
                  ) : analysis ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ duration: 0.4 }}
                      className="space-y-3"
                    >
                      <p className="text-sm leading-relaxed text-foreground">
                        {analysis.summary}
                      </p>
                      {analysis.recommendations.length > 0 && (
                        <ul className="space-y-1.5">
                          {analysis.recommendations.map((rec, i) => (
                            <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                              <span className="mt-1.5 h-1 w-1 rounded-full bg-primary shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      )}
                    </motion.div>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {error && (
            <p className="mt-2 text-xs text-destructive">{error}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
