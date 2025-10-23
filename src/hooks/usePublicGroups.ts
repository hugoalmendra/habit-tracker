import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

export interface PublicGroup {
  id: string
  name: string
  description: string | null
  avatar_url: string | null
  is_private: boolean
  created_by: string
  created_at: string
  updated_at: string
  member_count?: number
  is_member?: boolean
  is_admin?: boolean
  creator_profile?: {
    id: string
    display_name: string | null
    photo_url: string | null
  }
}

export interface GroupMember {
  id: string
  user_id: string
  group_id: string
  role: 'member' | 'admin'
  joined_at: string
  profile?: {
    id: string
    display_name: string | null
    photo_url: string | null
    username: string | null
  }
}

export interface GroupInvitation {
  id: string
  group_id: string
  invited_by: string
  invited_user_id: string
  status: 'pending' | 'accepted' | 'declined'
  created_at: string
  updated_at: string
  group?: PublicGroup
  inviter_profile?: {
    id: string
    display_name: string | null
    photo_url: string | null
  }
}

export function usePublicGroups() {
  const queryClient = useQueryClient()
  const { user } = useAuth()

  // Get all public groups (for discovery page)
  const { data: publicGroups, isLoading: loadingPublicGroups } = useQuery({
    queryKey: ['public-groups'],
    queryFn: async () => {
      const { data: groupsData, error } = await supabase
        .from('public_groups' as any)
        .select('*')
        .eq('is_private', false)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Get member counts and check if current user is a member
      const groupsWithDetails = await Promise.all(
        ((groupsData as any) || []).map(async (group: any) => {
          const { count } = await supabase
            .from('user_group_memberships' as any)
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          // Check if current user is a member
          let isMember = false
          let isAdmin = false
          if (user) {
            const { data: membership } = await supabase
              .from('user_group_memberships' as any)
              .select('role')
              .eq('group_id', group.id)
              .eq('user_id', user.id)
              .maybeSingle()

            isMember = !!membership
            isAdmin = (membership as any)?.role === 'admin'
          }

          // Get creator profile
          const { data: creatorProfile } = await supabase
            .from('profiles')
            .select('id, display_name, photo_url')
            .eq('id', group.created_by)
            .maybeSingle()

          return {
            ...group,
            member_count: count || 0,
            is_member: isMember,
            is_admin: isAdmin,
            creator_profile: creatorProfile
          }
        })
      )

      return groupsWithDetails as PublicGroup[]
    },
    enabled: true,
  })

  // Get user's joined groups (both public and private)
  const { data: myGroups, isLoading: loadingMyGroups } = useQuery({
    queryKey: ['my-groups', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data: memberships, error } = await supabase
        .from('user_group_memberships' as any)
        .select('group_id, role')
        .eq('user_id', user.id)

      if (error) throw error

      const groupIds = (memberships as any)?.map((m: any) => m.group_id) || []
      if (groupIds.length === 0) return []

      const { data: groupsData, error: groupsError } = await supabase
        .from('public_groups' as any)
        .select('*')
        .in('id', groupIds)
        .order('created_at', { ascending: false })

      if (groupsError) throw groupsError

      // Add membership details and member count
      const groupsWithDetails = await Promise.all(
        ((groupsData as any) || []).map(async (group: any) => {
          const membership = (memberships as any)?.find((m: any) => m.group_id === group.id)

          // Get member count for each group
          const { count } = await supabase
            .from('user_group_memberships' as any)
            .select('*', { count: 'exact', head: true })
            .eq('group_id', group.id)

          return {
            ...group,
            is_member: true,
            is_admin: membership?.role === 'admin',
            member_count: count || 0
          }
        })
      )

      return groupsWithDetails as PublicGroup[]
    },
    enabled: !!user,
  })

  // Get single group details
  const useGroupDetails = (groupId: string | null) => {
    return useQuery({
      queryKey: ['group-details', groupId],
      queryFn: async () => {
        if (!groupId) return null

        const { data: group, error } = await supabase
          .from('public_groups' as any)
          .select('*')
          .eq('id', groupId)
          .single()

        if (error) throw error

        // Get member count
        const { count } = await supabase
          .from('user_group_memberships' as any)
          .select('*', { count: 'exact', head: true })
          .eq('group_id', groupId)

        // Check if current user is a member
        let isMember = false
        let isAdmin = false
        if (user) {
          const { data: membership } = await supabase
            .from('user_group_memberships' as any)
            .select('role')
            .eq('group_id', groupId)
            .eq('user_id', user.id)
            .maybeSingle()

          isMember = !!membership
          isAdmin = (membership as any)?.role === 'admin'
        }

        // Get creator profile
        const { data: creatorProfile } = await supabase
          .from('profiles')
          .select('id, display_name, photo_url')
          .eq('id', (group as any).created_by)
          .maybeSingle()

        return {
          ...(group as any),
          member_count: count || 0,
          is_member: isMember,
          is_admin: isAdmin,
          creator_profile: creatorProfile
        } as PublicGroup
      },
      enabled: !!groupId,
    })
  }

  // Get group members
  const useGroupMembers = (groupId: string | null) => {
    return useQuery({
      queryKey: ['group-members', groupId],
      queryFn: async () => {
        if (!groupId) return []

        const { data: membersData, error } = await supabase
          .from('user_group_memberships' as any)
          .select('*')
          .eq('group_id', groupId)
          .order('joined_at', { ascending: true })

        if (error) throw error

        // Fetch profile data for each member
        const membersWithProfiles = await Promise.all(
          ((membersData as any) || []).map(async (member: any) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, display_name, photo_url')
              .eq('id', member.user_id)
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

  // Get user's invitations
  const { data: invitations, isLoading: loadingInvitations } = useQuery({
    queryKey: ['group-invitations', user?.id],
    queryFn: async () => {
      if (!user) return []

      const { data: invitationsData, error } = await supabase
        .from('group_invitations' as any)
        .select('*')
        .eq('invited_user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch group and inviter details for each invitation
      const invitationsWithDetails = await Promise.all(
        ((invitationsData as any) || []).map(async (invitation: any) => {
          const { data: group } = await supabase
            .from('public_groups' as any)
            .select('*')
            .eq('id', invitation.group_id)
            .maybeSingle()

          const { data: inviterProfile } = await supabase
            .from('profiles')
            .select('id, display_name, photo_url')
            .eq('id', invitation.invited_by)
            .maybeSingle()

          return {
            ...invitation,
            group,
            inviter_profile: inviterProfile
          }
        })
      )

      return invitationsWithDetails as GroupInvitation[]
    },
    enabled: !!user,
  })

  // Create a new group
  const createGroupMutation = useMutation({
    mutationFn: async (input: { name: string; description?: string; avatar_url?: string; is_private: boolean }) => {
      const { data: group, error } = await supabase
        .from('public_groups' as any)
        .insert({
          name: input.name,
          description: input.description || null,
          avatar_url: input.avatar_url || null,
          is_private: input.is_private,
          created_by: user!.id,
        })
        .select()
        .single()

      if (error) throw error
      return group
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-groups'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
    },
  })

  // Update group details
  const updateGroupMutation = useMutation({
    mutationFn: async (input: { groupId: string; name?: string; description?: string; avatar_url?: string; is_private?: boolean }) => {
      const updates: any = {}
      if (input.name !== undefined) updates.name = input.name
      if (input.description !== undefined) updates.description = input.description
      if (input.avatar_url !== undefined) updates.avatar_url = input.avatar_url
      if (input.is_private !== undefined) updates.is_private = input.is_private

      const { data, error } = await supabase
        .from('public_groups' as any)
        .update(updates)
        .eq('id', input.groupId)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-groups'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-details'] })
    },
  })

  // Delete a group
  const deleteGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('public_groups' as any)
        .delete()
        .eq('id', groupId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-groups'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
    },
  })

  // Join a public group
  const joinGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('user_group_memberships' as any)
        .insert({
          user_id: user!.id,
          group_id: groupId,
          role: 'member',
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-groups'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-details'] })
      queryClient.invalidateQueries({ queryKey: ['group-members'] })
    },
  })

  // Leave a group
  const leaveGroupMutation = useMutation({
    mutationFn: async (groupId: string) => {
      const { error } = await supabase
        .from('user_group_memberships' as any)
        .delete()
        .eq('group_id', groupId)
        .eq('user_id', user!.id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['public-groups'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-details'] })
      queryClient.invalidateQueries({ queryKey: ['group-members'] })
    },
  })

  // Invite user to private group
  const inviteUserMutation = useMutation({
    mutationFn: async (input: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('group_invitations' as any)
        .insert({
          group_id: input.groupId,
          invited_by: user!.id,
          invited_user_id: input.userId,
          status: 'pending',
        })

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] })
    },
  })

  // Accept invitation
  const acceptInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      // Update invitation status
      const { error: updateError } = await supabase
        .from('group_invitations' as any)
        .update({ status: 'accepted' })
        .eq('id', invitationId)

      if (updateError) throw updateError

      // Get the invitation to find the group_id
      const { data: invitation, error: invError } = await supabase
        .from('group_invitations' as any)
        .select('group_id')
        .eq('id', invitationId)
        .single()

      if (invError) throw invError

      // Join the group
      const { error: joinError } = await supabase
        .from('user_group_memberships' as any)
        .insert({
          user_id: user!.id,
          group_id: (invitation as any).group_id,
          role: 'member',
        })

      if (joinError) throw joinError
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] })
      queryClient.invalidateQueries({ queryKey: ['my-groups'] })
      queryClient.invalidateQueries({ queryKey: ['group-members'] })
    },
  })

  // Decline invitation
  const declineInvitationMutation = useMutation({
    mutationFn: async (invitationId: string) => {
      const { error } = await supabase
        .from('group_invitations' as any)
        .update({ status: 'declined' })
        .eq('id', invitationId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-invitations'] })
    },
  })

  // Remove member from group (admin only)
  const removeMemberMutation = useMutation({
    mutationFn: async (input: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('user_group_memberships' as any)
        .delete()
        .eq('group_id', input.groupId)
        .eq('user_id', input.userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members'] })
      queryClient.invalidateQueries({ queryKey: ['group-details'] })
    },
  })

  // Promote member to admin (admin only)
  const promoteToAdminMutation = useMutation({
    mutationFn: async (input: { groupId: string; userId: string }) => {
      const { error } = await supabase
        .from('user_group_memberships' as any)
        .update({ role: 'admin' })
        .eq('group_id', input.groupId)
        .eq('user_id', input.userId)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-members'] })
      queryClient.invalidateQueries({ queryKey: ['group-details'] })
    },
  })

  return {
    // Data
    publicGroups,
    myGroups,
    invitations,

    // Loading states
    loadingPublicGroups,
    loadingMyGroups,
    loadingInvitations,

    // Hooks
    useGroupDetails,
    useGroupMembers,

    // Mutations
    createGroup: createGroupMutation.mutateAsync,
    updateGroup: updateGroupMutation.mutateAsync,
    deleteGroup: deleteGroupMutation.mutateAsync,
    joinGroup: joinGroupMutation.mutateAsync,
    leaveGroup: leaveGroupMutation.mutateAsync,
    inviteUser: inviteUserMutation.mutateAsync,
    acceptInvitation: acceptInvitationMutation.mutateAsync,
    declineInvitation: declineInvitationMutation.mutateAsync,
    removeMember: removeMemberMutation.mutateAsync,
    promoteToAdmin: promoteToAdminMutation.mutateAsync,

    // Mutation states
    isCreating: createGroupMutation.isPending,
    isUpdating: updateGroupMutation.isPending,
    isDeleting: deleteGroupMutation.isPending,
    isJoining: joinGroupMutation.isPending,
    isLeaving: leaveGroupMutation.isPending,
    isInviting: inviteUserMutation.isPending,
    isRemoving: removeMemberMutation.isPending,
    isPromoting: promoteToAdminMutation.isPending,
  }
}
