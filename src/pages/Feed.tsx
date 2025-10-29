// @ts-nocheck
import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { usePosts, useComments, type FeedItem } from '@/hooks/usePosts'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Moon, Sun, MessageCircle, Trash2, Send, ThumbsUp } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import NotificationsDropdown from '@/components/social/NotificationsDropdown'
import AvatarDropdown from '@/components/layout/AvatarDropdown'
import GlobalSearch from '@/components/layout/GlobalSearch'
import CreatePostModal from '@/components/feed/CreatePostModal'
import ActivityCard from '@/components/feed/ActivityCard'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import ReactionUsersModal from '@/components/feed/ReactionUsersModal'
import Spinner from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'
import { useQueryClient } from '@tanstack/react-query'
import GroupsNotificationBadge from '@/components/groups/GroupsNotificationBadge'

type FeedFilter = 'for_you' | 'following'

interface CommentsSectionProps {
  postId: string
  commentInput: string
  onCommentInputChange: (value: string) => void
  onAddComment: () => void
  onKeyDown: (e: React.KeyboardEvent) => void
}

function CommentsSection({ postId, commentInput, onCommentInputChange, onAddComment, onKeyDown }: CommentsSectionProps) {
  const { user } = useAuth()
  const { comments, isLoading } = useComments(postId)

  return (
    <div className="mt-4 pt-4 border-t border-border space-y-4">
      {/* Comments List */}
      {isLoading ? (
        <div className="flex justify-center py-4">
          <Spinner size="sm" />
        </div>
      ) : comments && comments.length > 0 ? (
        <div className="space-y-3">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3">
              <Link to={comment.user_id === user?.id ? '/profile' : `/profile/${comment.user_id}`} className="shrink-0">
                <Avatar className="h-8 w-8 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  <AvatarImage src={comment.user?.photo_url || undefined} />
                  <AvatarFallback>
                    {comment.user?.display_name?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <div className="bg-secondary rounded-lg px-3 py-2">
                  <Link to={comment.user_id === user?.id ? '/profile' : `/profile/${comment.user_id}`} className="hover:underline">
                    <p className="text-sm font-semibold mb-0.5">{comment.user?.display_name}</p>
                  </Link>
                  <p className="text-sm">{comment.content}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1 ml-3">
                  {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}
                </p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to comment!</p>
      )}

      {/* Comment Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={commentInput}
          onChange={(e) => onCommentInputChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a comment..."
          className="flex-1 rounded-lg border border-border/60 bg-background px-3 py-2 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
        <Button
          size="sm"
          onClick={onAddComment}
          disabled={!commentInput.trim()}
          className="rounded-lg"
        >
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}

export default function Feed() {
  const { user } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const queryClient = useQueryClient()
  const [filter, setFilter] = useState<FeedFilter>('for_you')
  const [isCreatePostOpen, setIsCreatePostOpen] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set())
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({})
  const [profile, setProfile] = useState<{ photo_url: string | null, display_name: string | null } | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [postToDelete, setPostToDelete] = useState<string | null>(null)
  const [showReactionsModal, setShowReactionsModal] = useState(false)
  const [selectedPostForReactions, setSelectedPostForReactions] = useState<string | null>(null)

  const { posts, isLoading, hasNextPage, fetchNextPage, isFetchingNextPage, toggleReaction, deletePost, addComment } = usePosts(filter)
  const loadMoreRef = useRef<HTMLDivElement>(null)

  // Load user profile for avatar
  useEffect(() => {
    if (user) {
      supabase
        .from('profiles')
        .select('photo_url, display_name')
        .eq('id', user.id)
        .maybeSingle()
        .then(({ data }) => setProfile(data))
    }
  }, [user])

  // Intersection observer for infinite scroll
  useEffect(() => {
    if (!loadMoreRef.current || !hasNextPage || isFetchingNextPage) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage()
        }
      },
      { threshold: 0.1 }
    )

    observer.observe(loadMoreRef.current)
    return () => observer.disconnect()
  }, [hasNextPage, fetchNextPage, isFetchingNextPage])

  const toggleComments = (postId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev)
      if (newSet.has(postId)) {
        newSet.delete(postId)
      } else {
        newSet.add(postId)
      }
      return newSet
    })
  }

  const handleReaction = async (postId: string, reaction: string) => {
    await toggleReaction({ postId, reaction })
  }

  const handleDeleteClick = (postId: string) => {
    setPostToDelete(postId)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!postToDelete) return
    await deletePost(postToDelete)
  }

  const handleAddComment = async (postId: string) => {
    const content = commentInputs[postId]?.trim()
    if (!content) return

    await addComment({ postId, content })
    setCommentInputs(prev => ({ ...prev, [postId]: '' }))
  }

  const handleCommentKeyDown = (e: React.KeyboardEvent, postId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleAddComment(postId)
    }
  }

  // Set up real-time subscriptions for comments
  useEffect(() => {
    const channel = supabase
      .channel('post-comments')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'post_comments'
      }, () => {
        queryClient.invalidateQueries({ queryKey: ['posts'] })
        expandedComments.forEach(postId => {
          queryClient.invalidateQueries({ queryKey: ['comments', postId] })
        })
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient, expandedComments])

  return (
    <div className="min-h-screen bg-secondary pb-20 md:pb-0">
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
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <AvatarDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <h1 className="text-3xl font-semibold tracking-tight">Activity Feed</h1>

          {/* Create Post Trigger */}
          <Card className="p-4 hover:shadow-lg transition-all">
            <div className="flex items-center gap-3">
              <Link to="/profile" className="shrink-0">
                <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                  <AvatarImage src={profile?.photo_url || undefined} />
                  <AvatarFallback>
                    {profile?.display_name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || 'U'}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <div
                className="flex-1 h-12 md:h-10 rounded-lg bg-secondary flex items-center px-4 text-muted-foreground cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => setIsCreatePostOpen(true)}
              >
                Which achievements do you have to share?
              </div>
            </div>
          </Card>

          {/* Filter */}
          <div className="flex gap-2 border-b border-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter('for_you')}
              className={`rounded-none border-b-2 transition-colors ${
                filter === 'for_you'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              For You
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter('following')}
              className={`rounded-none border-b-2 transition-colors ${
                filter === 'following'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              Following
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilter('my_activity')}
              className={`rounded-none border-b-2 transition-colors ${
                filter === 'my_activity'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground'
              }`}
            >
              My Activity
            </Button>
          </div>

          {/* Posts and Activities */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Spinner size="lg" text="Loading feed..." />
            </div>
          ) : posts?.length === 0 ? (
            <Card className="p-16 text-center">
              <p className="text-muted-foreground">No activity yet. Be the first to share!</p>
            </Card>
          ) : (
            <>
              <div className="space-y-4">
                {posts?.map((item: FeedItem) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    {item.item_type === 'activity' ? (
                      <ActivityCard activity={item} showAsYou={filter === 'my_activity'} />
                    ) : item.item_type === 'group_discussion' ? (
                      <Card className="p-6">
                        {/* Group Discussion Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Link to={item.user_id === user?.id ? '/profile' : `/profile/${item.user_id}`} className="shrink-0">
                              <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                <AvatarImage src={item.user?.photo_url || undefined} />
                                <AvatarFallback>
                                  {item.user?.display_name?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            <div>
                              <Link to={item.user_id === user?.id ? '/profile' : `/profile/${item.user_id}`} className="hover:underline">
                                <p className="font-semibold">
                                  {filter === 'my_activity' && item.user_id === user?.id ? 'You' : item.user?.display_name}
                                </p>
                              </Link>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <span>Posted in</span>
                                <Link to={`/groups/${item.group_id}`} className="hover:underline font-medium text-primary">
                                  {item.group_name}
                                </Link>
                                <span>•</span>
                                <span>{formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                          {item.user_id === user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(item.id)}
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Discussion Content */}
                        <p className="mb-4 whitespace-pre-wrap">{item.content}</p>

                        {/* Discussion Image */}
                        {item.image_url && (
                          <div className="mb-4 rounded-xl overflow-hidden border border-border/60">
                            <img
                              src={item.image_url}
                              alt="Discussion image"
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-1">
                            <ThumbsUp className={`h-4 w-4 ${item.user_reaction ? 'text-primary' : 'text-muted-foreground'}`} />
                            {item.reactions_count > 0 && (
                              <span className="text-sm text-muted-foreground px-1">
                                {item.reactions_count}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <MessageCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              {item.comments_count || 0}
                            </span>
                          </div>
                          <Link to={`/groups/${item.group_id}`} className="ml-auto">
                            <Button variant="outline" size="sm">
                              View in Group
                            </Button>
                          </Link>
                        </div>
                      </Card>
                    ) : (
                      <Card className="p-6">
                        {/* Post Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center gap-3">
                            <Link to={item.user_id === user?.id ? '/profile' : `/profile/${item.user_id}`} className="shrink-0">
                              <Avatar className="cursor-pointer hover:ring-2 hover:ring-primary transition-all">
                                <AvatarImage src={item.user?.photo_url || undefined} />
                                <AvatarFallback>
                                  {item.user?.display_name?.[0]?.toUpperCase() || 'U'}
                                </AvatarFallback>
                              </Avatar>
                            </Link>
                            <div>
                              <Link to={item.user_id === user?.id ? '/profile' : `/profile/${item.user_id}`} className="hover:underline">
                                <p className="font-semibold">
                                  {filter === 'my_activity' && item.user_id === user?.id ? 'You' : item.user?.display_name}
                                </p>
                              </Link>
                              <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          {item.user_id === user?.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteClick(item.id)}
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>

                        {/* Post Content */}
                        <p className="mb-4 whitespace-pre-wrap">{item.content}</p>

                        {/* Post Image */}
                        {item.image_url && (
                          <div className="mb-4 rounded-xl overflow-hidden border border-border/60">
                            <img
                              src={item.image_url}
                              alt="Post image"
                              className="w-full h-auto object-contain"
                            />
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 pt-4 border-t border-border">
                          <div className="flex items-center gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReaction(item.id, 'like')}
                              className={`${item.user_reaction === 'like' ? 'text-primary' : ''} hover:bg-secondary`}
                            >
                              <ThumbsUp className="h-4 w-4" />
                            </Button>
                            {item.reactions_count > 0 && (
                              <button
                                onClick={() => {
                                  setSelectedPostForReactions(item.id)
                                  setShowReactionsModal(true)
                                }}
                                className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors px-1"
                              >
                                {item.reactions_count}
                              </button>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleComments(item.id)}
                          >
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {item.comments_count || 0}
                          </Button>
                        </div>

                        {/* Comments Section */}
                        {expandedComments.has(item.id) && (
                          <CommentsSection
                            postId={item.id}
                            commentInput={commentInputs[item.id] || ''}
                            onCommentInputChange={(value) => setCommentInputs(prev => ({ ...prev, [item.id]: value }))}
                            onAddComment={() => handleAddComment(item.id)}
                            onKeyDown={(e) => handleCommentKeyDown(e, item.id)}
                          />
                        )}
                      </Card>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Intersection Observer Sentinel */}
              {hasNextPage && <div ref={loadMoreRef} className="h-20" />}

              {/* Load More Button */}
              {hasNextPage && (
                <div className="flex justify-center py-8">
                  <Button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    variant="outline"
                    className="rounded-xl px-8 flex items-center gap-2"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Spinner size="sm" />
                        <span>Loading...</span>
                      </>
                    ) : (
                      'Load More'
                    )}
                  </Button>
                </div>
              )}

              {/* End of Feed Message */}
              {!hasNextPage && posts && posts.length > 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  You've reached the end of the feed
                </div>
              )}
            </>
          )}
        </motion.div>
      </main>

      <CreatePostModal open={isCreatePostOpen} onOpenChange={setIsCreatePostOpen} />

      {/* Reactions Modal */}
      <ReactionUsersModal
        postId={selectedPostForReactions}
        open={showReactionsModal}
        onOpenChange={setShowReactionsModal}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Post"
        description="Are you sure you want to delete this post? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
