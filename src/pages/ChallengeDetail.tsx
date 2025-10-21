import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, UserPlus, Calendar, Award, LogOut, Edit2, Trash2, MoreVertical, ListChecks } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChallenges, useChallengeParticipants } from '@/hooks/useChallenges'
import { useAuth } from '@/contexts/AuthContext'
import InviteParticipantsModal from '@/components/challenges/InviteParticipantsModal'
import EditChallengeModal from '@/components/challenges/EditChallengeModal'
import ConfirmDialog from '@/components/ui/ConfirmDialog'
import { format } from 'date-fns'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'


export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [editModalOpen, setEditModalOpen] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)

  const { challenges, respondToInvite, leaveChallenge, deleteChallenge } = useChallenges()
  const { participants } = useChallengeParticipants(id!)

  const challenge = challenges?.find(c => c.id === id)

  const isCreator = challenge?.creator_id === user?.id
  const userParticipation = challenge?.user_participation
  const isParticipant = userParticipation?.status === 'accepted' || userParticipation?.status === 'completed'
  const hasInvite = userParticipation?.status === 'invited'

  const handleAcceptInvite = async () => {
    if (!id) return
    try {
      await respondToInvite({ challengeId: id, status: 'accepted' })
    } catch (error) {
      console.error('Error accepting invite:', error)
    }
  }

  const handleDeclineInvite = async () => {
    if (!id) return
    try {
      await respondToInvite({ challengeId: id, status: 'declined' })
      navigate('/challenges')
    } catch (error) {
      console.error('Error declining invite:', error)
    }
  }

  const handleLeaveClick = () => {
    setShowLeaveConfirm(true)
  }

  const handleConfirmLeave = async () => {
    if (!id) return

    try {
      await leaveChallenge(id)
      navigate('/challenges')
    } catch (error) {
      console.error('Error leaving challenge:', error)
      alert('Failed to leave challenge. Please try again.')
    }
  }

  const handleDeleteClick = () => {
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = async () => {
    if (!id) return

    try {
      await deleteChallenge(id)
      navigate('/challenges')
    } catch (error) {
      console.error('Error deleting challenge:', error)
      alert('Failed to delete challenge. Please try again.')
    }
  }

  if (!challenge) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Challenge not found</p>
          <Button onClick={() => navigate('/challenges')} className="mt-4">
            Back to Challenges
          </Button>
        </div>
      </div>
    )
  }

  const startDate = new Date(challenge.start_date)
  const endDate = new Date(challenge.end_date)
  const today = new Date()
  const isActive = today >= startDate && today <= endDate
  const isUpcoming = today < startDate

  const totalHabits = challenge.habits?.length || 0

  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Header */}
      <div className="bg-background border-b border-border/60 sticky top-0 z-10 backdrop-blur-lg bg-background/80">
        <div className="max-w-2xl mx-auto px-4 py-4">
          <button
            onClick={() => navigate('/challenges')}
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm font-medium">Back</span>
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Challenge Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-6 shadow-apple border border-border/60"
        >
          <div className="flex items-start gap-4 mb-4">
            {challenge.badge_icon && (
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: challenge.badge_color || '#3b82f6' }}
              >
                {challenge.badge_icon}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-1">{challenge.name}</h1>
              {challenge.description && (
                <p className="text-muted-foreground text-sm">{challenge.description}</p>
              )}
            </div>
            {isCreator && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full h-9 w-9 flex-shrink-0">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    Edit Challenge
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={handleDeleteClick}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Challenge
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {/* Challenge Info */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-secondary/50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <Calendar className="h-4 w-4" />
                <span className="text-xs font-medium">Duration</span>
              </div>
              <p className="text-sm font-semibold">
                {format(startDate, 'MMM d')} - {format(endDate, 'MMM d')}
              </p>
            </div>
            <div className="bg-secondary/50 rounded-xl p-3">
              <div className="flex items-center gap-2 text-muted-foreground mb-1">
                <ListChecks className="h-4 w-4" />
                <span className="text-xs font-medium">Habits</span>
              </div>
              <p className="text-sm font-semibold">
                {totalHabits} {totalHabits === 1 ? 'habit' : 'habits'}
              </p>
            </div>
          </div>

          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-4">
            <span className={`px-3 py-1 rounded-full text-xs font-medium ${
              isActive ? 'bg-green-500/10 text-green-600 dark:text-green-400' :
              isUpcoming ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
              'bg-gray-500/10 text-gray-600 dark:text-gray-400'
            }`}>
              {isActive ? 'Active' : isUpcoming ? 'Upcoming' : 'Completed'}
            </span>
            {userParticipation?.badge_earned && (
              <span className="px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 flex items-center gap-1">
                <Award className="h-3 w-3" />
                Badge Earned
              </span>
            )}
          </div>

          {/* Invite/Accept/Decline Actions */}
          {hasInvite && (
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
              <p className="text-sm font-medium mb-3">You've been invited to this challenge!</p>
              <div className="flex gap-2">
                <Button
                  onClick={handleAcceptInvite}
                  className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                >
                  Accept
                </Button>
                <Button
                  onClick={handleDeclineInvite}
                  variant="outline"
                  className="flex-1 rounded-xl"
                >
                  Decline
                </Button>
              </div>
            </div>
          )}

          {/* Habits List */}
          {challenge.habits && challenge.habits.length > 0 && (
            <div className="mb-4">
              <h3 className="text-sm font-medium mb-3">Challenge Habits</h3>
              <div className="space-y-2">
                {challenge.habits.map((habit) => (
                  <div
                    key={habit.id}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50"
                  >
                    <div
                      className="h-3 w-3 rounded-full flex-shrink-0"
                      style={{ backgroundColor: habit.color || '#34C759' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{habit.name}</p>
                      {habit.description && (
                        <p className="text-xs text-muted-foreground truncate">
                          {habit.description}
                        </p>
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">
                      {habit.category}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2">
            {isCreator && (
              <Button
                onClick={() => setInviteModalOpen(true)}
                className="flex-1 rounded-xl"
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Invite Friends
              </Button>
            )}
            {isParticipant && !isCreator && (
              <Button
                onClick={handleLeaveClick}
                variant="outline"
                className="flex-1 rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Leave
              </Button>
            )}
          </div>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 shadow-apple border border-border/60"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <h2 className="text-lg font-semibold">Leaderboard</h2>
          </div>

          {participants && participants.length > 0 ? (
            <div className="space-y-2">
              {participants.map((participant, index) => (
                <div
                  key={participant.id}
                  className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                    participant.user_id === user?.id
                      ? 'bg-primary/10 ring-2 ring-primary/20'
                      : 'bg-secondary/50'
                  }`}
                >
                  <div className={`flex items-center justify-center h-8 w-8 rounded-full font-bold text-sm ${
                    index === 0 ? 'bg-yellow-500 text-white' :
                    index === 1 ? 'bg-gray-400 text-white' :
                    index === 2 ? 'bg-orange-700 text-white' :
                    'bg-secondary text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <Link
                    to={participant.user_id === user?.id ? '/profile' : `/profile/${participant.user_id}`}
                    className="shrink-0"
                  >
                    <img
                      src={participant.user?.photo_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.user_id}`}
                      alt={participant.user?.display_name || 'User'}
                      className="h-10 w-10 rounded-full object-cover cursor-pointer hover:ring-2 hover:ring-primary transition-all"
                    />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link
                      to={participant.user_id === user?.id ? '/profile' : `/profile/${participant.user_id}`}
                      className="hover:underline"
                    >
                      <p className="font-medium text-sm truncate">
                        {participant.user?.display_name || 'Unknown User'}
                        {participant.user_id === user?.id && ' (You)'}
                      </p>
                    </Link>
                    <p className="text-xs text-muted-foreground">
                      {participant.current_progress || 0} / {participant.total_habits || totalHabits} habits completed today
                    </p>
                  </div>
                  {participant.badge_earned && (
                    <Award className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground text-sm">
              No participants yet
            </div>
          )}
        </motion.div>
      </div>

      {/* Invite Modal */}
      <InviteParticipantsModal
        open={inviteModalOpen}
        onOpenChange={setInviteModalOpen}
        challengeId={challenge.id}
        challengeName={challenge.name}
      />

      {/* Edit Modal */}
      {challenge && (
        <EditChallengeModal
          open={editModalOpen}
          onOpenChange={setEditModalOpen}
          challenge={challenge}
        />
      )}

      {/* Leave Confirmation */}
      <ConfirmDialog
        open={showLeaveConfirm}
        onOpenChange={setShowLeaveConfirm}
        onConfirm={handleConfirmLeave}
        title="Leave Challenge"
        description="Are you sure you want to leave this challenge? Your progress will be lost."
        confirmText="Leave"
        cancelText="Cancel"
        variant="warning"
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Challenge"
        description="Are you sure you want to delete this challenge? This action cannot be undone and all participant data will be lost."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
      />
    </div>
  )
}
