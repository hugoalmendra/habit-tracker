import { motion } from 'framer-motion'
import { Trophy, Zap } from 'lucide-react'
import { useCompletions } from '@/hooks/useCompletions'
import { calculateXP, getProgressToNextRank } from '@/lib/xpSystem'

export default function XPBar() {
  const { completions, isLoading } = useCompletions()

  if (isLoading) {
    return (
      <div className="h-full rounded-2xl border border-border/40 bg-background shadow-apple animate-pulse" />
    )
  }

  const totalCompletions = completions?.length || 0
  const totalXP = calculateXP(totalCompletions)
  const { currentRank, nextRank, progressPercentage, xpNeeded, currentXP } = getProgressToNextRank(totalXP)

  const rankRange = nextRank ? nextRank.minXP - currentRank.minXP : currentRank.maxXP - currentRank.minXP

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="h-full"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-background p-4 sm:p-5 shadow-apple h-full">
        {/* Background gradient */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            background: `linear-gradient(135deg, ${currentRank.color}40 0%, transparent 100%)`
          }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div
                className="p-1.5 rounded-lg"
                style={{ backgroundColor: `${currentRank.color}20` }}
              >
                <Trophy className="h-4 w-4" style={{ color: currentRank.color }} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <h3
                    className="text-base sm:text-lg font-bold"
                    style={{ color: currentRank.color }}
                  >
                    {currentRank.name}
                  </h3>
                  <span className="text-xs font-medium text-muted-foreground">
                    Lv {currentRank.level}
                  </span>
                </div>
                {nextRank && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {xpNeeded} XP to {nextRank.name}
                  </p>
                )}
                {!nextRank && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Max level! 🎉
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-1.5 bg-secondary/50 px-2.5 py-1.5 rounded-lg">
              <Zap className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs sm:text-sm font-bold text-foreground">
                {totalXP.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{currentXP}</span>
              {nextRank && <span>{rankRange}</span>}
            </div>
            <div className="relative h-2.5 rounded-full bg-secondary overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
                className="absolute inset-y-0 left-0 rounded-full"
                style={{
                  background: `linear-gradient(90deg, ${currentRank.color} 0%, ${nextRank?.color || currentRank.color} 100%)`
                }}
              >
                {/* Shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}
