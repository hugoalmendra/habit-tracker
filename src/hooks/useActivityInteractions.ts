import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface ActivityComment {
  id: string
  activity_id: string
  user_id: string
  content: string
  created_at: string
  user?: {
    display_name: string
    photo_url: string
  }
}

export function useActivityInteractions(activityId: string) {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get comments for an activity
  const { data: comments, isLoading: commentsLoading } = useQuery({
    queryKey: ['activity-comments', activityId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('activity_comments')
        .select('*')
        .eq('activity_id', activityId)
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

      return commentsWithUsers as ActivityComment[]
    },
    enabled: !!activityId,
  })

  // Toggle like on activity
  const toggleLikeMutation = useMutation({
    mutationFn: async (activityId: string) => {
      // Check if user already liked this activity
      const { data: existingLike } = await supabase
        .from('activity_likes')
        .select('id')
        .eq('activity_id', activityId)
        .eq('user_id', user!.id)
        .maybeSingle()

      if (existingLike) {
        // Unlike
        const { error } = await supabase
          .from('activity_likes')
          .delete()
          .eq('id', existingLike.id)

        if (error) throw error
      } else {
        // Like
        const { error } = await supabase
          .from('activity_likes')
          .insert({
            activity_id: activityId,
            user_id: user!.id,
          })

        if (error) throw error
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  // Add comment to activity
  const addCommentMutation = useMutation({
    mutationFn: async ({ activityId, content }: { activityId: string; content: string }) => {
      const { error } = await supabase
        .from('activity_comments')
        .insert({
          activity_id: activityId,
          user_id: user!.id,
          content: content.trim(),
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['activity-comments', activityId] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return {
    comments,
    commentsLoading,
    toggleLike: toggleLikeMutation.mutateAsync,
    addComment: addCommentMutation.mutateAsync,
  }
}
