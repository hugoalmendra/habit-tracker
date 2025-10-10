import { motion } from 'framer-motion'
import { Award, Trophy } from 'lucide-react'
import { useUserBadges } from '@/hooks/useChallenges'
import { Card } from '@/components/ui/card'
import { format } from 'date-fns'

export default function BadgesDisplay() {
  const { badges, isLoading } = useUserBadges()

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Award className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Challenge Badges</h2>
        </div>
        <p className="text-muted-foreground text-sm">Loading badges...</p>
      </Card>
    )
  }

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2 mb-4">
        <Award className="h-5 w-5 text-yellow-500" />
        <h2 className="text-lg font-semibold">Challenge Badges</h2>
        {badges && badges.length > 0 && (
          <span className="ml-auto text-sm text-muted-foreground">
            {badges.length} badge{badges.length !== 1 ? 's' : ''} earned
          </span>
        )}
      </div>

      {badges && badges.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {badges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              className="flex flex-col items-center gap-2 p-4 rounded-xl bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 hover:border-yellow-500/40 transition-all"
            >
              <div
                className="h-16 w-16 rounded-full flex items-center justify-center text-3xl shadow-lg"
                style={{ backgroundColor: badge.badge_color }}
              >
                {badge.badge_icon}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm line-clamp-2">{badge.badge_name}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(badge.earned_at), 'MMM d, yyyy')}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">No badges earned yet</p>
          <p className="text-muted-foreground text-xs mt-1">
            Complete challenges to earn badges!
          </p>
        </div>
      )}
    </Card>
  )
}
