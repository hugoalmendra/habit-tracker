import { useState } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { useChallenges } from '@/hooks/useChallenges'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Plus, Moon, Sun, Trophy, Calendar, Users, CheckCircle2, ListChecks, ChevronDown, Lock } from 'lucide-react'
import { differenceInDays } from 'date-fns'
import NotificationsDropdown from '@/components/social/NotificationsDropdown'
import AvatarDropdown from '@/components/layout/AvatarDropdown'
import GlobalSearch from '@/components/layout/GlobalSearch'
import CreateChallengeModal from '@/components/challenges/CreateChallengeModal'
import { getIconComponent } from '@/components/ui/IconPicker'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Challenges() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isCreateChallengeOpen, setIsCreateChallengeOpen] = useState(false)
  const [filter, setFilter] = useState<'all' | 'joined' | 'past'>('all')
  const [sortFilter, setSortFilter] = useState<'recent' | 'oldest' | 'popular'>('recent')

  const { challenges, isLoading, respondToInvite, joinChallenge } = useChallenges()

  const handleAcceptInvite = async (challengeId: string) => {
    await respondToInvite({ challengeId, status: 'accepted' })
  }

  const handleDeclineInvite = async (challengeId: string) => {
    await respondToInvite({ challengeId, status: 'declined' })
  }

  const handleJoinChallenge = async (challengeId: string) => {
    await joinChallenge(challengeId)
  }

  const filteredChallenges = challenges?.filter(challenge => {
    const endDate = new Date(challenge.end_date)
    const isPast = endDate < new Date()

    // Filter by participation status and time
    if (filter === 'joined') {
      // Show challenges the user has joined (accepted or completed) or created
      const isJoined = challenge.user_participation?.status === 'accepted' ||
                       challenge.user_participation?.status === 'completed' ||
                       challenge.creator_id === user?.id
      if (!isJoined) return false
    }
    if (filter === 'past' && !isPast) return false
    if (filter !== 'past' && isPast) return false

    return true
  }).sort((a, b) => {
    // Sort challenges
    if (sortFilter === 'recent') {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    }
    if (sortFilter === 'oldest') {
      return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    }
    if (sortFilter === 'popular') {
      return (b.participant_count || 0) - (a.participant_count || 0)
    }
    return 0
  })

  const categories = [
    { name: 'Health', color: '#34C759', emoji: '💪' },
    { name: 'Career', color: '#FF9500', emoji: '🚀' },
    { name: 'Spirit', color: '#FF2D55', emoji: '❤️' },
    { name: 'Mindset', color: '#5E5CE6', emoji: '🧘' },
    { name: 'Joy', color: '#FFD60A', emoji: '😊' },
  ]


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
              <Plus className="h-4 w-4 md:mr-2" />
              <span className="hidden md:inline">New Challenge</span>
              <span className="md:hidden">New</span>
            </Button>
          </div>

          {/* Filters */}
          <div className="space-y-4">
            {/* Tabs - Ownership Filter */}
            <div className="flex gap-2 border-b border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter('all')}
                className={`rounded-none border-b-2 transition-colors ${
                  filter === 'all'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground'
                }`}
              >
                All Challenges
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter('joined')}
                className={`rounded-none border-b-2 transition-colors ${
                  filter === 'joined'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground'
                }`}
              >
                Joined
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilter('past')}
                className={`rounded-none border-b-2 transition-colors ${
                  filter === 'past'
                    ? 'border-primary text-foreground'
                    : 'border-transparent text-muted-foreground'
                }`}
              >
                Past Challenges
              </Button>
            </div>

            {/* Sort Filter */}
            <div className="flex justify-end">
              {/* Sort Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="rounded-lg h-8 gap-2">
                    Sort: {sortFilter === 'recent' ? 'Most Recent' : sortFilter === 'oldest' ? 'Oldest' : 'Most Popular'}
                    <ChevronDown className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setSortFilter('recent')}>
                    Most Recent
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortFilter('oldest')}>
                    Oldest
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortFilter('popular')}>
                    Most Popular
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
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
                const isCreator = challenge.creator_id === user?.id
                const hasNotJoined = !challenge.user_participation && !isCreator

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
                        <div className="flex items-center gap-3 flex-1">
                          <div
                            className="flex h-10 w-10 items-center justify-center rounded-xl text-2xl"
                            style={{ backgroundColor: `${challenge.badge_color || '#3b82f6'}20` }}
                          >
                            {challenge.icon_name && (() => {
                              const IconComponent = getIconComponent(challenge.icon_name)
                              return IconComponent ? (
                                <IconComponent
                                  className="h-6 w-6"
                                  style={{ color: challenge.badge_color || '#3b82f6' }}
                                />
                              ) : challenge.badge_icon
                            })() || challenge.badge_icon}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold">{challenge.name}</h3>
                              {!challenge.is_public && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-muted text-muted-foreground text-xs">
                                  <Lock className="h-3 w-3" />
                                  Private
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        {isCompleted && (
                          <CheckCircle2 className="h-5 w-5 text-primary shrink-0" />
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
                          <ListChecks className="h-4 w-4 text-muted-foreground" />
                          <span className="text-muted-foreground">
                            {challenge.habits?.length || 0} habit{(challenge.habits?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      {isActive && challenge.user_participation?.badge_earned && (
                        <div className="mb-4">
                          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400">
                            <Trophy className="h-3 w-3" />
                            Badge Earned
                          </span>
                        </div>
                      )}

                      {/* Actions */}
                      {isInvited && (
                        <div className="flex gap-2 mb-4" onClick={(e) => e.stopPropagation()}>
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

                      {hasNotJoined && daysRemaining > 0 && (
                        <div className="mb-4" onClick={(e) => e.stopPropagation()}>
                          <Button
                            size="sm"
                            onClick={() => handleJoinChallenge(challenge.id)}
                            className="w-full rounded-lg"
                          >
                            Join Challenge
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
