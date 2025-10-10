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

  const { data: posts, isLoading } = useQuery({
    queryKey: ['posts', filter],
    queryFn: async () => {
      if (filter === 'following') {
        // Get posts only from people I follow
        const { data: following } = await supabase
          .from('followers')
          .select('following_id')
          .eq('follower_id', user!.id)
          .eq('status', 'accepted')

        const followingIds = following?.map(f => f.following_id) || []

        if (followingIds.length === 0) {
          return []
        }

        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .in('user_id', followingIds)
          .order('created_at', { ascending: false })

        if (error) throw error

        // Fetch user details, comments count, and reactions for each post
        const postsWithDetails = await Promise.all(
          (data || []).map(async (post) => {
            const [userData, commentsData, reactionsData, userReactionData] = await Promise.all([
              supabase
                .from('profiles')
                .select('id, display_name, photo_url')
                .eq('id', post.user_id)
                .single(),
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
              user: userData.data,
              comments_count: commentsData.count || 0,
              reactions_count: reactionsData.count || 0,
              user_reaction: userReactionData.data?.reaction || null
            }
          })
        )

        return postsWithDetails as Post[]
      }

      // For You feed: Show all public posts from all users
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('privacy', 'public')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      // Fetch user details, comments count, and reactions for each post
      const postsWithDetails = await Promise.all(
        (data || []).map(async (post) => {
          const [userData, commentsData, reactionsData, userReactionData] = await Promise.all([
            supabase
              .from('profiles')
              .select('id, display_name, photo_url')
              .eq('id', post.user_id)
              .single(),
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
            user: userData.data,
            comments_count: commentsData.count || 0,
            reactions_count: reactionsData.count || 0,
            user_reaction: userReactionData.data?.reaction || null
          }
        })
      )

      return postsWithDetails as Post[]
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
        .single()

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
      }
    },
    onSuccess: () => {
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
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      queryClient.invalidateQueries({ queryKey: ['comments'] })
    },
  })

  return {
    posts,
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
            .single()

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
