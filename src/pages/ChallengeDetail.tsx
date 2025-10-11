import { useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Trophy, UserPlus, Calendar, Target, Award, CheckCircle2, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useChallenges, useChallengeParticipants } from '@/hooks/useChallenges'
import { useAuth } from '@/contexts/AuthContext'
import InviteParticipantsModal from '@/components/challenges/InviteParticipantsModal'
import { format } from 'date-fns'

const CATEGORIES = [
  { name: 'Health', color: '#34C759', emoji: '💪' },
  { name: 'Hustle', color: '#FF9500', emoji: '🚀' },
  { name: 'Heart', color: '#FF2D55', emoji: '❤️' },
  { name: 'Harmony', color: '#5E5CE6', emoji: '🧘' },
  { name: 'Happiness', color: '#FFD60A', emoji: '😊' },
]

export default function ChallengeDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [inviteModalOpen, setInviteModalOpen] = useState(false)
  const [isRecording, setIsRecording] = useState(false)

  const { challenges, respondToInvite, recordCompletion, leaveChallenge } = useChallenges()
  const { participants } = useChallengeParticipants(id!)

  const challenge = challenges?.find(c => c.id === id)
  const category = CATEGORIES.find(c => c.name === challenge?.category)

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

  const handleRecordCompletion = async () => {
    if (!id || !isParticipant) return
    setIsRecording(true)
    try {
      await recordCompletion(id)
    } catch (error) {
      console.error('Error recording completion:', error)
      alert('Failed to record completion. You may have already completed this today.')
    } finally {
      setIsRecording(false)
    }
  }

  const handleLeaveChallenge = async () => {
    if (!id || !isParticipant || isCreator) return

    const confirmed = window.confirm('Are you sure you want to leave this challenge? Your progress will be lost.')
    if (!confirmed) return

    try {
      await leaveChallenge(id)
      navigate('/challenges')
    } catch (error) {
      console.error('Error leaving challenge:', error)
      alert('Failed to leave challenge. Please try again.')
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

  const progressPercentage = Math.min(
    ((userParticipation?.current_progress || 0) / challenge.target_value) * 100,
    100
  )

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
            {category && (
              <div
                className="h-14 w-14 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ backgroundColor: category.color }}
              >
                {category.emoji}
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-bold mb-1">{challenge.name}</h1>
              {challenge.description && (
                <p className="text-muted-foreground text-sm">{challenge.description}</p>
              )}
            </div>
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
                <Target className="h-4 w-4" />
                <span className="text-xs font-medium">Target</span>
              </div>
              <p className="text-sm font-semibold">
                {challenge.target_value} {challenge.target_type === 'daily_completion' ? 'days' : challenge.target_type === 'streak' ? 'day streak' : 'completions'}
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

          {/* Progress (for participants) */}
          {isParticipant && (
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Your Progress</span>
                <span className="text-sm text-muted-foreground">
                  {userParticipation?.current_progress}/{challenge.target_value}
                </span>
              </div>
              <div className="h-3 bg-secondary rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
              {challenge.target_type === 'streak' && (
                <p className="text-xs text-muted-foreground mt-2">
                  Current streak: {userParticipation?.current_streak || 0} days
                </p>
              )}
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
            {isParticipant && isActive && (
              <Button
                onClick={handleRecordCompletion}
                disabled={isRecording}
                className="flex-1 rounded-xl bg-green-600 hover:bg-green-700"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isRecording ? 'Recording...' : 'Mark Complete'}
              </Button>
            )}
            {isParticipant && !isCreator && (
              <Button
                onClick={handleLeaveChallenge}
                variant="outline"
                className="rounded-xl text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
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
                      {participant.current_progress} / {challenge.target_value}
                      {challenge.target_type === 'streak' && ` • ${participant.current_streak} day streak`}
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
    </div>
  )
}
