import { useState } from 'react'
import { motion } from 'framer-motion'
import { Award, Trophy } from 'lucide-react'
import { useBadgesByCategory } from '@/hooks/useBadges'
import { useAuth } from '@/contexts/AuthContext'
import { Card } from '@/components/ui/card'
import BadgeCard from '@/components/badges/BadgeCard'

interface BadgesDisplayProps {
  userId?: string
}

export default function BadgesDisplay({ userId }: BadgesDisplayProps = {}) {
  const { user } = useAuth()
  const categories = useBadgesByCategory(userId)
  const [selectedCategory, setSelectedCategory] = useState<string>('all')

  // Determine if we're viewing our own profile
  const isOwnProfile = !userId || userId === user?.id

  // Calculate totals
  const allBadges = Object.values(categories).flat()
  const earnedBadges = allBadges.filter((b) => b.earned)
  const totalBadges = allBadges.length
  const earnedCount = earnedBadges.length

  // For other users' profiles, only show earned badges
  const badgesToShow = isOwnProfile ? allBadges : earnedBadges

  // Filter badges based on selected category
  let displayBadges = selectedCategory === 'all'
    ? badgesToShow
    : badgesToShow.filter((b) => b.category === selectedCategory)

  const categoryTabs = [
    { id: 'all', label: 'All' },
    { id: 'category_mastery', label: 'Category' },
    { id: 'quantity', label: 'Quantity' },
    { id: 'challenge', label: 'Challenges' },
    { id: 'perfect_streak', label: 'Streaks' },
    { id: 'social', label: 'Social' },
    { id: 'time_based', label: 'Time' },
    { id: 'comeback', label: 'Comeback' },
    { id: 'special_occasion', label: 'Special' },
  ]

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" />
          <h2 className="text-lg font-semibold">Badges</h2>
          {earnedCount > 0 && (
            <span className="text-sm text-muted-foreground">
              {isOwnProfile ? `${earnedCount}/${totalBadges}` : earnedCount}
            </span>
          )}
        </div>
        {isOwnProfile && (
          <div className="text-sm text-muted-foreground">
            {totalBadges > 0 ? Math.round((earnedCount / totalBadges) * 100) : 0}% Complete
          </div>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 hide-scrollbar">
        {categoryTabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
              selectedCategory === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Badges Grid */}
      {displayBadges.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {displayBadges.map((badge, index) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
            >
              <BadgeCard
                name={badge.name}
                description={badge.description}
                icon={badge.icon}
                color={badge.color}
                earned={badge.earned}
                earnedAt={badge.earnedAt}
                progress={badge.progress}
                requirementValue={badge.requirement_value}
              />
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Trophy className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground text-sm">No badges in this category</p>
        </div>
      )}

      <style>{`
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </Card>
  )
}
