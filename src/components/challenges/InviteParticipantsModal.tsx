import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, UserPlus, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChallenges } from '@/hooks/useChallenges'
import { useFollowers } from '@/hooks/useFollowers'

interface InviteParticipantsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  challengeId: string
  challengeName: string
}

export default function InviteParticipantsModal({
  open,
  onOpenChange,
  challengeId,
  challengeName
}: InviteParticipantsModalProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedFriends, setSelectedFriends] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { following } = useFollowers()
  const { inviteParticipants } = useChallenges()

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (selectedFriends.length === 0) return

    setIsSubmitting(true)
    try {
      await inviteParticipants({
        challengeId,
        userIds: selectedFriends
      })
      handleClose()
    } catch (error) {
      console.error('Error inviting participants:', error)
      alert('Failed to send invitations. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setSearchQuery('')
    setSelectedFriends([])
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
                  <h2 className="text-2xl font-semibold tracking-tight">Invite Friends</h2>
                  <p className="text-sm text-muted-foreground">{challengeName}</p>
                </div>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4">
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

                {/* Actions */}
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
                    disabled={selectedFriends.length === 0 || isSubmitting}
                    className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? 'Inviting...' : 'Send Invites'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
