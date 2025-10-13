import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { motion } from 'framer-motion'
import { CheckCircle2, Lock, AlertCircle } from 'lucide-react'

export default function ResetPassword() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [validSession, setValidSession] = useState(false)

  useEffect(() => {
    // Check if we have a valid recovery session
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()

      if (session) {
        setValidSession(true)
      } else {
        setError('Invalid or expired reset link. Please request a new password reset.')
      }
    }

    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.updateUser({
        password: password
      })

      if (error) throw error

      setSuccess(true)

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        navigate('/dashboard')
      }, 2000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        <Card className="border-border/40 shadow-apple-lg">
          <CardHeader className="space-y-6 text-center pb-8">
            <div className="flex justify-center">
              <img
                src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
                alt="The Way of Kaizen"
                className="h-10 w-auto"
              />
            </div>
            <div className="space-y-2">
              {!success ? (
                <>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Lock className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-3xl font-semibold tracking-tight">
                    Reset your password
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Enter your new password below
                  </CardDescription>
                </>
              ) : (
                <>
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-500/10">
                    <CheckCircle2 className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <CardTitle className="text-3xl font-semibold tracking-tight">
                    Password reset successful
                  </CardTitle>
                  <CardDescription className="text-base text-muted-foreground">
                    Redirecting you to the dashboard...
                  </CardDescription>
                </>
              )}
            </div>
          </CardHeader>

          {!success && (
            <form onSubmit={handleSubmit}>
              <CardContent className="space-y-5">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-start gap-3 rounded-xl bg-destructive/10 px-4 py-3 text-sm text-destructive"
                  >
                    <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}

                {!validSession && !error && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <p className="text-muted-foreground mb-4">Checking reset link...</p>
                  </motion.div>
                )}

                {validSession && (
                  <>
                    <div className="space-y-3">
                      <Label htmlFor="password" className="text-sm font-medium">
                        New Password
                      </Label>
                      <Input
                        id="password"
                        type="password"
                        placeholder="Enter new password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={6}
                        autoFocus
                        className="h-12 rounded-xl border-border/50 bg-secondary/50 px-4 text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                      <p className="text-xs text-muted-foreground">
                        Must be at least 6 characters long
                      </p>
                    </div>

                    <div className="space-y-3">
                      <Label htmlFor="confirm-password" className="text-sm font-medium">
                        Confirm New Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        placeholder="Confirm new password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="h-12 rounded-xl border-border/50 bg-secondary/50 px-4 text-base placeholder:text-muted-foreground/60 focus:border-primary/50 focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all"
                      />
                    </div>
                  </>
                )}
              </CardContent>

              {validSession && (
                <CardFooter className="flex flex-col space-y-4 pt-2">
                  <Button
                    type="submit"
                    className="h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
                    disabled={loading || !validSession}
                  >
                    {loading ? 'Resetting password...' : 'Reset password'}
                  </Button>
                  <p className="text-center text-sm text-muted-foreground">
                    Remember your password?{' '}
                    <button
                      type="button"
                      onClick={() => navigate('/login')}
                      className="font-medium text-primary hover:underline underline-offset-4"
                    >
                      Sign in
                    </button>
                  </p>
                </CardFooter>
              )}
            </form>
          )}

          {!validSession && error && (
            <CardFooter className="flex flex-col space-y-4 pt-2">
              <Button
                onClick={() => navigate('/login')}
                className="h-12 w-full rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
              >
                Back to Login
              </Button>
            </CardFooter>
          )}
        </Card>
      </motion.div>
    </div>
  )
}
