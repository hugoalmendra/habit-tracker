import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Link } from 'react-router-dom'
import { ThumbsUp } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useQuery } from '@tanstack/react-query'

interface DiscussionReactionUsersModalProps {
  discussionId: string | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface ReactionUser {
  id: string
  user_id: string
  reaction_type: string
  created_at: string
  user_profile?: {
    id: string
    display_name: string | null
    photo_url: string | null
  }
}

export default function DiscussionReactionUsersModal({ discussionId, open, onOpenChange }: DiscussionReactionUsersModalProps) {
  const { data: reactions, isLoading } = useQuery({
    queryKey: ['discussion-reactions', discussionId],
    queryFn: async () => {
      if (!discussionId) return []

      const { data: reactionsData, error } = await supabase
        .from('discussion_reactions' as any)
        .select('*')
        .eq('discussion_id', discussionId)
        .order('created_at', { ascending: false })

      if (error) throw error

      // Fetch user profiles
      const userIds = [...new Set((reactionsData as any)?.map((r: any) => r.user_id) || [])]
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, display_name, photo_url')
        .in('id', userIds)

      // Combine data
      const enrichedReactions = (reactionsData as any)?.map((reaction: any) => {
        const userProfile = profiles?.find((p) => p.id === reaction.user_id)
        return {
          ...reaction,
          user_profile: userProfile
        }
      })

      return enrichedReactions as ReactionUser[]
    },
    enabled: !!discussionId && open,
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Likes</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="text-muted-foreground">Loading...</div>
          </div>
        ) : reactions && reactions.length > 0 ? (
          <div className="overflow-y-auto flex-1 -mx-6 px-6">
            <div className="space-y-2">
              {reactions.map((reaction, index) => (
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
                        <AvatarImage src={reaction.user_profile?.photo_url || undefined} alt={reaction.user_profile?.display_name || 'User'} />
                        <AvatarFallback>
                          {reaction.user_profile?.display_name?.charAt(0).toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-background rounded-full p-0.5 text-blue-500">
                        <ThumbsUp className="h-3 w-3" />
                      </div>
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-foreground truncate">
                        {reaction.user_profile?.display_name || 'Unknown User'}
                      </p>
                      <p className="text-xs text-muted-foreground capitalize">
                        like
                      </p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-8">
            <p className="text-muted-foreground">No likes yet</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
