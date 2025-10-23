// @ts-nocheck
import { useQuery, useMutation, useQueryClient, useInfiniteQuery } from '@tanstack/react-query'
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
  activity_type: 'achievement_unlocked' | 'habit_created' | 'challenge_joined' | 'challenge_completed' | 'streak_milestone' | 'badge_earned'
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
    badge_id?: string
    badge_name?: string
    badge_description?: string
    streak_count?: number
    habit_id?: string
    final_progress?: number
    final_streak?: number
    is_grouped?: boolean
    grouped_count?: number
    grouped_items?: Array<{
      id: string
      name?: string
      category?: string
    }>
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

type FeedFilter = 'for_you' | 'following' | 'my_activity'

// Activity importance weights for ranking
const ACTIVITY_IMPORTANCE: Record<string, number> = {
  'challenge_completed': 10,
  'achievement_unlocked': 9,
  'streak_milestone': 8,
  'badge_earned': 8,
  'challenge_joined': 4,
  'habit_created': 3,
}

// Group similar activities from the same user on the same day
function groupActivities(activities: FeedActivity[]): FeedActivity[] {
  const groupableTypes = ['habit_created', 'challenge_joined', 'challenge_completed']
  const grouped: FeedActivity[] = []
  const groupMap = new Map<string, FeedActivity[]>()

  activities.forEach(activity => {
    if (!groupableTypes.includes(activity.activity_type)) {
      // Don't group important milestones/achievements
      grouped.push(activity)
      return
    }

    // Create grouping key: user_id + activity_type + same_day
    const activityDate = new Date(activity.created_at).toDateString()
    const groupKey = `${activity.user_id}-${activity.activity_type}-${activityDate}`

    if (!groupMap.has(groupKey)) {
      groupMap.set(groupKey, [])
    }
    groupMap.get(groupKey)!.push(activity)
  })

  // Process grouped activities
  groupMap.forEach(group => {
    if (group.length === 1) {
      // Single activity, don't group
      grouped.push(group[0])
    } else {
      // Multiple activities, create grouped item
      const firstActivity = group[0]
      const groupedActivity: FeedActivity = {
        ...firstActivity,
        metadata: {
          ...firstActivity.metadata,
          is_grouped: true,
          grouped_count: group.length,
          grouped_items: group.map(a => ({
            id: a.id,
            name: a.metadata.challenge_name || a.metadata.habit_name,
            category: a.metadata.challenge_category || a.metadata.habit_category,
          }))
        }
      }
      grouped.push(groupedActivity)
    }
  })

  return grouped
}

// Calculate engagement score based on likes and comments
function calculateEngagementScore(item: FeedItem): number {
  const likesCount = item.item_type === 'post' ? (item.reactions_count || 0) : (item.likes_count || 0)
  const commentsCount = item.comments_count || 0

  // Comments are worth more than likes (deeper engagement)
  const baseScore = (likesCount * 3) + (commentsCount * 5)

  // Viral bonus: Extra points for highly engaged content
  const totalInteractions = likesCount + commentsCount
  const viralBonus = totalInteractions >= 10 ? 20 :
                     totalInteractions >= 5 ? 10 : 0

  return baseScore + viralBonus
}

// Calculate recency bonus (favor trending over brand new)
function calculateRecencyBonus(createdAt: string): number {
  const now = new Date().getTime()
  const itemTime = new Date(createdAt).getTime()
  const hoursAgo = (now - itemTime) / (1000 * 60 * 60)

  // Favor "trending" content (1-3 days with engagement) over brand new
  if (hoursAgo < 6) return 8       // Last 6 hours - very fresh
  if (hoursAgo < 24) return 12     // Last day - trending sweet spot
  if (hoursAgo < 72) return 10     // Last 3 days - still trending
  if (hoursAgo < 168) return 5     // Last week - recent
  return 0
}

// Get importance score for activity type
function getImportanceScore(item: FeedItem): number {
  if (item.item_type === 'post') {
    // Posts with images are more engaging
    return 7 + ((item as Post).image_url ? 5 : 0)
  }

  return ACTIVITY_IMPORTANCE[item.activity_type] || 0
}

// Calculate combined score for ranking
function calculateCombinedScore(item: FeedItem): number {
  const engagementScore = calculateEngagementScore(item)
  const importanceScore = getImportanceScore(item)
  const recencyBonus = calculateRecencyBonus(item.created_at)

  return engagementScore + importanceScore + recencyBonus
}

// Apply diversity filter to limit same user domination
function diversifyFeed(items: FeedItem[], maxPerUser: number = 3): FeedItem[] {
  const userItemCount = new Map<string, number>()
  const diversified: FeedItem[] = []

  items.forEach(item => {
    const userId = item.user_id
    const currentCount = userItemCount.get(userId) || 0

    if (currentCount < maxPerUser) {
      diversified.push(item)
      userItemCount.set(userId, currentCount + 1)
    }
  })

  return diversified
}

