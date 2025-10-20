import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

export default function JoinChallenge() {
  const { id: challengeId } = useParams<{ id: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'already-joined'>('loading')
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const joinChallenge = async () => {
      if (!user || !challengeId) {
        setStatus('error')
        setErrorMessage('Invalid invitation link')
        return
      }

      try {
        // Check if already a participant
        const { data: existingParticipant } = await supabase
          .from('challenge_participants')
          .select('id')
          .eq('challenge_id', challengeId)
          .eq('user_id', user.id)
          .single()

        if (existingParticipant) {
          setStatus('already-joined')
          setTimeout(() => navigate(`/challenge/${challengeId}`), 2000)
          return
        }

        // Check if challenge exists
        const { data: challenge, error: challengeError } = await supabase
          .from('challenges')
          .select('name')
          .eq('id', challengeId)
          .single()

        if (challengeError || !challenge) {
          setStatus('error')
          setErrorMessage('Challenge not found')
          return
        }

        // Join the challenge
        const { error: joinError } = await supabase
          .from('challenge_participants')
          .insert({
            challenge_id: challengeId,
            user_id: user.id,
            status: 'active',
            joined_at: new Date().toISOString()
          })

        if (joinError) {
          setStatus('error')
          setErrorMessage('Failed to join challenge')
          console.error('Error joining challenge:', joinError)
          return
        }

        setStatus('success')
        setTimeout(() => navigate(`/challenge/${challengeId}`), 2000)
      } catch (error) {
        console.error('Error joining challenge:', error)
        setStatus('error')
        setErrorMessage('An unexpected error occurred')
      }
    }

    joinChallenge()
  }, [user, challengeId, navigate])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-apple-lg text-center">
        {status === 'loading' && (
          <>
            <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-semibold mb-2">Joining Challenge...</h1>
            <p className="text-muted-foreground">Please wait while we add you to the challenge</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-green-500">Successfully Joined!</h1>
            <p className="text-muted-foreground">Redirecting to challenge...</p>
          </>
        )}

        {status === 'already-joined' && (
          <>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-blue-500">Already a Member</h1>
            <p className="text-muted-foreground">You're already part of this challenge. Redirecting...</p>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <svg className="h-6 w-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-2xl font-semibold mb-2 text-red-500">Failed to Join</h1>
            <p className="text-muted-foreground mb-4">{errorMessage}</p>
            <button
              onClick={() => navigate('/challenges')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-xl hover:bg-primary/90 transition-colors"
            >
              Go to Challenges
            </button>
          </>
        )}
      </div>
    </div>
  )
}
