import { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { useFollowers } from '@/hooks/useFollowers'
import { useSharedHabits } from '@/hooks/useSharedHabits'
import { User, Check, Loader2 } from 'lucide-react'
import type { Habit } from '@/lib/types'

interface ShareHabitModalProps {
  habit: Habit | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ShareHabitModal({ habit, open, onOpenChange }: ShareHabitModalProps) {
  const { following } = useFollowers()
  const { shareHabit, sharedByMe } = useSharedHabits()
  const [sharing, setSharing] = useState<string | null>(null)

  // Get users this habit is already shared with
  const alreadySharedWith = habit
    ? (sharedByMe || [])
        .filter((sh) => sh.habit_id === habit.id)
        .map((sh) => sh.invited_user_id)
    : []

  const handleShare = async (userId: string) => {
    if (!habit) return

    setSharing(userId)
    try {
      await shareHabit({ habitId: habit.id, userId })
    } catch (error) {
      console.error('Error sharing habit:', error)
    } finally {
      setSharing(null)
    }
  }

  const isAlreadyShared = (userId: string) => alreadySharedWith.includes(userId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share "{habit?.name}"</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Share this habit with people you follow to keep each other accountable.
          </p>

          {!following || following.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p className="mb-2">You're not following anyone yet.</p>
              <p className="text-sm">Follow users to share habits with them!</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {following.map((follow) => {
                const alreadyShared = isAlreadyShared(follow.following_id)
                const isSharing = sharing === follow.following_id

                return (
                  <div
                    key={follow.id}
                    className="flex items-center gap-3 p-3 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors"
                  >
                    <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-border bg-secondary/50 flex items-center justify-center flex-shrink-0">
                      {follow.following?.photo_url ? (
                        <img
                          src={follow.following.photo_url}
                          alt={follow.following.display_name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {follow.following?.display_name || 'Anonymous User'}
                      </p>
                    </div>

                    {alreadyShared ? (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4" />
                        <span>Shared</span>
                      </div>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleShare(follow.following_id)}
                        disabled={isSharing}
                        className="shrink-0"
                      >
                        {isSharing ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                            Sharing...
                          </>
                        ) : (
                          'Share'
                        )}
                      </Button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
