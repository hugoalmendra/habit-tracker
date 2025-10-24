import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Search, Mail, Link2, Check, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChallenges } from '@/hooks/useChallenges'
import { useFollowers } from '@/hooks/useFollowers'
import { usePublicGroups } from '@/hooks/usePublicGroups'
import { supabase } from '@/lib/supabase'

interface InviteParticipantsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challengeId: string
  challengeName: string
}

type InviteTab = 'friends' | 'groups' | 'email' | 'link'

export default function InviteParticipantsModal({
  open,
  onOpenChange,
  challengeId,
  challengeName
}: InviteParticipantsModalProps) {
  const [activeTab, setActiveTab] = useState<InviteTab>('friends')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [selectedGroups, setSelectedGroups] = useState<string[]>([])
  const [emailInput, setEmailInput] = useState('')
  const [emailList, setEmailList] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [linkCopied, setLinkCopied] = useState(false)

  const { following } = useFollowers()
  const { myGroups } = usePublicGroups()
  const { inviteParticipants, inviteByEmail } = useChallenges()

  // Map following to friends format
  const friends = following?.map(f => ({
    id: f.following_id,
    display_name: f.following?.display_name || 'Unknown',
    photo_url: f.following?.photo_url
  }))

  const filteredFriends = friends?.filter(friend =>
    friend.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    )
  }

  const handleToggleGroup = (groupId: string) => {
    setSelectedGroups(prev =>
      prev.includes(groupId)
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    )
  }

  // Get all unique member IDs from selected groups
  const getGroupMemberIds = async () => {
    if (selectedGroups.length === 0) return []

    const { data: membersData } = await supabase
      .from('user_group_memberships' as any)
      .select('user_id')
      .in('group_id', selectedGroups)

    // Return unique user IDs
    const uniqueIds = [...new Set((membersData as any)?.map((m: any) => m.user_id) || [])]
    return uniqueIds
  }

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const handleAddEmail = () => {
    const trimmedEmail = emailInput.trim().toLowerCase()
    if (!trimmedEmail) return

    if (!validateEmail(trimmedEmail)) {
      alert('Please enter a valid email address')
      return
    }

    if (emailList.includes(trimmedEmail)) {
      alert('This email has already been added')
      return
    }

    setEmailList(prev => [...prev, trimmedEmail])
    setEmailInput('')
  }

  const handleRemoveEmail = (email: string) => {
    setEmailList(prev => prev.filter(e => e !== email))
  }

  const handleCopyLink = async () => {
    const inviteUrl = `${window.location.origin}/challenges/${challengeId}/join`
    try {
      await navigator.clipboard.writeText(inviteUrl)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2000)
    } catch (error) {
      console.error('Failed to copy link:', error)
      alert('Failed to copy link. Please try again.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (activeTab === 'friends' && selectedFriends.length === 0) return
    if (activeTab === 'groups' && selectedGroups.length === 0) return
    if (activeTab === 'email' && emailList.length === 0) return

    setIsSubmitting(true)
    try {
      if (activeTab === 'friends') {
        await inviteParticipants({
          challengeId,
          userIds: selectedFriends
        })
      } else if (activeTab === 'groups') {
        const memberIds = await getGroupMemberIds()

        // Get current challenge participants to skip already joined users
        const { data: currentParticipants } = await supabase
          .from('challenge_participants')
          .select('user_id')
          .eq('challenge_id', challengeId)

        const existingUserIds = new Set((currentParticipants as any)?.map((p: any) => p.user_id as string) || [])
        const newMemberIds = memberIds.filter(id => !existingUserIds.has(id)) as string[]

        if (newMemberIds.length === 0) {
          alert('All members of the selected groups are already participating in this challenge.')
          setIsSubmitting(false)
          return
        }

        await inviteParticipants({
          challengeId,
          userIds: newMemberIds
        })
      } else {
        await inviteByEmail({
          challengeId,
          emails: emailList
        })
      }
      handleClose()
    } catch (error) {
      console.error('Error inviting participants:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send invitations. Please try again.'
      alert(errorMessage)
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedFriends([])
    setSelectedGroups([])
    setEmailInput('')
    setEmailList([])
    setActiveTab('friends')
    setLinkCopied(false)
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md rounded-2xl bg-background p-6 shadow-apple-lg my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                  <UserPlus className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-semibold tracking-tight">Invite to Challenge</h2>
                  <p className="text-sm text-muted-foreground">{challengeName}</p>
                </div>
              </div>

              {/* Tabs */}
              <div className="grid grid-cols-4 gap-2 mb-4 p-1 bg-secondary/50 rounded-xl">
                <button
                  type="button"
                  onClick={() => setActiveTab('friends')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'friends'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  <span className="hidden sm:inline">Friends</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('groups')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'groups'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Users className="h-4 w-4" />
                  <span className="hidden sm:inline">Groups</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('email')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'email'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Email</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('link')}
                  className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === 'link'
                      ? 'bg-background shadow-sm text-foreground'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  <Link2 className="h-4 w-4" />
                  <span className="hidden sm:inline">Link</span>
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {activeTab === 'friends' ? (
                  <>
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search friends..."
                        className="w-full rounded-xl border border-border/60 bg-background pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Friends List */}
                    <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                      {filteredFriends && filteredFriends.length > 0 ? (
                        filteredFriends.map((friend) => (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => handleToggleFriend(friend.id)}
                            className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-secondary ${
                              selectedFriends.includes(friend.id)
                                ? 'bg-primary/10 ring-2 ring-primary'
                                : 'bg-secondary/50'
                            }`}
                          >
                            <img
                              src={friend.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${friend.id}`}
                              alt={friend.display_name}
                              className="h-10 w-10 rounded-full object-cover"
                            />
                            <div className="flex-1 text-left">
                              <p className="font-medium text-sm">{friend.display_name}</p>
                            </div>
                            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${
                              selectedFriends.includes(friend.id)
                                ? 'border-primary bg-primary'
                                : 'border-border'
                            }`}>
                              {selectedFriends.includes(friend.id) && (
                                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          {friends?.length === 0 ? 'No friends yet' : 'No friends found'}
                        </div>
                      )}
                    </div>

                    {/* Selected count */}
                    {selectedFriends.length > 0 && (
                      <div className="text-sm text-muted-foreground text-center">
                        {selectedFriends.length} friend{selectedFriends.length !== 1 ? 's' : ''} selected
                      </div>
                    )}
                  </>
                ) : activeTab === 'groups' ? (
                  <>
                    {/* Groups List */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Select Groups</label>
                      <div className="max-h-[300px] overflow-y-auto space-y-2 pr-2">
                        {myGroups && myGroups.length > 0 ? (
                          myGroups.map((group) => (
                            <button
                              key={group.id}
                              type="button"
                              onClick={() => handleToggleGroup(group.id)}
                              className={`w-full overflow-hidden rounded-xl transition-all hover:shadow-md border-2 ${
                                selectedGroups.includes(group.id)
                                  ? 'border-primary'
                                  : 'border-transparent'
                              }`}
                            >
                              {/* Cover Photo */}
                              <div className="relative h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
                                {group.avatar_url ? (
                                  <img
                                    src={group.avatar_url}
                                    alt={group.name}
                                    className="w-full h-full object-cover"
                                  />
                                ) : (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-3xl font-bold text-primary/10">
                                      {group.name.substring(0, 2).toUpperCase()}
                                    </div>
                                  </div>
                                )}
                                {/* Selection indicator */}
                                <div className="absolute top-2 right-2">
                                  <div className={`h-6 w-6 rounded-full border-2 flex items-center justify-center shadow-sm ${
                                    selectedGroups.includes(group.id)
                                      ? 'border-primary bg-primary'
                                      : 'border-white bg-white/80'
                                  }`}>
                                    {selectedGroups.includes(group.id) && (
                                      <Check className="h-4 w-4 text-primary-foreground" />
                                    )}
                                  </div>
                                </div>
                              </div>

                              {/* Group Info */}
                              <div className={`p-3 text-left ${
                                selectedGroups.includes(group.id) ? 'bg-primary/5' : 'bg-secondary/30'
                              }`}>
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm truncate">{group.name}</p>
                                    <p className="text-xs text-muted-foreground">
                                      {group.member_count || 0} member{group.member_count !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  {group.is_admin && (
                                    <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">
                                      Admin
                                    </span>
                                  )}
                                </div>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="text-center py-8 text-muted-foreground text-sm">
                            <p className="mb-2">No groups yet</p>
                            <p className="text-xs">Join or create groups to invite multiple people at once</p>
                          </div>
                        )}
                      </div>

                      {/* Total members preview */}
                      {selectedGroups.length > 0 && (
                        <div className="rounded-xl bg-primary/5 p-3 text-sm">
                          <p className="text-muted-foreground text-center">
                            {selectedGroups.length} group{selectedGroups.length !== 1 ? 's' : ''} selected
                          </p>
                          <p className="text-xs text-muted-foreground text-center mt-1">
                            Members from selected groups will be invited
                          </p>
                        </div>
                      )}
                    </div>
                  </>
                ) : activeTab === 'email' ? (
                  <>
                    {/* Email Input */}
                    <div className="space-y-3">
                      <label className="text-sm font-medium">Enter email addresses</label>
                      <div className="flex gap-2">
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault()
                              handleAddEmail()
                            }
                          }}
                          placeholder="friend@example.com"
                          className="flex-1 rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                        />
                        <Button
                          type="button"
                          onClick={handleAddEmail}
                          className="rounded-xl px-6"
                        >
                          Add
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Press Enter or click Add to add multiple emails
                      </p>
                    </div>

                    {/* Email List */}
                    {emailList.length > 0 && (
                      <div className="space-y-2">
                        <label className="text-sm font-medium">
                          {emailList.length} email{emailList.length !== 1 ? 's' : ''} added
                        </label>
                        <div className="max-h-[200px] overflow-y-auto space-y-2 pr-2">
                          {emailList.map((email) => (
                            <div
                              key={email}
                              className="flex items-center justify-between gap-3 rounded-xl p-3 bg-secondary/50"
                            >
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm">{email}</span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRemoveEmail(email)}
                                className="text-muted-foreground hover:text-destructive transition-colors"
                              >
                                <X className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    {/* Copy Link Section */}
                    <div className="space-y-4">
                      <div className="text-center py-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto mb-4">
                          <Link2 className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold mb-2">Share Invite Link</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Anyone with this link can join the challenge
                        </p>
                      </div>

                      {/* Link Display */}
                      <div className="rounded-xl border border-border/60 bg-secondary/30 p-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 min-w-0">
                            <p className="text-xs text-muted-foreground mb-1">Challenge Link</p>
                            <p className="text-sm font-mono truncate">
                              {`${window.location.origin}/challenges/${challengeId}/join`}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Copy Button */}
                      <Button
                        type="button"
                        onClick={handleCopyLink}
                        className="w-full rounded-xl bg-primary hover:bg-primary/90 h-12"
                      >
                        {linkCopied ? (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Link Copied!
                          </>
                        ) : (
                          <>
                            <Link2 className="h-4 w-4 mr-2" />
                            Copy Invite Link
                          </>
                        )}
                      </Button>

                      <p className="text-xs text-muted-foreground text-center">
                        Share this link via messaging apps, social media, or anywhere you'd like
                      </p>
                    </div>
                  </>
                )}

                {/* Actions */}
                {activeTab !== 'link' && (
                  <div className="flex gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="flex-1 rounded-xl"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={
                        (activeTab === 'friends' && selectedFriends.length === 0) ||
                        (activeTab === 'groups' && selectedGroups.length === 0) ||
                        (activeTab === 'email' && emailList.length === 0) ||
                        isSubmitting
                      }
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                    >
                      {isSubmitting ? 'Inviting...' : 'Send Invites'}
                    </Button>
                  </div>
                )}
                {activeTab === 'link' && (
                  <div className="pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                      className="w-full rounded-xl"
                    >
                      Close
                    </Button>
                  </div>
                )}
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