const ITEMS_PER_PAGE = 15 // Reduced for faster initial load
const FETCH_SIZE = 30 // Reduced to minimize over-fetching

export function usePosts(filter: FeedFilter = 'for_you') {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['posts', filter],
    staleTime: 1000 * 60 * 1, // 1 minute for feed
    cacheTime: 1000 * 60 * 5, // Keep in cache for 5 minutes
    queryFn: async ({ pageParam = 0 }) => {
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
          return { items: [], nextPage: undefined }
        }
      }

      const from = pageParam * FETCH_SIZE
      const to = from + FETCH_SIZE - 1

      // For "My Activity" tab, fetch both posts and activities from current user
      if (filter === 'my_activity') {
        // Fetch user's posts
        const { data: postsData, error: postsError } = await supabase
          .from('posts')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .range(from, to)

        if (postsError) throw postsError

        // Fetch user's activities
        const { data: activitiesData, error: activitiesError } = await supabase
          .from('feed_activities')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false })
          .range(from, to)

        if (activitiesError && activitiesError.code !== 'PGRST116') throw activitiesError

        // Enrich posts with user data
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

        // Enrich activities with user data
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

            // Fetch habit/challenge names as needed
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

            if (activity.activity_type === 'badge_earned' && activity.metadata.badge_id) {
              const { data: badgeData } = await supabase
                .from('badge_definitions')
                .select('name, description, icon, color')
                .eq('id', activity.metadata.badge_id)
                .maybeSingle()

              if (badgeData) {
                activity.metadata = {
                  ...activity.metadata,
                  badge_name: badgeData.name,
                  badge_description: badgeData.description,
                  badge_icon: badgeData.icon,
                  badge_color: badgeData.color
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

        // Merge posts and activities, then sort by created_at
        const allItems = [...postsWithDetails, ...activitiesWithDetails]
        const sortedItems = allItems.sort((a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        )

        return {
          items: sortedItems as FeedItem[],
          nextPage: (postsData?.length || 0) + (activitiesData?.length || 0) >= FETCH_SIZE ? pageParam + 1 : undefined
        }
      }

      // Fetch posts with pagination
      const postsQuery = filter === 'following'
        ? supabase.from('posts').select('*').in('user_id', followingIds).order('created_at', { ascending: false }).range(from, to)
        : supabase.from('posts').select('*').eq('privacy', 'public').order('created_at', { ascending: false }).range(from, to)

      const { data: postsData, error: postsError } = await postsQuery
      if (postsError) throw postsError

      // Fetch activities with pagination
      const activitiesQuery = filter === 'following'
        ? supabase.from('feed_activities').select('*').in('user_id', followingIds).order('created_at', { ascending: false }).range(from, to)
        : supabase.from('feed_activities').select('*').order('created_at', { ascending: false }).range(from, to)

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

          // Fetch badge details for badge_earned activities
          if (activity.activity_type === 'badge_earned' && activity.metadata.badge_id) {
            const { data: badgeData } = await supabase
              .from('badge_definitions')
              .select('name, description, icon, color')
              .eq('id', activity.metadata.badge_id)
              .maybeSingle()

            if (badgeData) {
              activity.metadata = {
                ...activity.metadata,
                badge_name: badgeData.name,
                badge_description: badgeData.description,
                badge_icon: badgeData.icon,
                badge_color: badgeData.color
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

      // 1. Group similar activities
      const groupedActivities = groupActivities(activitiesWithDetails)

      // 2. Merge posts and grouped activities
      const allItems = [...postsWithDetails, ...groupedActivities]

      // 3. Calculate combined score for each item and sort
      const scoredAndSorted = allItems
        .map(item => ({
          ...item,
          _score: calculateCombinedScore(item) // Add temporary score field
        }))
        .sort((a, b) => b._score - a._score) // Sort by score (highest first)

      // 4. Apply diversity filter to prevent user domination
      const diversified = diversifyFeed(scoredAndSorted, 3)

      // 5. Remove temporary score field
      const finalFeed = diversified.map(({ _score, ...item }) => item)

      // Check if we got a full batch from the database (meaning there might be more data)
      const fetchedFullBatch = (postsData?.length || 0) + (activitiesData?.length || 0) >= FETCH_SIZE

      return {
        items: finalFeed as FeedItem[],
        nextPage: fetchedFullBatch ? pageParam + 1 : undefined
      }
    },
    getNextPageParam: (lastPage) => lastPage.nextPage,
    enabled: !!user,
    initialPageParam: 0,
  })

  // Flatten all pages into single array
  const feedItems = data?.pages.flatMap(page => page.items) ?? []

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
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
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
