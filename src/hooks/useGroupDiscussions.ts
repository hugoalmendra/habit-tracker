import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'

export interface GroupDiscussion {
  id: string
  group_id: string
  user_id: string
  content: string
  is_pinned: boolean
  created_at: string
  updated_at: string
  user_profile?: {
    id: string
    display_name: string | null
    photo_url: string | null
  }
  reactions?: DiscussionReaction[]
  reaction_count?: number
  user_has_reacted?: boolean
}

export interface DiscussionReaction {
  id: string
  discussion_id: string
  user_id: string
  reaction_type: string
  created_at: string
}

export function useGroupDiscussions(groupId: string | null) {
  const queryClient = useQueryClient()

  // Fetch all discussions for a group
  const {
    data: discussions,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['group-discussions', groupId],
    queryFn: async () => {
      if (!groupId) return []

      // Get discussions with user profiles
      const { data: discussionsData, error: discussionsError } = await supabase
        .from('group_discussions' as any)
        .select('*')
        .eq('group_id', groupId)
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false })

      if (discussionsError) throw discussionsError

      // Get user profiles for each discussion
      const userIds = [...new Set(discussionsData.map((d: any) => d.user_id))]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photo_url')
        .in('id', userIds)

      // Get reactions count for each discussion
      const discussionIds = discussionsData.map((d: any) => d.id)
      const { data: reactions } = await supabase
        .from('discussion_reactions' as any)
        .select('*')
        .in('discussion_id', discussionIds)

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()

      // Combine data
      const enrichedDiscussions = discussionsData.map((discussion: any) => {
        const userProfile = profiles?.find((p) => p.id === discussion.user_id)
        const discussionReactions = reactions?.filter(
          (r: any) => r.discussion_id === discussion.id
        ) || []
        const userHasReacted = discussionReactions.some(
          (r: any) => r.user_id === user?.id
        )

        return {
          ...discussion,
          user_profile: userProfile,
          reactions: discussionReactions,
          reaction_count: discussionReactions.length,
          user_has_reacted: userHasReacted,
        }
      })

      return enrichedDiscussions as GroupDiscussion[]
    },
    enabled: !!groupId,
  })

  // Create a new discussion
  const createDiscussion = useMutation({
    mutationFn: async ({ groupId, content }: { groupId: string; content: string }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('group_discussions' as any)
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-discussions', variables.groupId] })
    },
  })

  // Update a discussion
  const updateDiscussion = useMutation({
    mutationFn: async ({
      discussionId,
      content,
    }: {
      discussionId: string
      content: string
    }) => {
      const { data, error } = await supabase
        .from('group_discussions' as any)
        .update({ content })
        .eq('id', discussionId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-discussions'] })
    },
  })

  // Delete a discussion
  const deleteDiscussion = useMutation({
    mutationFn: async ({ discussionId, groupId }: { discussionId: string; groupId: string }) => {
      const { error } = await supabase
        .from('group_discussions' as any)
        .delete()
        .eq('id', discussionId)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-discussions', variables.groupId] })
    },
  })

  // Pin/unpin a discussion (admin only)
  const togglePin = useMutation({
    mutationFn: async ({
      discussionId,
      isPinned,
      groupId,
    }: {
      discussionId: string
      isPinned: boolean
      groupId: string
    }) => {
      const { data, error } = await supabase
        .from('group_discussions' as any)
        .update({ is_pinned: isPinned })
        .eq('id', discussionId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-discussions', variables.groupId] })
    },
  })

  // Add a reaction
  const addReaction = useMutation({
    mutationFn: async ({
      discussionId,
      groupId,
    }: {
      discussionId: string
      groupId: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { data, error } = await supabase
        .from('discussion_reactions' as any)
        .insert({
          discussion_id: discussionId,
          user_id: user.id,
          reaction_type: 'like',
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-discussions', variables.groupId] })
    },
  })

  // Remove a reaction
  const removeReaction = useMutation({
    mutationFn: async ({
      discussionId,
      groupId,
    }: {
      discussionId: string
      groupId: string
    }) => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Not authenticated')

      const { error } = await supabase
        .from('discussion_reactions' as any)
        .delete()
        .eq('discussion_id', discussionId)
        .eq('user_id', user.id)

      if (error) throw error
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['group-discussions', variables.groupId] })
    },
  })

  return {
    discussions,
    isLoading,
    error,
    createDiscussion: createDiscussion.mutate,
    updateDiscussion: updateDiscussion.mutate,
    deleteDiscussion: deleteDiscussion.mutate,
    togglePin: togglePin.mutate,
    addReaction: addReaction.mutate,
    removeReaction: removeReaction.mutate,
    isCreating: createDiscussion.isPending,
    isUpdating: updateDiscussion.isPending,
    isDeleting: deleteDiscussion.isPending,
    isTogglingPin: togglePin.isPending,
    isAddingReaction: addReaction.isPending,
    isRemovingReaction: removeReaction.isPending,
  }
}
