import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { TrendingUp, TrendingDown, Flame, Target, Users, Trophy } from 'lucide-react'
import { useGroupStats } from '@/hooks/useGroupStats'
import Spinner from '@/components/ui/Spinner'

interface GroupStatsCardProps {
  groupId: string
  memberIds: string[]
}

export default function GroupStatsCard({ groupId, memberIds }: GroupStatsCardProps) {
  const { data: stats, isLoading } = useGroupStats(groupId, memberIds)

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <Spinner size="md" />
        </div>
      </Card>
    )
  }

  if (!stats) return null

  const trendIcon =
    stats.weeklyTrend.percentageChange > 0 ? (
      <TrendingUp className="h-4 w-4 text-green-500" />
    ) : stats.weeklyTrend.percentageChange < 0 ? (
      <TrendingDown className="h-4 w-4 text-red-500" />
    ) : null

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-4">Group Stats</h3>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Total Completions */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Target className="h-4 w-4" />
            <span>Total Completions</span>
          </div>
          <p className="text-2xl font-bold">{stats.totalCompletions}</p>
        </div>

        {/* Group Streak */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Flame className="h-4 w-4" />
            <span>Group Streak</span>
          </div>
          <p className="text-2xl font-bold">
            {stats.groupStreak} {stats.groupStreak === 1 ? 'day' : 'days'}
          </p>
        </div>

        {/* Avg per Member */}
        <div className="flex flex-col">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            <Users className="h-4 w-4" />
            <span>Avg per Member</span>
          </div>
          <p className="text-2xl font-bold">{stats.avgCompletionsPerMember}</p>
        </div>

        {/* Weekly Trend */}
        <div className="flex flex-col col-span-2 md:col-span-3">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
            {trendIcon}
            <span>This Week vs Last Week</span>
          </div>
          <div className="flex items-center gap-3">
            <p className="text-2xl font-bold">
              {stats.weeklyTrend.thisWeek}
            </p>
            <Badge
              variant={
                stats.weeklyTrend.percentageChange > 0
                  ? 'default'
                  : stats.weeklyTrend.percentageChange < 0
                  ? 'destructive'
                  : 'secondary'
              }
            >
              {stats.weeklyTrend.percentageChange > 0 && '+'}
              {stats.weeklyTrend.percentageChange}%
            </Badge>
            <span className="text-sm text-muted-foreground">
              vs {stats.weeklyTrend.lastWeek} last week
            </span>
          </div>
        </div>
      </div>

      {/* Most Active Members */}
      {stats.mostActiveMembers.length > 0 && (
        <div className="mt-6 pt-6 border-t">
          <div className="flex items-center gap-2 text-muted-foreground text-sm mb-3">
            <Trophy className="h-4 w-4" />
            <span>Most Active Members</span>
          </div>
          <div className="space-y-3">
            {stats.mostActiveMembers.map((member, index) => (
              <div key={member.user_id} className="flex items-center gap-3">
                <Badge
                  variant={index === 0 ? 'default' : 'secondary'}
                  className="w-6 h-6 flex items-center justify-center p-0"
                >
                  {index + 1}
                </Badge>
                <Avatar className="h-8 w-8">
                  <AvatarImage src={member.photo_url || undefined} />
                  <AvatarFallback>
                    {member.display_name?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">
                    {member.display_name || 'Unknown'}
                  </p>
                </div>
                <Badge variant="outline">
                  {member.completion_count} {member.completion_count === 1 ? 'completion' : 'completions'}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}
