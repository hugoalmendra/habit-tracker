import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface GroupStats {
  totalCompletions: number
  totalMembers: number
  mostActiveMembers: {
    user_id: string
    display_name: string | null
    photo_url: string | null
    completion_count: number
  }[]
  groupStreak: number
  avgCompletionsPerMember: number
  weeklyTrend: {
    thisWeek: number
    lastWeek: number
    percentageChange: number
  }
}

export function useGroupStats(groupId: string | null, memberIds: string[]) {
  return useQuery({
    queryKey: ['group-stats', groupId, memberIds],
    queryFn: async (): Promise<GroupStats> => {
      if (!groupId || !memberIds || memberIds.length === 0) {
        return {
          totalCompletions: 0,
          totalMembers: memberIds?.length || 0,
          mostActiveMembers: [],
          groupStreak: 0,
          avgCompletionsPerMember: 0,
          weeklyTrend: {
            thisWeek: 0,
            lastWeek: 0,
            percentageChange: 0,
          },
        }
      }

      // Get total completions by all group members
      const { data: allCompletions, error: completionsError } = await supabase
        .from('habit_completions')
        .select('user_id, created_at')
        .in('user_id', memberIds)

      if (completionsError) throw completionsError

      const totalCompletions = allCompletions?.length || 0

      // Get completions per member for most active calculation
      const completionsPerMember = allCompletions?.reduce((acc: any, completion: any) => {
        acc[completion.user_id] = (acc[completion.user_id] || 0) + 1
        return acc
      }, {}) || {}

      // Get top 3 most active members
      const topMembers = Object.entries(completionsPerMember)
        .sort(([, a]: any, [, b]: any) => b - a)
        .slice(0, 3)
        .map(([userId, count]) => ({ user_id: userId, completion_count: count }))

      // Fetch profiles for top members
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photo_url')
        .in('id', topMembers.map(m => m.user_id))

      const mostActiveMembers = topMembers.map((member: any) => {
        const profile = profiles?.find(p => p.id === member.user_id)
        return {
          ...member,
          display_name: profile?.display_name || null,
          photo_url: profile?.photo_url || null,
        }
      })

      // Calculate group streak (consecutive days with at least one completion)
      let groupStreak = 0
      if (allCompletions && allCompletions.length > 0) {
        const completionDates = [
          ...new Set(
            allCompletions.map((c: any) =>
              new Date(c.created_at).toISOString().split('T')[0]
            )
          ),
        ].sort((a, b) => new Date(b).getTime() - new Date(a).getTime())

        const today = new Date().toISOString().split('T')[0]
        if (completionDates[0] === today || completionDates[0] === getPreviousDate(today)) {
          groupStreak = 1
          for (let i = 1; i < completionDates.length; i++) {
            const expectedDate = getPreviousDate(completionDates[i - 1])
            if (completionDates[i] === expectedDate) {
              groupStreak++
            } else {
              break
            }
          }
        }
      }

      // Calculate average completions per member
      const avgCompletionsPerMember =
        memberIds.length > 0 ? totalCompletions / memberIds.length : 0

      // Calculate weekly trend
      const now = new Date()
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000)

      const thisWeekCompletions =
        allCompletions?.filter(
          (c: any) => new Date(c.created_at) >= oneWeekAgo
        ).length || 0

      const lastWeekCompletions =
        allCompletions?.filter(
          (c: any) =>
            new Date(c.created_at) >= twoWeeksAgo &&
            new Date(c.created_at) < oneWeekAgo
        ).length || 0

      const percentageChange =
        lastWeekCompletions > 0
          ? ((thisWeekCompletions - lastWeekCompletions) / lastWeekCompletions) * 100
          : thisWeekCompletions > 0
          ? 100
          : 0

      return {
        totalCompletions,
        totalMembers: memberIds.length,
        mostActiveMembers,
        groupStreak,
        avgCompletionsPerMember: Math.round(avgCompletionsPerMember * 10) / 10,
        weeklyTrend: {
          thisWeek: thisWeekCompletions,
          lastWeek: lastWeekCompletions,
          percentageChange: Math.round(percentageChange),
        },
      }
    },
    enabled: !!groupId && !!memberIds && memberIds.length > 0,
  })
}

// Helper function to get previous date string
function getPreviousDate(dateString: string): string {
  const date = new Date(dateString)
  date.setDate(date.getDate() - 1)
  return date.toISOString().split('T')[0]
}
