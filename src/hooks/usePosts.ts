// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface Post {
  id: string
  user_id: string
  content: string
  privacy: 'public' | 'friends' | 'private'
  image_url?: string
  created_at: string
  updated_at: string
  user?: {
    id: string
    display_name: string
    photo_url: string
  }
  comments_count?: number
  reactions_count?: number
  user_reaction?: string | null
}

export interface FeedActivity {
  id: string
  user_id: string
  activity_type: 'achievement_unlocked' | 'habit_created' | 'challenge_joined' | 'challenge_completed' | 'streak_milestone'
  related_id: string | null
  metadata: {
    habit_name?: string
    habit_category?: string
    habit_emoji?: string
    challenge_id?: string
    challenge_name?: string
    challenge_category?: string
    badge_icon?: string
    badge_color?: string
    streak_count?: number
    habit_id?: string
    final_progress?: number
    final_streak?: number
  }
  created_at: string
  user?: {
    id: string
    display_name: string
    photo_url: string
  }
  likes_count?: number
  comments_count?: number
  user_liked?: boolean
}

export type FeedItem = (Post & { item_type: 'post' }) | (FeedActivity & { item_type: 'activity' })

export interface Comment {
  id: string
  post_id: string
  user_id: string
  content: string
  created_at: string
  user?: {
    display_name: string
    photo_url: string
  }
}

export interface Reaction {
  id: string
  post_id: string
  user_id: string
  reaction: 'like' | 'celebrate' | 'support' | 'love' | 'fire'
  created_at: string
}

type FeedFilter = 'for_you' | 'following'

export function usePosts(filter: FeedFilter = 'for_you') {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const { data: feedItems, isLoading } = useQuery({
    queryKey: ['posts', filter],
    queryFn: async () => {
      let followingIds: string[] = []

      if (filter === 'following') {
        // Get posts only from people I follow
        const { data: following } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user!.id)
          .eq('status', 'accepted')

        followingIds = following?.map(f => f.following_id) || []

        if (followingIds.length === 0) {
          return []
        }
      }

      // Fetch posts
      const postsQuery = filter === 'following'
        ? supabase.from('posts').select('*').in('user_id', followingIds).order('created_at', { ascending: false })
        : supabase.from('posts').select('*').eq('privacy', 'public').order('created_at', { ascending: false }).limit(50)

      const { data: postsData, error: postsError } = await postsQuery
      if (postsError) throw postsError

      // Fetch activities
      const activitiesQuery = filter === 'following'
        ? supabase.from('feed_activities').select('*').in('user_id', followingIds).order('created_at', { ascending: false })
        : supabase.from('feed_activities').select('*').order('created_at', { ascending: false }).limit(50)

      const { data: activitiesData, error: activitiesError } = await activitiesQuery
      if (activitiesError && activitiesError.code !== 'PGRST116') throw activitiesError

      // Fetch user details, comments count, and reactions for each post
      const postsWithDetails = await Promise.all(
        (postsData || []).map(async (post) => {
          const [userData, commentsData, reactionsData, userReactionData] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, display_name, photo_url')
              .eq('id', post.user_id)
              .maybeSingle(),
            supabase
              .from('post_comments')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            supabase
              .from('post_reactions')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            supabase
              .from('post_reactions')
              .select('reaction')
              .eq('post_id', post.id)
              .eq('user_id', user!.id)
              .maybeSingle()
          ])

          return {
            ...post,
            item_type: 'post' as const,
            user: userData.data,
            comments_count: commentsData.count || 0,
            reactions_count: reactionsData.count || 0,
            user_reaction: userReactionData.data?.reaction || null
          }
        })
      )

      // Enrich activities with related data (habit names, challenge names, etc.)
      const activitiesWithDetails = await Promise.all(
        (activitiesData || []).map(async (activity) => {
          const [userData, likesData, commentsData, userLikeData] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, display_name, photo_url')
              .eq('id', activity.user_id)
              .maybeSingle(),
            supabase
              .from('activity_likes')
              .select('id', { count: 'exact', head: true })
              .eq('activity_id', activity.id),
            supabase
              .from('activity_comments')
              .select('id', { count: 'exact', head: true })
              .eq('activity_id', activity.id),
            supabase
              .from('activity_likes')
              .select('id')
              .eq('activity_id', activity.id)
              .eq('user_id', user!.id)
              .maybeSingle()
          ])

          // Fetch habit name if it's a habit-related activity
          if (activity.activity_type === 'habit_created' && activity.related_id) {
            const { data: habitData } = await supabase
              .from('habits')
              .select('name, category')
              .eq('id', activity.related_id)
              .maybeSingle()

            if (habitData) {
              activity.metadata = {
                ...activity.metadata,
                habit_name: habitData.name,
                habit_category: habitData.category
              }
            }
          }

          // Fetch challenge name if it's a challenge-related activity
          if ((activity.activity_type === 'challenge_joined' || activity.activity_type === 'challenge_completed') &&
              activity.metadata.challenge_id) {
            const { data: challengeData } = await supabase
              .from('challenges')
              .select('name, category, badge_icon, badge_color')
              .eq('id', activity.metadata.challenge_id)
              .maybeSingle()

            if (challengeData) {
              activity.metadata = {
                ...activity.metadata,
                challenge_name: challengeData.name,
                challenge_category: challengeData.category,
                badge_icon: challengeData.badge_icon,
                badge_color: challengeData.badge_color
              }
            }
          }

          // Fetch habit name for streak milestones
          if (activity.activity_type === 'streak_milestone' && activity.metadata.habit_id) {
            const { data: habitData } = await supabase
              .from('habits')
              .select('name')
              .eq('id', activity.metadata.habit_id)
              .maybeSingle()

            if (habitData) {
              activity.metadata = {
                ...activity.metadata,
                habit_name: habitData.name
              }
            }
          }

          return {
            ...activity,
            item_type: 'activity' as const,
            user: userData.data,
            likes_count: likesData.count || 0,
            comments_count: commentsData.count || 0,
            user_liked: !!userLikeData.data
          }
        })
      )

      // Merge and sort posts and activities by created_at
      const allItems = [...postsWithDetails, ...activitiesWithDetails].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      )

      return allItems as FeedItem[]
    },
    enabled: !!user,
  })

  const createPostMutation = useMutation({
    mutationFn: async (input: { content: string; privacy: 'public' | 'friends' | 'private'; image_url?: string }) => {
      const { data, error } = await supabase
        .from('posts')
        .insert({
          user_id: user!.id,
          content: input.content,
          privacy: input.privacy,
          image_url: input.image_url,
        })
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const deletePostMutation = useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const toggleReactionMutation = useMutation({
    mutationFn: async ({ postId, reaction }: { postId: string; reaction: string }) => {
      // Check if user already reacted
      const { data: existing } = await supabase
        .from('post_reactions')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user!.id)
        .maybeSingle()

      if (existing) {
        // Remove reaction
        const { error } = await supabase
          .from('post_reactions')
          .delete()
          .eq('id', existing.id)

        if (error) throw error
        return { action: 'removed' }
      } else {
        // Add reaction
        const { error } = await supabase
          .from('post_reactions')
          .insert({
            post_id: postId,
            user_id: user!.id,
            reaction,
          })

        if (error) throw error
        return { action: 'added' }
      }
    },
    onMutate: async ({ postId, reaction }) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['posts'] })

      // Snapshot previous values
      const previousData = queryClient.getQueriesData({ queryKey: ['posts'] })

      // Optimistically update all post queries
      queryClient.setQueriesData({ queryKey: ['posts'] }, (old: FeedItem[] | undefined) => {
        if (!old) return old

        return old.map(item => {
          if (item.item_type === 'post' && item.id === postId) {
            const isCurrentlyLiked = item.user_reaction === reaction
            return {
              ...item,
              user_reaction: isCurrentlyLiked ? null : reaction,
              reactions_count: isCurrentlyLiked
                ? Math.max(0, (item.reactions_count || 0) - 1)
                : (item.reactions_count || 0) + 1
            }
          }
          return item
        })
      })

      return { previousData }
    },
    onError: (_err, _input, context) => {
      // Rollback on error
      if (context?.previousData) {
        context.previousData.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data)
        })
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  const addCommentMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const { data, error } = await supabase
        .from('post_comments')
        .insert({
          post_id: postId,
          user_id: user!.id,
          content,
        })
        .select()
        .maybeSingle()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })

  return {
    posts: feedItems,
    isLoading,
    createPost: createPostMutation.mutateAsync,
    deletePost: deletePostMutation.mutateAsync,
    toggleReaction: toggleReactionMutation.mutateAsync,
    addComment: addCommentMutation.mutateAsync,
  }
}

