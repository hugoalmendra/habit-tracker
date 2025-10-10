import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Follower {
  id: string
  follower_id: string
  following_id: string
  status: 'pending' | 'accepted' | 'rejected'
  created_at: string
  updated_at: string
  follower?: {
    id: string
    display_name: string | null
    photo_url: string | null
  }
  following?: {
    id: string
    display_name: string | null
    photo_url: string | null
  }
}

export function useFollowers() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get users following me
  const { data: followers, isLoading: loadingFollowers } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      const { data: followersData, error } = await supabase
        .from('followers')
        .select('*')
        .eq('following_id', user!.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch profile data for each follower
      const followersWithProfiles = await Promise.all(
        (followersData || []).map(async (followerRow) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, photo_url')
            .eq('id', followerRow.follower_id)
            .maybeSingle()

          return {
            ...followerRow,
            follower: profile,
          }
        })
      )

      return followersWithProfiles as Follower[]
    },
    enabled: !!user,
  })

  // Get users I'm following
  const { data: following, isLoading: loadingFollowing } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      const { data: followingData, error } = await supabase
        .from('followers')
        .select('*')
        .eq('follower_id', user!.id)
        .eq('status', 'accepted')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch profile data for each person I'm following
      const followingWithProfiles = await Promise.all(
        (followingData || []).map(async (followingRow) => {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, display_name, photo_url')
            .eq('id', followingRow.following_id)
            .maybeSingle()

          return {
            ...followingRow,
            following: profile,
          }
        })
      )

      return followingWithProfiles as Follower[]
    },
    enabled: !!user,
  })

  // Check if I'm following a specific user
  const checkIsFollowing = async (userId: string): Promise<boolean> => {
    if (!user) return false

    const { data, error } = await supabase
      .from('followers')
      .select('id')
      .eq('follower_id', user.id)
      .eq('following_id', userId)
      .eq('status', 'accepted')
      .maybeSingle()

    if (error) throw error
    return !!data
  }

  // Follow a user
  const followMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('followers')
        .insert({
          follower_id: currentUser.id,
          following_id: userId,
          status: 'accepted',
        })
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] })
      queryClient.invalidateQueries({ queryKey: ['followers'] })
    },
  })

  // Unfollow a user
  const unfollowMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { data: { user: currentUser } } = await supabase.auth.getUser()
      if (!currentUser) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('followers')
        .delete()
        .eq('follower_id', currentUser.id)
        .eq('following_id', userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['following'] })
      queryClient.invalidateQueries({ queryKey: ['followers'] })
    },
  })

  return {
    followers,
    following,
    loadingFollowers,
    loadingFollowing,
    followUser: followMutation.mutateAsync,
    unfollowUser: unfollowMutation.mutateAsync,
    checkIsFollowing,
    isFollowing: followMutation.isPending,
    isUnfollowing: unfollowMutation.isPending,
  }
}
