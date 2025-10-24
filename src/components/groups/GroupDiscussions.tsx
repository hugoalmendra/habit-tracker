import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import {
  MessageCircle,
  Heart,
  MoreVertical,
  Pin,
  Edit2,
  Trash2,
  Send,
} from 'lucide-react'
import { useGroupDiscussions } from '@/hooks/useGroupDiscussions'
import { useAuth } from '@/contexts/AuthContext'
import Spinner from '@/components/ui/Spinner'
import { formatDistanceToNow } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'

interface GroupDiscussionsProps {
  groupId: string
  isAdmin: boolean
}

export default function GroupDiscussions({ groupId, isAdmin }: GroupDiscussionsProps) {
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')

  const {
    discussions,
    isLoading,
    createDiscussion,
    updateDiscussion,
    deleteDiscussion,
    togglePin,
    addReaction,
    removeReaction,
    isCreating,
    isUpdating,
  } = useGroupDiscussions(groupId)

  const handleSendMessage = () => {
    if (!newMessage.trim()) return
    createDiscussion({ groupId, content: newMessage.trim() })
    setNewMessage('')
  }

  const handleStartEdit = (discussionId: string, content: string) => {
    setEditingId(discussionId)
    setEditContent(content)
  }

  const handleSaveEdit = () => {
    if (!editingId || !editContent.trim()) return
    updateDiscussion({ discussionId: editingId, content: editContent.trim(), groupId })
    setEditingId(null)
    setEditContent('')
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const handleDelete = (discussionId: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      deleteDiscussion({ discussionId, groupId })
    }
  }

  const handleTogglePin = (discussionId: string, isPinned: boolean) => {
    togglePin({ discussionId, isPinned: !isPinned, groupId })
  }

  const handleToggleReaction = (discussionId: string, userHasReacted: boolean) => {
    if (userHasReacted) {
      removeReaction({ discussionId, groupId })
    } else {
      addReaction({ discussionId, groupId })
    }
  }

  if (isLoading) {
    return (
      <Card className="p-6">
        <div className="flex justify-center">
          <Spinner size="md" />
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* New Message Input */}
      <Card className="p-4">
        <div className="flex gap-3">
          <Avatar className="h-10 w-10">
            <AvatarImage src={user?.user_metadata?.photo_url || undefined} />
            <AvatarFallback>
              {user?.user_metadata?.display_name?.substring(0, 2).toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <Textarea
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Share something with the group..."
              className="min-h-[80px] resize-none"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  handleSendMessage()
                }
              }}
            />
            <div className="flex justify-end mt-2">
              <Button
                onClick={handleSendMessage}
                disabled={!newMessage.trim() || isCreating}
                size="sm"
              >
                <Send className="h-4 w-4 mr-2" />
                Post
              </Button>
            </div>
          </div>
        </div>
      </Card>

      {/* Discussions List */}
      {discussions && discussions.length > 0 ? (
        <div className="space-y-3">
          {discussions.map((discussion) => {
            const isOwner = discussion.user_id === user?.id
            const isEditing = editingId === discussion.id

            return (
              <Card key={discussion.id} className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={discussion.user_profile?.photo_url || undefined} />
                    <AvatarFallback>
                      {discussion.user_profile?.display_name?.substring(0, 2).toUpperCase() || '??'}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium">
                          {discussion.user_profile?.display_name || 'Unknown'}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(discussion.created_at), {
                            addSuffix: true,
                          })}
                        </span>
                        {discussion.is_pinned && (
                          <Badge variant="secondary" className="text-xs">
                            <Pin className="h-3 w-3 mr-1" />
                            Pinned
                          </Badge>
                        )}
                        {discussion.updated_at !== discussion.created_at && (
                          <span className="text-xs text-muted-foreground">(edited)</span>
                        )}
                      </div>

                      {(isOwner || isAdmin) && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {isAdmin && (
                              <>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleTogglePin(discussion.id, discussion.is_pinned)
                                  }
                                >
                                  <Pin className="mr-2 h-4 w-4" />
                                  {discussion.is_pinned ? 'Unpin' : 'Pin'} Message
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                              </>
                            )}
                            {isOwner && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleStartEdit(discussion.id, discussion.content)
                                }
                              >
                                <Edit2 className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                              className="text-destructive"
                              onClick={() => handleDelete(discussion.id)}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>

                    {isEditing ? (
                      <div className="space-y-2">
                        <Textarea
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          className="min-h-[80px] resize-none"
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveEdit}
                            disabled={!editContent.trim() || isUpdating}
                            size="sm"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap break-words">
                          {discussion.content}
                        </p>

                        {/* Reactions */}
                        <div className="flex items-center gap-4 mt-3">
                          <button
                            onClick={() =>
                              handleToggleReaction(
                                discussion.id,
                                discussion.user_has_reacted || false
                              )
                            }
                            className={`flex items-center gap-1 text-sm transition-colors ${
                              discussion.user_has_reacted
                                ? 'text-red-500'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                          >
                            <Heart
                              className={`h-4 w-4 ${
                                discussion.user_has_reacted ? 'fill-current' : ''
                              }`}
                            />
                            {discussion.reaction_count || 0}
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="p-8 text-center">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
          <p className="text-muted-foreground">
            No discussions yet. Be the first to start a conversation!
          </p>
        </Card>
      )}
    </div>
  )
}