export function useComments(postId: string) {
  const { user } = useAuth()

  const { data: comments, isLoading } = useQuery({
    queryKey: ['comments', postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('post_comments')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: true })

      if (error) throw error

      // Fetch user details for each comment
      const commentsWithUsers = await Promise.all(
        (data || []).map(async (comment) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('display_name, photo_url')
            .eq('id', comment.user_id)
            .maybeSingle()

          return {
            ...comment,
            user: userData
          }
        })
      )

      return commentsWithUsers as Comment[]
    },
    enabled: !!user && !!postId,
  })

  return {
    comments,
    isLoading,
  }
}

export interface ReactionUser {
  id: string
  user_id: string
  reaction: 'like' | 'celebrate' | 'support' | 'love' | 'fire'
  created_at: string
  user?: {
    id: string
    display_name: string
    photo_url: string
  }
}

export function usePostReactions(postId: string | null) {
  const { user } = useAuth()

  const { data: reactions, isLoading } = useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: async () => {
      if (!postId) return []

      const { data, error } = await supabase
        .from('post_reactions')
        .select('*')
        .eq('post_id', postId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch user details for each reaction
      const reactionsWithUsers = await Promise.all(
        (data || []).map(async (reaction) => {
          const { data: userData } = await supabase
            .from('profiles')
            .select('id, display_name, photo_url')
            .eq('id', reaction.user_id)
            .maybeSingle()

          return {
            ...reaction,
            user: userData
          }
        })
      )

      return reactionsWithUsers as ReactionUser[]
    },
    enabled: !!user && !!postId,
  })

  return {
    reactions,
    isLoading,
  }
}
