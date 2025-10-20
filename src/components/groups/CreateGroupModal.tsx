import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Search, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFollowers } from '@/hooks/useFollowers'
import { useFollowerGroups } from '@/hooks/useFollowerGroups'

interface CreateGroupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateGroupModal({ open, onOpenChange }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])

  const { following } = useFollowers()
  const { createGroup, isCreating } = useFollowerGroups()

  // Map following to friends format
  const friends = following?.map(f => ({
    id: f.following_id,
    display_name: f.following?.display_name || 'Unknown',
    photo_url: f.following?.photo_url
  }))

  const filteredFriends = friends?.filter(friend =>
    friend.display_name.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleToggleMember = (memberId: string) => {
    setSelectedMembers(prev =>
      prev.includes(memberId)
        ? prev.filter(id => id !== memberId)
        : [...prev, memberId]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    try {
      await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        memberIds: selectedMembers
      })
      handleClose()
    } catch (error) {
      console.error('Error creating group:', error)
      alert(`Failed to create group: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleClose = () => {
    setName('')
    setDescription('')
    setSearchQuery('')
    setSelectedMembers([])
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
              className="relative w-full max-w-md rounded-2xl bg-background shadow-apple-lg my-8"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors z-10"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center gap-3 mb-6">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold tracking-tight">Create Group</h2>
                    <p className="text-sm text-muted-foreground">Organize your followers</p>
                  </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-5">
                  {/* Group Name */}
                  <div>
                    <label htmlFor="group-name" className="mb-2 block text-sm font-medium">
                      Group Name
                    </label>
                    <input
                      id="group-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Workout Buddies"
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      autoFocus
                      required
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label htmlFor="group-description" className="mb-2 block text-sm font-medium">
                      Description (Optional)
                    </label>
                    <textarea
                      id="group-description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Friends who love to workout together"
                      rows={3}
                      className="w-full rounded-xl border border-border/60 bg-background px-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    />
                  </div>

                  {/* Members Selection */}
                  <div>
                    <label className="mb-2 block text-sm font-medium">
                      Add Members
                    </label>

                    {/* Search */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search followers..."
                        className="w-full rounded-xl border border-border/60 bg-background pl-10 pr-4 py-2.5 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                      />
                    </div>

                    {/* Members List */}
                    <div className="max-h-[250px] overflow-y-auto space-y-2 pr-2">
                      {filteredFriends && filteredFriends.length > 0 ? (
                        filteredFriends.map((friend) => (
                          <button
                            key={friend.id}
                            type="button"
                            onClick={() => handleToggleMember(friend.id)}
                            className={`w-full flex items-center gap-3 rounded-xl p-3 transition-all hover:bg-secondary ${
                              selectedMembers.includes(friend.id)
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
                              selectedMembers.includes(friend.id)
                                ? 'border-primary bg-primary'
                                : 'border-border'
                            }`}>
                              {selectedMembers.includes(friend.id) && (
                                <Check className="h-3 w-3 text-primary-foreground" />
                              )}
                            </div>
                          </button>
                        ))
                      ) : (
                        <div className="text-center py-8 text-muted-foreground text-sm">
                          {friends?.length === 0 ? 'No followers yet' : 'No followers found'}
                        </div>
                      )}
                    </div>

                    {/* Selected count */}
                    {selectedMembers.length > 0 && (
                      <div className="text-sm text-muted-foreground text-center mt-3">
                        {selectedMembers.length} member{selectedMembers.length !== 1 ? 's' : ''} selected
                      </div>
                    )}
                  </div>

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
                      disabled={!name.trim() || isCreating}
                      className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                    >
                      {isCreating ? 'Creating...' : 'Create Group'}
                    </Button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
