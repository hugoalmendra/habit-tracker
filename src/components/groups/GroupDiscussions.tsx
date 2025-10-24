import { useState, useEffect } from 'react'
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
  Image as ImageIcon,
  X,
} from 'lucide-react'
import { useGroupDiscussions, useDiscussionComments } from '@/hooks/useGroupDiscussions'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
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

interface UserProfile {
  display_name: string | null
  photo_url: string | null
}

export default function GroupDiscussions({ groupId, isAdmin }: GroupDiscussionsProps) {
  const { user } = useAuth()
  const [newMessage, setNewMessage] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [currentUserProfile, setCurrentUserProfile] = useState<UserProfile | null>(null)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [uploadingImage, setUploadingImage] = useState(false)

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

  // Load current user's profile
  useEffect(() => {
    const loadUserProfile = async () => {
      if (!user?.id) return

      const { data } = await supabase
        .from('profiles')
        .select('display_name, photo_url')
        .eq('id', user.id)
        .single()

      if (data) {
        setCurrentUserProfile(data)
      }
    }

    loadUserProfile()
  }, [user?.id])

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
  }

  const uploadImage = async (file: File): Promise<string | null> => {
    try {
      if (!user?.id) throw new Error('User not authenticated')

      const fileExt = file.name.split('.').pop()
      const fileName = `group-discussions/${user.id}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('post-images')
        .upload(fileName, file)

      if (uploadError) throw uploadError

      const { data: { publicUrl } } = supabase.storage
        .from('post-images')
        .getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error('Error uploading image:', error)
      return null
    }
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim() && !selectedImage) return

    setUploadingImage(true)

    try {
      let imageUrl: string | null = null

      if (selectedImage) {
        imageUrl = await uploadImage(selectedImage)
      }

      createDiscussion({
        groupId,
        content: newMessage.trim() || ' ',
        imageUrl
      })

      setNewMessage('')
      handleRemoveImage()
    } catch (error) {
      console.error('Error sending message:', error)
    } finally {
      setUploadingImage(false)
    }
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

  const toggleComments = (discussionId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(discussionId)) {
        newSet.delete(discussionId)
      } else {
        newSet.add(discussionId)
      }
      return newSet
    })
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
            <AvatarImage src={currentUserProfile?.photo_url || undefined} />
            <AvatarFallback>
              {currentUserProfile?.display_name?.substring(0, 2).toUpperCase() || 'U'}
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

            {/* Image Preview */}
            {imagePreview && (
              <div className="relative mt-2 inline-block">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="max-h-40 rounded-lg border"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 h-6 w-6"
                  onClick={handleRemoveImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            <div className="flex justify-between items-center mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="file"
                  id="image-upload"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageSelect}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => document.getElementById('image-upload')?.click()}
                  disabled={uploadingImage}
                >
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Upload Image
                </Button>
              </div>
              <Button
                onClick={handleSendMessage}
                disabled={(!newMessage.trim() && !selectedImage) || isCreating || uploadingImage}
                size="sm"
              >
                {uploadingImage ? (
                  <>
                    <Spinner size="sm" className="mr-2" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Post
                  </>
                )}
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

                        {/* Discussion Image */}
                        {discussion.image_url && (
                          <div className="mt-3">
                            <img
                              src={discussion.image_url}
                              alt="Discussion attachment"
                              className="max-w-full max-h-96 rounded-lg border cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => discussion.image_url && window.open(discussion.image_url, '_blank')}
                            />
                          </div>
                        )}

                        {/* Reactions and Comments */}
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

                          <button
                            onClick={() => toggleComments(discussion.id)}
                            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <MessageCircle className="h-4 w-4" />
                            {discussion.comment_count || 0}
                          </button>
                        </div>

                        {/* Comments Section */}
                        {expandedComments.has(discussion.id) && (
                          <DiscussionCommentsSection
                            discussionId={discussion.id}
                            groupId={groupId}
                            isAdmin={isAdmin}
                            currentUserProfile={currentUserProfile}
                          />
                        )}
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

// Comments section component
interface DiscussionCommentsSectionProps {
  discussionId: string
  groupId: string
  isAdmin: boolean
  currentUserProfile: UserProfile | null
}

function DiscussionCommentsSection({
  discussionId,
  groupId,
  isAdmin,
  currentUserProfile,
}: DiscussionCommentsSectionProps) {
  const { user } = useAuth()
  const [commentText, setCommentText] = useState('')

  const {
    comments,
    isLoading,
    createComment,
    deleteComment,
    isCreatingComment,
  } = useDiscussionComments(discussionId, groupId)

  const handlePostComment = () => {
    if (!commentText.trim()) return
    createComment({ discussionId, content: commentText.trim() })
    setCommentText('')
  }

  const handleDeleteComment = (commentId: string) => {
    if (confirm('Are you sure you want to delete this comment?')) {
      deleteComment({ commentId, discussionId })
    }
  }

  return (
    <div className="mt-4 pt-4 border-t space-y-3">
      {/* Comment Input */}
      <div className="flex gap-2">
        <Avatar className="h-8 w-8">
          <AvatarImage src={currentUserProfile?.photo_url || undefined} />
          <AvatarFallback className="text-xs">
            {currentUserProfile?.display_name?.substring(0, 2).toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 flex gap-2">
          <Textarea
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder="Write a comment..."
            className="min-h-[60px] resize-none text-sm"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                handlePostComment()
              }
            }}
          />
          <Button
            onClick={handlePostComment}
            disabled={!commentText.trim() || isCreatingComment}
            size="sm"
            className="self-end"
          >
            <Send className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-2">
          {comments.map((comment) => {
            const isOwner = comment.user_id === user?.id

            return (
              <div key={comment.id} className="flex gap-2">
                <Avatar className="h-7 w-7">
                  <AvatarImage src={comment.user_profile?.photo_url || undefined} />
                  <AvatarFallback className="text-xs">
                    {comment.user_profile?.display_name?.substring(0, 2).toUpperCase() || '??'}
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 bg-secondary/50 rounded-lg p-3">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium">
                        {comment.user_profile?.display_name || 'Unknown'}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(comment.created_at), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>

                    {(isOwner || isAdmin) && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleDeleteComment(comment.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    )}
                  </div>

                  <p className="text-sm whitespace-pre-wrap break-words">
                    {comment.content}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center py-4">
          No comments yet. Be the first to comment!
        </p>
      )}
    </div>
  )
}
