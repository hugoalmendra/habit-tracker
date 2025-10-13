import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Trophy, Sparkles, Target, Flame, Star } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import { FeedActivity } from '@/hooks/usePosts'
import { useAuth } from '@/contexts/AuthContext'

interface ActivityCardProps {
  activity: FeedActivity
}

export default function ActivityCard({ activity }: ActivityCardProps) {
  const { user } = useAuth()

  const getActivityIcon = () => {
    switch (activity.activity_type) {
      case 'habit_created':
        return <Sparkles className="h-5 w-5 text-blue-500" />
      case 'challenge_joined':
        return <Target className="h-5 w-5 text-purple-500" />
      case 'challenge_completed':
        return <Trophy className="h-5 w-5 text-yellow-500" />
      case 'streak_milestone':
        return <Flame className="h-5 w-5 text-orange-500" />
      case 'achievement_unlocked':
        return <Star className="h-5 w-5 text-green-500" />
      default:
        return <Sparkles className="h-5 w-5 text-primary" />
    }
  }

  const getActivityText = () => {
    const { metadata, activity_type } = activity

    switch (activity_type) {
      case 'habit_created':
        return (
          <span>
            created a new habit:{' '}
            <span className="font-semibold">
              {metadata.habit_emoji} {metadata.habit_name}
            </span>
          </span>
        )
      case 'challenge_joined':
        return (
          <span>
            joined the challenge:{' '}
            <span className="font-semibold">{metadata.challenge_name}</span>
          </span>
        )
      case 'challenge_completed':
        return (
          <span>
            completed the challenge:{' '}
            <span className="font-semibold">{metadata.challenge_name}</span>
            {' '}and earned a badge!
          </span>
        )
      case 'streak_milestone':
        return (
          <span>
            reached a{' '}
            <span className="font-semibold text-orange-500">
              {metadata.streak_count}-day streak
            </span>
            {' '}on{' '}
            <span className="font-semibold">
              {metadata.habit_emoji} {metadata.habit_name}
            </span>
          </span>
        )
      case 'achievement_unlocked':
        return <span>unlocked an achievement!</span>
      default:
        return <span>completed an activity</span>
    }
  }

  const getCategoryColor = (category: string | undefined) => {
    switch (category) {
      case 'Health':
        return 'bg-red-500/10 text-red-500'
      case 'Hustle':
        return 'bg-blue-500/10 text-blue-500'
      case 'Heart':
        return 'bg-pink-500/10 text-pink-500'
      case 'Harmony':
        return 'bg-green-500/10 text-green-500'
      case 'Happiness':
        return 'bg-yellow-500/10 text-yellow-500'
      default:
        return 'bg-primary/10 text-primary'
    }
  }

  return (
    <Card className="p-6 hover:shadow-lg transition-all">
      <div className="flex items-start gap-3">
        <Link
          to={activity.user_id === user?.id ? '/profile' : `/profile/${activity.user_id}`}
          className="shrink-0"
        >
          <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
            <AvatarImage src={activity.user?.photo_url || undefined} />
            <AvatarFallback>
              {activity.user?.display_name?.[0]?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
        </Link>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Link
              to={activity.user_id === user?.id ? '/profile' : `/profile/${activity.user_id}`}
              className="hover:underline"
            >
              <span className="font-semibold">{activity.user?.display_name}</span>
            </Link>
            <span className="text-muted-foreground">{getActivityText()}</span>
          </div>

          {/* Category Badge */}
          {(activity.metadata.habit_category || activity.metadata.challenge_category) && (
            <div className="flex items-center gap-2 mt-2">
              <span
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(
                  activity.metadata.habit_category || activity.metadata.challenge_category
                )}`}
              >
                {activity.metadata.habit_category || activity.metadata.challenge_category}
              </span>
            </div>
          )}

          {/* Challenge Badge Display */}
          {activity.activity_type === 'challenge_completed' &&
            activity.metadata.badge_icon &&
            activity.metadata.badge_color && (
              <div className="mt-3 flex items-center gap-2">
                <div
                  className="flex items-center justify-center h-12 w-12 rounded-full text-2xl"
                  style={{ backgroundColor: activity.metadata.badge_color }}
                >
                  {activity.metadata.badge_icon}
                </div>
                <span className="text-sm text-muted-foreground">Badge Earned</span>
              </div>
            )}

          <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
            {getActivityIcon()}
            <span>{formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}</span>
          </div>
        </div>
      </div>
    </Card>
  )
}
