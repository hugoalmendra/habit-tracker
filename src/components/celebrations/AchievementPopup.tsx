import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Flame, Star, Sparkles, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type AchievementType = 'level-up' | 'streak-milestone' | 'first-habit'

export interface Achievement {
  type: AchievementType
  title: string
  description: string
  color: string
  icon?: 'trophy' | 'flame' | 'star' | 'sparkles'
}

interface AchievementPopupProps {
  achievement: Achievement | null
  onClose: () => void
}

const iconMap = {
  trophy: Trophy,
  flame: Flame,
  star: Star,
  sparkles: Sparkles,
}

export default function AchievementPopup({ achievement, onClose }: AchievementPopupProps) {
  const [show, setShow] = useState(false)

  useEffect(() => {
    if (achievement) {
      setShow(true)
      // Auto-close after 5 seconds
      const timer = setTimeout(() => {
        handleClose()
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [achievement])

  const handleClose = () => {
    setShow(false)
    setTimeout(onClose, 300)
  }

  if (!achievement) return null

  const Icon = iconMap[achievement.icon || 'trophy']

  return (
    <AnimatePresence>
      {show && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={handleClose}
          />

          {/* Achievement Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.5, y: 50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.5, y: 50 }}
            transition={{
              type: 'spring',
              stiffness: 300,
              damping: 25,
              mass: 0.8
            }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-md"
          >
            <div
              className="relative overflow-hidden rounded-3xl border-2 bg-background p-8 shadow-2xl"
              style={{ borderColor: achievement.color }}
            >
              {/* Animated Background */}
              <div
                className="absolute inset-0 opacity-10"
                style={{
                  background: `radial-gradient(circle at 50% 50%, ${achievement.color} 0%, transparent 70%)`
                }}
              />

              {/* Confetti Animation */}
              <div className="absolute inset-0 pointer-events-none">
                {[...Array(20)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      opacity: 1,
                      y: '50%',
                      x: '50%',
                      scale: 0
                    }}
                    animate={{
                      opacity: 0,
                      y: `${Math.random() * 100 - 50}%`,
                      x: `${Math.random() * 100 - 50}%`,
                      scale: 1,
                      rotate: Math.random() * 360
                    }}
                    transition={{
                      duration: 1.5,
                      delay: i * 0.03,
                      ease: 'easeOut'
                    }}
                    className="absolute w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: achievement.color,
                      left: '50%',
                      top: '50%'
                    }}
                  />
                ))}
              </div>

              {/* Close Button */}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className="absolute top-4 right-4 h-8 w-8 rounded-full opacity-70 hover:opacity-100 z-10"
              >
                <X className="h-4 w-4" />
              </Button>

              {/* Content */}
              <div className="relative text-center">
                {/* Icon with Pulse Animation */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{
                    type: 'spring',
                    stiffness: 200,
                    damping: 15,
                    delay: 0.2
                  }}
                  className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full"
                  style={{ backgroundColor: `${achievement.color}20` }}
                >
                  <motion.div
                    animate={{
                      scale: [1, 1.2, 1],
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      repeatDelay: 0.5
                    }}
                  >
                    <Icon className="h-10 w-10" style={{ color: achievement.color }} />
                  </motion.div>
                </motion.div>

                {/* Achievement Badge */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-3"
                >
                  <span
                    className="inline-block px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                    style={{
                      backgroundColor: `${achievement.color}20`,
                      color: achievement.color
                    }}
                  >
                    Achievement Unlocked
                  </span>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="text-2xl sm:text-3xl font-bold mb-3"
                  style={{ color: achievement.color }}
                >
                  {achievement.title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-base text-muted-foreground"
                >
                  {achievement.description}
                </motion.p>

                {/* Continue Button */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6 }}
                  className="mt-8"
                >
                  <Button
                    onClick={handleClose}
                    className="rounded-xl px-8 py-6 text-base font-bold shadow-lg"
                    style={{
                      backgroundColor: achievement.color,
                      color: 'white'
                    }}
                  >
                    Awesome! 🎉
                  </Button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
