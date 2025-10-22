import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { usePostReactions } from '@/hooks/usePosts'
import { Link } from 'react-router-dom'
import { Heart, ThumbsUp, Flame, Sparkles, Users } from 'lucide-react'
import { motion } from 'framer-motion'

interface ReactionUsersModalProps {
  postId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

const reactionIcons = {
  like: ThumbsUp,
  love: Heart,
  fire: Flame,
  celebrate: Sparkles,
  support: Users,
}

const reactionColors = {
  like: 'text-blue-500',
  love: 'text-red-500',
  fire: 'text-orange-500',
  celebrate: 'text-yellow-500',
  support: 'text-green-500',
}

export default function ReactionUsersModal({ postId, open, onOpenChange }: ReactionUsersModalProps) {
  const { reactions, isLoading } = usePostReactions(postId)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Reactions</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : reactions && reactions.length > 0 ? (
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <div className="space-y-2">
              {reactions.map((reaction, index) => {
                const ReactionIcon = reactionIcons[reaction.reaction]
                const colorClass = reactionColors[reaction.reaction]

                return (
                  <motion.div
                    key={reaction.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      to={`/profile/${reaction.user_id}`}
                      className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors"
                      onClick={() => onOpenChange(false)}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={reaction.user?.photo_url} alt={reaction.user?.display_name} />
                          <AvatarFallback>
                            {reaction.user?.display_name?.charAt(0).toUpperCase() || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 ${colorClass}`}>
                          <ReactionIcon className="h-3 w-3" />
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-foreground truncate">
                          {reaction.user?.display_name || 'Unknown User'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {reaction.reaction}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                )
              })}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No reactions yet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
