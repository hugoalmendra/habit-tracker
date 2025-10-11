import { motion } from 'framer-motion'
import { Lock, Check } from 'lucide-react'

interface BadgeCardProps {
  name: string
  description: string
  icon: string
  color: string
  earned: boolean
  earnedAt?: string
  progress?: number
  requirementValue?: number | null
}

export default function BadgeCard({
  name,
  description,
  icon,
  color,
  earned,
  earnedAt,
  progress = 0,
  requirementValue,
}: BadgeCardProps) {
  const progressPercentage = requirementValue
    ? Math.min((progress / requirementValue) * 100, 100)
    : 0

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`relative rounded-2xl p-4 transition-all ${
        earned
          ? 'bg-card border-2 shadow-apple'
          : 'bg-card/50 border border-border/40 opacity-60'
      }`}
      style={
        earned
          ? {
              borderColor: color,
              boxShadow: `0 0 20px ${color}20`,
            }
          : {}
      }
    >
      {/* Badge Icon */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`relative flex items-center justify-center h-16 w-16 rounded-2xl text-3xl flex-shrink-0 ${
            earned ? '' : 'grayscale'
          }`}
          style={{ backgroundColor: earned ? `${color}20` : '#1f1f1f' }}
        >
          {earned ? (
            <>
              <span>{icon}</span>
              <div className="absolute -top-1 -right-1 h-5 w-5 bg-green-500 rounded-full flex items-center justify-center">
                <Check className="h-3 w-3 text-white" />
              </div>
            </>
          ) : (
            <>
              <Lock className="h-6 w-6 text-muted-foreground absolute" />
              <span className="opacity-30">{icon}</span>
            </>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm mb-1 truncate">{name}</h3>
          <p className="text-xs text-muted-foreground line-clamp-2">
            {description}
          </p>
        </div>
      </div>

      {/* Progress Bar (if not earned and has requirement) */}
      {!earned && requirementValue && requirementValue > 0 && (
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
            <span>Progress</span>
            <span>
              {progress}/{requirementValue}
            </span>
          </div>
          <div className="h-2 bg-secondary rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-500"
              style={{
                width: `${progressPercentage}%`,
                backgroundColor: color,
              }}
            />
          </div>
        </div>
      )}

      {/* Earned Date */}
      {earned && earnedAt && (
        <div className="mt-3 pt-3 border-t border-border/40">
          <p className="text-xs text-muted-foreground">
            Earned {new Date(earnedAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>
      )}
    </motion.div>
  )
}
