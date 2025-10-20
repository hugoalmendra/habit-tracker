import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface FollowerGroup {
  id: string
  user_id: string
  name: string
  description: string | null
  created_at: string
  updated_at: string
  member_count?: number
  members?: GroupMember[]
}

export interface GroupMember {
  id: string
  group_id: string
  follower_id: string
  created_at: string
  profile?: {
    id: string
    display_name: string | null
    photo_url: string | null
  }
}

export function useFollowerGroups() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get all user's groups with member counts and members
  const { data: groups, isLoading: loadingGroups } = useQuery({
    queryKey: ['follower-groups', user?.id],
    queryFn: async () => {
      const { data: groupsData, error } = await supabase
        .from('follower_groups')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get member counts and members for each group
      const groupsWithMembers = await Promise.all(
        (groupsData || []).map(async (group) => {
          const { data: membersData, error: membersError } = await supabase
            .from('follower_group_members')
            .select('*')
            .eq('group_id', group.id)

          if (membersError) throw membersError

          // Fetch profile for each member
          const membersWithProfiles = await Promise.all(
            (membersData || []).map(async (member) => {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, display_name, photo_url')
                .eq('id', member.follower_id)
                .maybeSingle()

              return {
                ...member,
                profile
              }
            })
          )

          return {
            ...group,
            member_count: membersData?.length || 0,
            members: membersWithProfiles as GroupMember[]
          }
        })
      )

      return groupsWithMembers as FollowerGroup[]
    },
    enabled: !!user,
  })

  // Get single group with members
  const useGroupMembers = (groupId: string | null) => {
    return useQuery({
      queryKey: ['group-members', groupId],
      queryFn: async () => {
        if (!groupId) return []

        const { data: membersData, error } = await supabase
          .from('follower_group_members')
          .select('*')
          .eq('group_id', groupId)
          .order('created_at', { ascending: true })

        if (error) throw error

        // Fetch profile data for each member
        const membersWithProfiles = await Promise.all(
          (membersData || []).map(async (member) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, photo_url')
              .eq('id', member.follower_id)
              .maybeSingle()

            return {
              ...member,
              profile
            }
          })
        )

        return membersWithProfiles as GroupMember[]
      },
      enabled: !!groupId,
    })
  }

  // Create a new group
  const createGroupMutation = useMutation({
    mutationFn: async (input: { name: string; description?: string; memberIds: string[] }) => {
      // Create the group
      const { data: group, error: groupError } = await supabase
        .from('follower_groups')
        .insert({
          user_id: user!.id,
          name: input.name,
          description: input.description || null,
        })
        .select()
        .single()

      if (groupError) throw groupError

      // Add members if any
      if (input.memberIds.length > 0) {
        const members = input.memberIds.map(followerId => ({
          group_id: group.id,
          follower_id: followerId,
        }))

        const { error: membersError } = await supabase
          .from('follower_group_members')
          .insert(members)

        if (membersError) throw membersError
      }

      return group
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follower-groups'] })
    },
  })

  // Update group details
  const updateGroupMutation = useMutation({
    mutationFn: async (input: { groupId: string; name?: string; description?: string }) => {
      const updates: any = {}
      if (input.name !== undefined) updates.name = input.name
      if (input.description !== undefined) updates.description = input.description

      const { data, error } = await supabase
        .from('follower_groups')
        .update(updates)
        .eq('id', input.groupId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follower-groups'] })
    },
  })

  // Delete a group
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('follower_groups')
        .delete()
        .eq('id', groupId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['follower-groups'] })
    },
  })

  // Add members to a group
  const addMembersMutation = useMutation({
    mutationFn: async (input: { groupId: string; followerIds: string[] }) => {
      const members = input.followerIds.map(followerId => ({
        group_id: input.groupId,
        follower_id: followerId,
      }))

      const { error } = await supabase
        .from('follower_group_members')
        .insert(members)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follower-groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] })
    },
  })

  // Remove a member from a group
  const removeMemberMutation = useMutation({
    mutationFn: async (input: { groupId: string; memberId: string }) => {
      const { error } = await supabase
        .from('follower_group_members')
        .delete()
        .eq('id', input.memberId)

      if (error) throw error
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['follower-groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-members', variables.groupId] })
    },
  })

  return {
    groups,
    loadingGroups,
    useGroupMembers,
    createGroup: createGroupMutation.mutateAsync,
    updateGroup: updateGroupMutation.mutateAsync,
    deleteGroup: deleteGroupMutation.mutateAsync,
    addMembers: addMembersMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    isCreating: createGroupMutation.isPending,
    isUpdating: updateGroupMutation.isPending,
    isDeleting: deleteGroupMutation.isPending,
  }
}
