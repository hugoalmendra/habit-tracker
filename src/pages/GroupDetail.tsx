import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Users, UserPlus, Lock, Globe, MoreVertical, LogOut, Edit2, Trash2, Shield, UserMinus, MessageCircle, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { usePublicGroups } from '@/hooks/usePublicGroups'
import { useAuth } from '@/contexts/AuthContext'
import Spinner from '@/components/ui/Spinner'
import EditPublicGroupModal from '@/components/groups/EditPublicGroupModal'
import InviteMembersModal from '@/components/groups/InviteMembersModal'
import GroupStatsCard from '@/components/groups/GroupStatsCard'
import GroupDiscussions from '@/components/groups/GroupDiscussions'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

export default function GroupDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false)

  const {
    useGroupDetails,
    useGroupMembers,
    joinGroup,
    leaveGroup,
    deleteGroup,
    removeMember,
    promoteToAdmin,
    isJoining,
    isLeaving,
    isRemoving,
    isPromoting,
  } = usePublicGroups()

  const { data: group, isLoading: loadingGroup } = useGroupDetails(id || null)
  const { data: members, isLoading: loadingMembers } = useGroupMembers(id || null)

  const isCreator = group?.created_by === user?.id
  const isMember = group?.is_member
  const isAdmin = group?.is_admin

  // Get member IDs for stats
  const memberIds = members?.map(m => m.user_id) || []

  const handleJoinGroup = async () => {
    if (!id) return
    try {
      await joinGroup(id)
    } catch (error) {
      console.error('Error joining group:', error)
    }
  }

  const handleLeaveGroup = async () => {
    if (!id) return

    // Check if user is an admin
    if (isAdmin && members) {
      const adminCount = members.filter(m => m.role === 'admin').length
      const totalMembers = members.length

      // If user is the only member, warn them the group will be deleted
      if (totalMembers === 1) {
        if (!confirm('You are the only member of this group. If you leave, the group will be automatically deleted. Are you sure you want to continue?')) {
          return
        }
      }
      // If user is the only admin but not the only member, warn them
      else if (adminCount === 1) {
        const confirmMessage = 'You are the only admin of this group. If you leave, the group will have no admins to manage it. Are you sure you want to continue?'
        if (!confirm(confirmMessage)) {
          return
        }
      }
      // Regular leave confirmation
      else if (!confirm('Are you sure you want to leave this group?')) {
        return
      }
    } else if (!confirm('Are you sure you want to leave this group?')) {
      return
    }

    try {
      await leaveGroup(id)
      navigate('/groups')
    } catch (error) {
      console.error('Error leaving group:', error)
    }
  }

  const handleDeleteGroup = async () => {
    if (!id) return
    if (confirm('Are you sure you want to delete this group? This action cannot be undone.')) {
      try {
        await deleteGroup(id)
        navigate('/groups')
      } catch (error) {
        console.error('Error deleting group:', error)
      }
    }
  }

  const handleRemoveMember = async (userId: string, memberName: string) => {
    if (!id) return
    if (confirm(`Are you sure you want to remove ${memberName} from this group?`)) {
      try {
        await removeMember({ groupId: id, userId })
      } catch (error) {
        console.error('Error removing member:', error)
        alert('Failed to remove member. Please try again.')
      }
    }
  }

  const handlePromoteToAdmin = async (userId: string, memberName: string) => {
    if (!id) return
    if (confirm(`Are you sure you want to promote ${memberName} to admin?`)) {
      try {
        await promoteToAdmin({ groupId: id, userId })
      } catch (error) {
        console.error('Error promoting member:', error)
        alert('Failed to promote member. Please try again.')
      }
    }
  }

  if (loadingGroup) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Spinner size="lg" text="Loading group..." />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Group not found</p>
          <Button onClick={() => navigate('/groups')} className="mt-4">
            Back to Groups
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <div className="border-b bg-background/95 backdrop-blur">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/groups')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>

            {isAdmin && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isCreator && (
                    <>
                      <DropdownMenuItem onClick={() => setIsEditModalOpen(true)}>
                        <Edit2 className="mr-2 h-4 w-4" />
                        Edit Group
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={handleDeleteGroup}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Group
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Group Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="p-8">
            <div className="flex flex-col sm:flex-row gap-6 items-start">
              <Avatar className="h-24 w-24">
                <AvatarImage src={group.avatar_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {group.name.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-2">
                  <h1 className="text-3xl font-bold">{group.name}</h1>
                  {group.is_private ? (
                    <Lock className="h-5 w-5 text-muted-foreground" />
                  ) : (
                    <Globe className="h-5 w-5 text-muted-foreground" />
                  )}
                </div>

                {group.description && (
                  <p className="text-muted-foreground mb-4">{group.description}</p>
                )}

                <div className="flex items-center gap-4 text-sm text-muted-foreground mb-6">
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                  </div>
                  {group.creator_profile && (
                    <div>
                      Created by{' '}
                      <span className="font-medium">
                        {group.creator_profile.display_name || 'Unknown'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  {isMember ? (
                    <>
                      {isAdmin && (
                        <Badge variant="secondary">
                          {isCreator ? 'Creator' : 'Admin'}
                        </Badge>
                      )}
                      {!isCreator && (
                        <Button
                          variant="outline"
                          onClick={handleLeaveGroup}
                          disabled={isLeaving}
                        >
                          <LogOut className="mr-2 h-4 w-4" />
                          Leave Group
                        </Button>
                      )}
                    </>
                  ) : (
                    <Button
                      onClick={handleJoinGroup}
                      disabled={isJoining || group.is_private}
                    >
                      <UserPlus className="mr-2 h-4 w-4" />
                      {group.is_private ? 'Private Group' : 'Join Group'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Members Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">
              Members ({members?.length || 0})
            </h2>
            {isAdmin && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsInviteModalOpen(true)}
              >
                <UserPlus className="mr-2 h-4 w-4" />
                Invite Members
              </Button>
            )}
          </div>

          {loadingMembers ? (
            <div className="flex justify-center py-8">
              <Spinner size="md" />
            </div>
          ) : members && members.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {members.map((member) => {
                const isCurrentUser = member.user_id === user?.id
                const isMemberAdmin = member.role === 'admin'
                const canManageMember = isAdmin && !isCurrentUser && member.user_id !== group?.created_by

                return (
                  <Card key={member.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.profile?.photo_url || undefined} />
                        <AvatarFallback>
                          {member.profile?.display_name?.substring(0, 2).toUpperCase() || '??'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {member.profile?.display_name || 'Unknown'}
                          {isCurrentUser && <span className="text-muted-foreground"> (You)</span>}
                        </p>
                      </div>
                      {isMemberAdmin && (
                        <Badge variant="secondary" className="text-xs">
                          Admin
                        </Badge>
                      )}
                      {canManageMember && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isRemoving || isPromoting}
                            >
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {!isMemberAdmin && (
                              <>
                                <DropdownMenuItem
                                  onClick={() => handlePromoteToAdmin(
                                    member.user_id,
                                    member.profile?.display_name || 'this member'
                                  )}
                                >
                                  <Shield className="mr-2 h-4 w-4" />
                                  Promote to Admin
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleRemoveMember(
                                member.user_id,
                                member.profile?.display_name || 'this member'
                              )}
                            >
                              <UserMinus className="mr-2 h-4 w-4" />
                              Remove from Group
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="p-8 text-center">
              <p className="text-muted-foreground">No members yet</p>
            </Card>
          )}
        </motion.div>

        {/* Group Stats Section */}
        {isMember && id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Group Stats
            </h2>
            <GroupStatsCard groupId={id} memberIds={memberIds} />
          </motion.div>
        )}

        {/* Discussion Section */}
        {isMember && id && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-6"
          >
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Discussion
            </h2>
            <GroupDiscussions groupId={id} isAdmin={isAdmin} />
          </motion.div>
        )}
      </div>

      {/* Edit Group Modal */}
      {group && (
        <EditPublicGroupModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          group={group}
        />
      )}

      {/* Invite Members Modal */}
      {group && id && (
        <InviteMembersModal
          isOpen={isInviteModalOpen}
          onClose={() => setIsInviteModalOpen(false)}
          groupId={id}
          groupName={group.name}
        />
      )}
    </div>
  )
}
