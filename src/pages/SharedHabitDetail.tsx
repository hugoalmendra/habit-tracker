import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Send, Calendar, CheckCircle2, Circle, UserMinus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { format, startOfWeek, addDays, isSameDay, endOfWeek } from 'date-fns'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCompletions } from '@/hooks/useCompletions'

interface SharedHabitData {
  id: string
  habit_id: string
  owner_id: string
  invited_user_id: string
  status: string
  habit: {
    id: string
    name: string
    color: string
    category: string
    description: string
  }
  owner: {
    id: string
    display_name: string
    photo_url: string
  }
  invited_user: {
    id: string
    display_name: string
    photo_url: string
  }
}

interface Message {
  id: string
  shared_habit_id: string
  user_id: string
  message: string
  created_at: string
  user?: {
    display_name: string
    photo_url: string
  }
}

export default function SharedHabitDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [messageText, setMessageText] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // Fetch shared habit details
  const { data: sharedHabit, isLoading } = useQuery({
    queryKey: ['shared-habit-detail', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('shared_habits')
        .select('*')
        .eq('id', id!)
        .single()

      if (error) throw error

      const [habitData, ownerData, invitedUserData] = await Promise.all([
        supabase
          .from('habits')
          .select('id, name, color, category, description')
          .eq('id', data.habit_id)
          .single(),
        supabase
          .from('profiles')
          .select('id, display_name, photo_url')
          .eq('id', data.owner_id)
          .single(),
        supabase
          .from('profiles')
          .select('id, display_name, photo_url')
          .eq('id', data.invited_user_id)
          .single()
      ])

      return {
        ...data,
        habit: habitData.data,
        owner: ownerData.data,
        invited_user: invitedUserData.data
      } as SharedHabitData
    },
    enabled: !!id,
  })

  // Get current week for progress calendar
  const weekStart = startOfWeek(new Date(), { weekStartsOn: 0 })
  const weekEnd = endOfWeek(new Date(), { weekStartsOn: 0 })
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i))

  // Fetch completions for the week
  const { completions } = useCompletions({
    startDate: format(weekStart, 'yyyy-MM-dd'),
    endDate: format(weekEnd, 'yyyy-MM-dd'),
  })

  // Fetch messages (stubbed - shared habits functionality removed)
  const messages: Message[] = []

  // Send message mutation (stubbed - shared habits functionality removed)
  const sendMessageMutation = useMutation({
    mutationFn: async (_message: string) => {
      // Stubbed - functionality removed
    },
    onSuccess: () => {
      setMessageText('')
    },
  })

  // Leave shared habit mutation
  const leaveSharedHabitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from('shared_habits')
        .update({ status: 'declined' })
        .eq('id', id!)

      if (error) throw error
    },
    onSuccess: () => {
      navigate('/dashboard')
    },
  })

  // Real-time subscription for messages
  useEffect(() => {
    if (!id) return

    const channel = supabase
      .channel(`shared-habit-messages-${id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'shared_habit_messages',
          filter: `shared_habit_id=eq.${id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['shared-habit-messages', id] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [id, queryClient])

  // Real-time subscription for completions
  useEffect(() => {
    if (!sharedHabit) return

    const channel = supabase
      .channel(`habit-completions-${sharedHabit.habit_id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'habit_completions',
          filter: `habit_id=eq.${sharedHabit.habit_id}`
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ['completions'] })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [sharedHabit, queryClient])

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (messageText.trim()) {
      sendMessageMutation.mutate(messageText)
    }
  }

  const handleLeaveSharedHabit = () => {
    if (window.confirm('Are you sure you want to leave this shared habit?')) {
      leaveSharedHabitMutation.mutate()
    }
  }

  const isCompleted = (userId: string, date: Date): boolean => {
    if (!completions || !sharedHabit) return false
    return completions.some(
      (c) =>
        c.habit_id === sharedHabit.habit_id &&
        c.user_id === userId &&
        isSameDay(new Date(c.completed_date), date)
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    )
  }

  if (!sharedHabit) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Shared habit not found</p>
      </div>
    )
  }

  const participants = [sharedHabit.owner, sharedHabit.invited_user]

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
          <h1 className="text-lg font-semibold">{sharedHabit.habit.name}</h1>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleLeaveSharedHabit}
            className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
          >
            <UserMinus className="h-4 w-4" />
            <span className="hidden sm:inline">Leave</span>
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Progress Section */}
          <div className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Progress
                </h2>

                {participants.map((participant) => (
                  <div key={participant.id} className="mb-6 last:mb-0">
                    <div className="flex items-center gap-3 mb-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={participant.photo_url || undefined} />
                        <AvatarFallback>
                          {participant.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <p className="font-medium">{participant.display_name}</p>
                    </div>

                    <div className="grid grid-cols-7 gap-2">
                      {weekDays.map((day) => {
                        const completed = isCompleted(participant.id, day)
                        return (
                          <div
                            key={day.toISOString()}
                            className="flex flex-col items-center"
                          >
                            <span className="text-xs text-muted-foreground mb-1">
                              {format(day, 'EEE')}
                            </span>
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                completed
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-secondary border border-border'
                              }`}
                            >
                              {completed ? (
                                <CheckCircle2 className="h-5 w-5" />
                              ) : (
                                <Circle className="h-5 w-5 text-muted-foreground" />
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </Card>
            </motion.div>
          </div>

          {/* Chat Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="p-6 flex flex-col h-[600px]">
              <h2 className="text-xl font-semibold mb-4">Chat</h2>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.map((msg) => {
                  const isOwnMessage = msg.user_id === user?.id
                  return (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${isOwnMessage ? 'flex-row-reverse' : ''}`}
                    >
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarImage src={msg.user?.photo_url || undefined} />
                        <AvatarFallback>
                          {msg.user?.display_name?.[0]?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`flex-1 ${isOwnMessage ? 'text-right' : ''}`}>
                        <p className="text-sm text-muted-foreground mb-1">
                          {msg.user?.display_name}
                        </p>
                        <div
                          className={`inline-block rounded-lg px-4 py-2 ${
                            isOwnMessage
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary'
                          }`}
                        >
                          <p className="text-sm">{msg.message}</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(msg.created_at), 'h:mm a')}
                        </p>
                      </div>
                    </div>
                  )
                })}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 rounded-lg bg-secondary border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                />
                <Button
                  type="submit"
                  size="icon"
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                >
                  <Send className="h-4 w-4" />
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </main>
    </div>
  )
}
