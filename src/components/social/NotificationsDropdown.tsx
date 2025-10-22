import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotifications } from '@/hooks/useNotifications'
import { useSharedHabits } from '@/hooks/useSharedHabits'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Bell, X, User as UserIcon, Check, XCircle } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import type { Notification } from '@/hooks/useNotifications'

export default function NotificationsDropdown() {
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)
  const [processingInvite, setProcessingInvite] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, hasMore, loadMore, isLoading } = useNotifications()
  const { acceptInvite, declineInvite } = useSharedHabits()

  // Get the route path for a notification based on its type
  const getNotificationLink = (notification: Notification): string | null => {
    switch (notification.type) {
      case 'follow':
        return notification.from_user_id ? `/profile/${notification.from_user_id}` : null

      case 'shared_habit_invite':
        // Don't navigate for invites with action buttons - they handle their own flow
        return null

      case 'shared_habit_completion':
        if (notification.metadata && 'habit_id' in notification.metadata) {
          return `/dashboard?habit=${notification.metadata.habit_id}`
        }
        return '/dashboard'

      case 'post_reaction':
      case 'post_comment':
        if (notification.metadata && 'post_id' in notification.metadata) {
          return `/feed?post=${notification.metadata.post_id}`
        }
        return '/feed'

      case 'achievement':
        return '/profile'

      case 'challenge_invite':
        if (notification.metadata && 'challenge_id' in notification.metadata) {
          return `/challenge/${notification.metadata.challenge_id}`
        }
        return '/challenges'

      case 'recognition':
        return notification.from_user_id ? `/profile/${notification.from_user_id}` : null

      default:
        return null
    }
  }

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read if unread
    if (!notification.read) {
      await markAsRead(notification.id)
    }

    // Get the link for this notification
    const link = getNotificationLink(notification)

    if (link) {
      // Close the dropdown/modal
      setIsOpen(false)
      setIsMobileModalOpen(false)

      // Navigate to the link
      navigate(link)
    }
  }

  const handleMarkAllRead = async () => {
    await markAllAsRead()
  }

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation()
    await deleteNotification(notificationId)
  }

  const handleAcceptInvite = async (e: React.MouseEvent, notificationId: string, sharedHabitId: string) => {
    e.stopPropagation()
    setProcessingInvite(notificationId)
    try {
      await acceptInvite(sharedHabitId)
      await deleteNotification(notificationId)
    } catch (error) {
      console.error('Error accepting invite:', error)
    } finally {
      setProcessingInvite(null)
    }
  }

  const handleDeclineInvite = async (e: React.MouseEvent, notificationId: string, sharedHabitId: string) => {
    e.stopPropagation()
    setProcessingInvite(notificationId)
    try {
      await declineInvite(sharedHabitId)
      await deleteNotification(notificationId)
    } catch (error) {
      console.error('Error declining invite:', error)
    } finally {
      setProcessingInvite(null)
    }
  }

  const renderNotificationsList = () => (
    <>
      <div className="max-h-[500px] overflow-y-auto">
        {!notifications || notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-40" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
          </div>
        ) : (
          <div className="divide-y divide-border/40">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`p-4 cursor-pointer transition-all hover:bg-secondary/50 ${
                  !notification.read ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-border bg-secondary/50 flex items-center justify-center flex-shrink-0">
                    {notification.from_user?.photo_url ? (
                      <img
                        src={notification.from_user.photo_url}
                        alt={notification.from_user.display_name || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <UserIcon className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground">
                          {notification.from_user?.display_name || 'Someone'}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {notification.content}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="h-6 w-6 rounded-full hover:bg-destructive/10 flex items-center justify-center flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Action buttons for shared habit invites */}
                    {notification.type === 'shared_habit_invite' && notification.metadata && (
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          onClick={(e) =>
                            handleAcceptInvite(
                              e,
                              notification.id,
                              (notification.metadata as { shared_habit_id: string }).shared_habit_id
                            )
                          }
                          disabled={processingInvite === notification.id}
                          className="flex-1 h-8 text-xs bg-primary hover:bg-primary/90"
                        >
                          <Check className="h-3.5 w-3.5 mr-1" />
                          Accept
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) =>
                            handleDeclineInvite(
                              e,
                              notification.id,
                              (notification.metadata as { shared_habit_id: string }).shared_habit_id
                            )
                          }
                          disabled={processingInvite === notification.id}
                          className="flex-1 h-8 text-xs hover:bg-destructive/10 hover:text-destructive"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Decline
                        </Button>
                      </div>
                    )}

                    {!notification.read && (
                      <div className="mt-2">
                        <span className="inline-block h-2 w-2 rounded-full bg-primary" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {notifications && notifications.length > 0 && hasMore && (
        <div className="p-3 border-t border-border/40">
          <Button
            variant="ghost"
            size="sm"
            onClick={loadMore}
            disabled={isLoading}
            className="w-full h-9 rounded-lg text-sm text-primary hover:text-primary/80 hover:bg-primary/10 disabled:opacity-50"
          >
            {isLoading ? 'Loading...' : 'View past notifications'}
          </Button>
        </div>
      )}
      {notifications && notifications.length > 0 && !hasMore && (
        <div className="p-3 border-t border-border/40 text-center">
          <p className="text-xs text-muted-foreground">No more notifications</p>
        </div>
      )}
    </>
  )

  return (
    <>
      {/* Mobile Button */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileModalOpen(true)}
        className="md:hidden h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all relative flex-shrink-0"
      >
        <Bell className="h-4 w-4" />
        {unreadCount && unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </Button>

      {/* Desktop Dropdown */}
      <div className="hidden md:block relative" ref={dropdownRef}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all relative"
        >
          <Bell className="h-4 w-4" />
          {unreadCount && unreadCount > 0 ? (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-[10px] font-bold text-primary-foreground flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          ) : null}
        </Button>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute right-0 top-12 w-96 z-50"
            >
              <Card className="border-border/40 shadow-apple-lg rounded-2xl overflow-hidden">
                <div className="p-4 border-b border-border/40 flex items-center justify-between">
                  <h3 className="font-semibold text-foreground">Notifications</h3>
                  {unreadCount && unreadCount > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleMarkAllRead}
                      className="h-8 text-xs text-primary hover:text-primary/80"
                    >
                      Mark all read
                    </Button>
                  ) : null}
                </div>
                {renderNotificationsList()}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Modal */}
      <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 h-[80vh] flex flex-col">
          <DialogHeader className="p-4 border-b border-border/40">
            <div className="flex items-center justify-between">
              <DialogTitle>Notifications</DialogTitle>
              {unreadCount && unreadCount > 0 ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleMarkAllRead}
                  className="h-8 text-xs text-primary hover:text-primary/80"
                >
                  Mark all read
                </Button>
              ) : null}
            </div>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto">
            {renderNotificationsList()}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
