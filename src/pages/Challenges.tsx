import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useChallenges } from '@/hooks/useChallenges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Moon, Sun, Trophy, Calendar, Users, CheckCircle2, Target } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import NotificationsDropdown from '@/components/social/NotificationsDropdown'
import AvatarDropdown from '@/components/layout/AvatarDropdown'
import GlobalSearch from '@/components/layout/GlobalSearch'
import CreateChallengeModal from '@/components/challenges/CreateChallengeModal'

export default function Challenges() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'my' | 'joined'>('all')

  const { challenges, isLoading, respondToInvite } = useChallenges()

  const handleAcceptInvite = async (challengeId: string) => {
    await respondToInvite({ challengeId, status: 'accepted' })
  }

  const handleDeclineInvite = async (challengeId: string) => {
    await respondToInvite({ challengeId, status: 'declined' })
  }

  const filteredChallenges = challenges?.filter(challenge => {
    if (filter === 'my') return challenge.creator_id === user?.id
    if (filter === 'joined') return challenge.user_participation?.status === 'accepted' || challenge.user_participation?.status === 'completed'
    return true
  })

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      Health: '#34C759',
      Hustle: '#FF9500',
      Heart: '#FF2D55',
      Harmony: '#5E5CE6',
      Happiness: '#FFD60A',
    }
    return colors[category] || '#34C759'
  }

  const getDaysRemaining = (endDate: string) => {
    return differenceInDays(new Date(endDate), new Date())
  }

  return (
    <div className="min-h-screen bg-secondary pb-20 md:pb-0">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link to="/dashboard">
            <img
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="The Way of Kaizen"
              className="h-7 sm:h-8 w-auto cursor-pointer"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Dashboard
                </Button>
              </Link>
              <Link to="/progress">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Progress
                </Button>
              </Link>
              <Link to="/challenges">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Challenges
                </Button>
              </Link>
              <Link to="/feed">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Feed
                </Button>
              </Link>
            </nav>
            <GlobalSearch />
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <AvatarDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">Challenges</h1>
                <p className="text-sm text-muted-foreground">Compete with friends and earn badges</p>
              </div>
            </div>
            <Button
              onClick={() => setIsCreateChallengeOpen(true)}
              className="rounded-xl shadow-apple-sm"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Challenge
            </Button>
          </div>

          {/* Filter */}
          <div className="flex gap-2">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
              className="rounded-lg"
            >
              All Challenges
            </Button>
            <Button
              variant={filter === 'my' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('my')}
              className="rounded-lg"
            >
              My Challenges
            </Button>
            <Button
              variant={filter === 'joined' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('joined')}
              className="rounded-lg"
            >
              Joined
            </Button>
          </div>

          {/* Challenges Grid */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <p className="text-muted-foreground">Loading challenges...</p>
            </div>
          ) : filteredChallenges?.length === 0 ? (
            <Card className="p-16 text-center">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No challenges yet. Create one to get started!</p>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredChallenges?.map((challenge) => {
                const daysRemaining = getDaysRemaining(challenge.end_date)
                const isInvited = challenge.user_participation?.status === 'invited'
                const isActive = challenge.user_participation?.status === 'accepted'
                const isCompleted = challenge.user_participation?.status === 'completed'

                return (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Card
                      className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                      onClick={() => navigate(`/challenge/${challenge.id}`)}
                    >
                      {/* Header */}
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl"
                            style={{ backgroundColor: `${getCategoryColor(challenge.category)}20` }}
                          >
                            {challenge.badge_icon}
                          </div>
                          <div>
                            <h3 className="font-semibold">{challenge.name}</h3>
                            <p className="text-xs text-muted-foreground">{challenge.category}</p>
                          </div>
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        )}
                      </div>

                      {/* Description */}
                      {challenge.description && (
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {challenge.description}
                        </p>
                      )}

                      {/* Stats */}
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {daysRemaining > 0 ? `${daysRemaining} days left` : 'Ended'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {challenge.participant_count} participant{challenge.participant_count !== 1 ? 's' : ''}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Target className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {challenge.target_type === 'daily_completion' && `Complete ${challenge.target_value} days`}
                            {challenge.target_type === 'total_count' && `${challenge.target_value} completions`}
                            {challenge.target_type === 'streak' && `${challenge.target_value} day streak`}
                          </span>
                        </div>
                      </div>

                      {/* Progress */}
                      {isActive && (
                        <div className="mb-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs font-medium">Progress</span>
                            <span className="text-xs text-muted-foreground">
                              {challenge.user_participation?.current_progress}/{challenge.target_value}
                            </span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all"
                              style={{
                                width: `${Math.min((challenge.user_participation?.current_progress || 0) / challenge.target_value * 100, 100)}%`
                              }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Actions */}
                      {isInvited && (
                        <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            onClick={() => handleAcceptInvite(challenge.id)}
                            className="flex-1 rounded-lg"
                          >
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeclineInvite(challenge.id)}
                            className="flex-1 rounded-lg"
                          >
                            Decline
                          </Button>
                        </div>
                      )}

                      {/* Creator */}
                      <Link
                        to={challenge.creator_id === user?.id ? '/profile' : `/profile/${challenge.creator_id}`}
                        className="flex items-center gap-2 pt-4 border-t border-border mt-4 hover:opacity-80 transition-opacity"
                      >
                        <Avatar className="h-6 w-6 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                          <AvatarImage src={challenge.creator?.photo_url || undefined} />
                          <AvatarFallback className="text-xs">
                            {challenge.creator?.display_name?.[0]?.toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-xs text-muted-foreground hover:underline">
                          by {challenge.creator?.display_name}
                        </span>
                      </Link>
                    </Card>
                  </motion.div>
                )
              })}
            </div>
          )}
        </motion.div>
      </main>

      <CreateChallengeModal open={isCreateChallengeOpen} onOpenChange={setIsCreateChallengeOpen} />
    </div>
  )
}
