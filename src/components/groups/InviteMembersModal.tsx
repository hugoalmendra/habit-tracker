import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePublicGroups } from '@/hooks/usePublicGroups'
import { supabase } from '@/lib/supabase'
import { Search } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

interface InviteMembersModalProps {
  isOpen: boolean
  onClose: () => void
  groupId: string
  groupName: string
}

interface UserProfile {
  id: string
  display_name: string
  username: string | null
  photo_url: string | null
}

export default function InviteMembersModal({
  isOpen,
  onClose,
  groupId,
  groupName,
}: InviteMembersModalProps) {
  const { inviteUser, isInviting } = usePublicGroups()
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [invitedUsers, setInvitedUsers] = useState<Set<string>>(new Set())

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([])
      return
    }

    setIsSearching(true)
    try {
      // Search for users by username or display name
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, display_name, username, photo_url')
        .or(`username.ilike.%${searchQuery}%,display_name.ilike.%${searchQuery}%`)
        .limit(10)

      if (error) throw error

      // Filter out users who are already members
      const { data: members } = await supabase
        .from('user_group_memberships' as any)
        .select('user_id')
        .eq('group_id', groupId)

      const memberIds = new Set((members as any)?.map((m: any) => m.user_id) || [])
      const filteredUsers = (users || []).filter(u => !memberIds.has(u.id))

      setSearchResults(filteredUsers)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleInviteUser = async (userId: string) => {
    try {
      await inviteUser({ groupId, userId })
      setInvitedUsers(prev => new Set(prev).add(userId))
    } catch (error: any) {
      console.error('Error inviting user:', error)
      alert(error.message || 'Failed to invite user. Please try again.')
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSearchResults([])
    setInvitedUsers(new Set())
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Invite Members</DialogTitle>
          <DialogDescription>
            Search for users to invite to {groupName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Input */}
          <div className="space-y-2">
            <Label htmlFor="search">Search by username or name</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder="Enter username or name..."
              />
              <Button
                onClick={handleSearch}
                disabled={isSearching || !searchQuery.trim()}
              >
                {isSearching ? (
                  <Spinner size="sm" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          <div className="max-h-[400px] overflow-y-auto space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((user) => {
                const isInvited = invitedUsers.has(user.id)
                return (
                  <div
                    key={user.id}
                    className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.photo_url || undefined} />
                      <AvatarFallback>
                        {user.display_name?.substring(0, 2).toUpperCase() || '??'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{user.display_name}</p>
                      {user.username && (
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      )}
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleInviteUser(user.id)}
                      disabled={isInviting || isInvited}
                    >
                      {isInvited ? 'Invited' : 'Invite'}
                    </Button>
                  </div>
                )
              })
            ) : searchQuery && !isSearching ? (
              <div className="text-center py-8 text-muted-foreground">
                No users found
              </div>
            ) : !searchQuery ? (
              <div className="text-center py-8 text-muted-foreground">
                Search for users to invite
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
