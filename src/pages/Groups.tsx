import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { usePublicGroups } from '@/hooks/usePublicGroups'
import { markGroupsAsVisited } from '@/hooks/useGroupNotifications'
import GroupsNotificationBadge from '@/components/groups/GroupsNotificationBadge'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Plus, Moon, Sun, Users, Lock, Globe, ChevronDown, Search, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import NotificationsDropdown from '@/components/social/NotificationsDropdown'
import AvatarDropdown from '@/components/layout/AvatarDropdown'
import GlobalSearch from '@/components/layout/GlobalSearch'
import Spinner from '@/components/ui/Spinner'
import CreatePublicGroupModal from '@/components/groups/CreatePublicGroupModal'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export default function Groups() {
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false)
  const [tab, setTab] = useState<'discover' | 'my-groups' | 'invitations'>('discover')
  const [sortFilter, setSortFilter] = useState<'recent' | 'popular' | 'oldest'>('recent')
  const [searchQuery, setSearchQuery] = useState('')

  const {
    publicGroups,
    myGroups,
    invitations,
    loadingPublicGroups,
    loadingMyGroups,
    loadingInvitations,
    joinGroup,
    leaveGroup,
    acceptInvitation,
    declineInvitation,
    isJoining,
    isLeaving,
  } = usePublicGroups()

  // Mark groups as visited to clear notification badge
  useEffect(() => {
    markGroupsAsVisited()
  }, [])

  const handleJoinGroup = async (groupId: string) => {
    await joinGroup(groupId)
  }

  const handleLeaveGroup = async (groupId: string) => {
    // Find the group to check if user is admin/creator
    const group = [...(publicGroups || []), ...(myGroups || [])].find(g => g.id === groupId)

    if (group && group.is_admin) {
      // Fetch members to check member count and admin count
      const { data: members } = await supabase
        .from('user_group_memberships' as any)
        .select('role')
        .eq('group_id', groupId)

      const totalMembers = (members as any)?.length || 0
      const adminCount = (members as any)?.filter((m: any) => m.role === 'admin').length || 0

      // If user is the only member, warn them the group will be deleted
      if (totalMembers === 1) {
        if (!confirm('You are the only member of this group. If you leave, the group will be automatically deleted. Are you sure you want to continue?')) {
          return
        }
      }
      // If user is the only admin but not the only member, warn them
      else if (adminCount === 1) {
        if (!confirm('You are the only admin of this group. If you leave, the group will have no admins to manage it. Are you sure you want to continue?')) {
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

    await leaveGroup(groupId)
  }

  const handleAcceptInvitation = async (invitationId: string) => {
    await acceptInvitation(invitationId)
  }

  const handleDeclineInvitation = async (invitationId: string) => {
    await declineInvitation(invitationId)
  }

  // Filter and sort groups
  const filterAndSortGroups = (groups: any[], excludeMyGroups: boolean = false) => {
    // Filter by search query
    let filtered = groups?.filter(group =>
      group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      group.description?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || []

    // For discover tab, exclude groups user is already a member of
    if (excludeMyGroups) {
      filtered = filtered.filter(group => !group.is_member)
    }

    // Sort the filtered results
    return filtered.sort((a, b) => {
      if (sortFilter === 'recent') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      }
      if (sortFilter === 'oldest') {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      }
      if (sortFilter === 'popular') {
        return (b.member_count || 0) - (a.member_count || 0)
      }
      return 0
    })
  }

  const sortedPublicGroups = filterAndSortGroups(publicGroups || [], true)
  const sortedMyGroups = filterAndSortGroups(myGroups || [])

  const isLoading = tab === 'discover' ? loadingPublicGroups : tab === 'my-groups' ? loadingMyGroups : loadingInvitations

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-8">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link to="/dashboard">
            <img
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="The Way of Kaizen"
              className="h-7 sm:h-8 w-auto cursor-pointer"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Dashboard
                </Button>
              </Link>
              <Link to="/progress">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Progress
                </Button>
              </Link>
              <Link to="/challenges">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Challenges
                </Button>
              </Link>
              <Link to="/groups">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium relative">
                  Groups
                  <GroupsNotificationBadge />
                </Button>
              </Link>
              <Link to="/feed">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Feed
                </Button>
              </Link>
            </nav>
            <GlobalSearch />
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <AvatarDropdown />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 sm:py-12 sm:px-6 lg:px-8">
        {/* Search Bar */}
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search groups..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-10"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                onClick={() => setSearchQuery('')}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Tabs and Actions */}
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2">
            <Button
              variant={tab === 'discover' ? 'default' : 'outline'}
              onClick={() => setTab('discover')}
            >
              <Globe className="mr-2 h-4 w-4" />
              Discover
            </Button>
            <Button
              variant={tab === 'my-groups' ? 'default' : 'outline'}
              onClick={() => setTab('my-groups')}
            >
              <Users className="mr-2 h-4 w-4" />
              My Groups
            </Button>
            <Button
              variant={tab === 'invitations' ? 'default' : 'outline'}
              onClick={() => setTab('invitations')}
              className="relative"
            >
              Invitations
              {invitations && invitations.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {invitations.length}
                </Badge>
              )}
            </Button>
          </div>

          <div className="flex gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Sort by: {sortFilter === 'recent' ? 'Recent' : sortFilter === 'popular' ? 'Popular' : 'Oldest'}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => setSortFilter('recent')}>
                  Recent
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortFilter('popular')}>
                  Popular
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setSortFilter('oldest')}>
                  Oldest
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <Button onClick={() => setIsCreateGroupOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Group
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Spinner size="lg" text="Loading groups..." />
          </div>
        ) : (
          <>
            {/* Discover Tab */}
            {tab === 'discover' && (
              <>
                {sortedPublicGroups.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Globe className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No public groups yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Be the first to create a group and build a community!
                    </p>
                    <Button onClick={() => setIsCreateGroupOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" />
                      Create First Group
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedPublicGroups.map((group) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex"
                      >
                        <Card className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col w-full">
                          {/* Cover Photo */}
                          <div
                            className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden"
                            onClick={() => navigate(`/groups/${group.id}`)}
                          >
                            {group.avatar_url ? (
                              <img
                                src={group.avatar_url}
                                alt={group.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-5xl font-bold text-primary/10">
                                  {group.name.substring(0, 2).toUpperCase()}
                                </div>
                              </div>
                            )}
                            {group.is_private && (
                              <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm rounded-full p-1.5">
                                <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className="p-4 flex-1 flex flex-col" onClick={() => navigate(`/groups/${group.id}`)}>
                            <h3 className="font-semibold truncate mb-1">{group.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                              {group.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                            </div>
                          </div>

                          {/* Action Button */}
                          <div className="px-4 pb-4 mt-auto" onClick={(e) => e.stopPropagation()}>
                            {group.is_member ? (
                              <Button
                                variant="outline"
                                className="w-full"
                                onClick={() => handleLeaveGroup(group.id)}
                                disabled={isLeaving}
                              >
                                {group.is_admin ? 'Manage Group' : 'Leave Group'}
                              </Button>
                            ) : (
                              <Button
                                className="w-full"
                                onClick={() => handleJoinGroup(group.id)}
                                disabled={isJoining || group.is_private}
                              >
                                {group.is_private ? 'Private Group' : 'Join Group'}
                              </Button>
                            )}
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* My Groups Tab */}
            {tab === 'my-groups' && (
              <>
                {sortedMyGroups.length === 0 ? (
                  <Card className="p-12 text-center">
                    <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Join a group or create your own to get started!
                    </p>
                    <div className="flex gap-2 justify-center">
                      <Button variant="outline" onClick={() => setTab('discover')}>
                        Discover Groups
                      </Button>
                      <Button onClick={() => setIsCreateGroupOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Group
                      </Button>
                    </div>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {sortedMyGroups.map((group) => (
                      <motion.div
                        key={group.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex"
                      >
                        <Card
                          className="overflow-hidden hover:shadow-lg transition-shadow cursor-pointer flex flex-col w-full"
                          onClick={() => navigate(`/groups/${group.id}`)}
                        >
                          {/* Cover Photo */}
                          <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
                            {group.avatar_url ? (
                              <img
                                src={group.avatar_url}
                                alt={group.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-5xl font-bold text-primary/10">
                                  {group.name.substring(0, 2).toUpperCase()}
                                </div>
                              </div>
                            )}
                            <div className="absolute top-2 right-2 flex gap-1">
                              {group.is_admin && (
                                <Badge variant="secondary" className="text-xs shadow-sm">
                                  Admin
                                </Badge>
                              )}
                              {group.is_private && (
                                <div className="bg-background/80 backdrop-blur-sm rounded-full p-1.5">
                                  <Lock className="h-3.5 w-3.5 text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Card Content */}
                          <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-semibold truncate mb-1">{group.name}</h3>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">
                              {group.description || 'No description'}
                            </p>
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <Users className="h-3.5 w-3.5" />
                              {group.member_count} {group.member_count === 1 ? 'member' : 'members'}
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}

            {/* Invitations Tab */}
            {tab === 'invitations' && (
              <>
                {!invitations || invitations.length === 0 ? (
                  <Card className="p-12 text-center">
                    <h3 className="text-lg font-semibold mb-2">No pending invitations</h3>
                    <p className="text-muted-foreground">
                      You don't have any group invitations at the moment.
                    </p>
                  </Card>
                ) : (
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {invitations.map((invitation) => (
                      <motion.div
                        key={invitation.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex"
                      >
                        <Card className="overflow-hidden flex flex-col w-full">
                          {/* Cover Photo */}
                          <div className="relative h-32 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
                            {invitation.group?.avatar_url ? (
                              <img
                                src={invitation.group.avatar_url}
                                alt={invitation.group?.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <div className="text-5xl font-bold text-primary/10">
                                  {invitation.group?.name.substring(0, 2).toUpperCase()}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Card Content */}
                          <div className="p-4 flex-1 flex flex-col">
                            <h3 className="font-semibold truncate mb-1">{invitation.group?.name}</h3>
                            <p className="text-xs text-muted-foreground mb-2">
                              Invited by{' '}
                              <span className="font-medium">
                                {invitation.inviter_profile?.display_name || 'Someone'}
                              </span>
                            </p>
                            <p className="text-sm text-muted-foreground line-clamp-2 mb-4 flex-1">
                              {invitation.group?.description || 'No description'}
                            </p>

                            {/* Action Buttons */}
                            <div className="flex gap-2 mt-auto">
                              <Button
                                onClick={() => handleAcceptInvitation(invitation.id)}
                                className="flex-1"
                                size="sm"
                              >
                                Accept
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => handleDeclineInvitation(invitation.id)}
                                className="flex-1"
                                size="sm"
                              >
                                Decline
                              </Button>
                            </div>
                          </div>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>

      {/* Create Group Modal */}
      <CreatePublicGroupModal
        isOpen={isCreateGroupOpen}
        onClose={() => setIsCreateGroupOpen(false)}
      />
    </div>
  )
}
