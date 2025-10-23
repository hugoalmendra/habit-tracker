import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { CelebrationProvider } from '@/contexts/CelebrationContext'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
import Spinner from '@/components/ui/Spinner'
import { supabase } from '@/lib/supabase'

// Pages
import Landing from '@/pages/Landing'
import Login from '@/pages/Login'
import Signup from '@/pages/Signup'
import ResetPassword from '@/pages/ResetPassword'
import Onboarding from '@/pages/Onboarding'
import Dashboard from '@/pages/Dashboard'
import Progress from '@/pages/Progress'
import Settings from '@/pages/Settings'
import Profile from '@/pages/Profile'
import Feed from '@/pages/Feed'
import Challenges from '@/pages/Challenges'
import ChallengeDetail from '@/pages/ChallengeDetail'
import JoinChallenge from '@/pages/JoinChallenge'
import PublicProfile from '@/pages/PublicProfile'
import Groups from '@/pages/Groups'
import GroupDetail from '@/pages/GroupDetail'
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'
import Groups from '@/pages/Groups'
import GroupDetail from '@/pages/GroupDetail'

// Redirect authenticated users to the correct page based on onboarding status
function AuthenticatedRedirect() {
  const { user } = useAuth()
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    async function checkOnboarding() {
      if (!user) {
        setCheckingOnboarding(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error checking onboarding status:', error)
      }

      setOnboardingCompleted((data as any)?.onboarding_completed ?? false)
      setCheckingOnboarding(false)
    }

    checkOnboarding()
  }, [user])

  if (checkingOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="xl" text="Loading..." />
      </div>
    )
  }

  // If onboarding not completed, go to onboarding; otherwise go to dashboard
  return <Navigate to={onboardingCompleted ? "/dashboard" : "/onboarding"} replace />
}

// Protected route wrapper that checks onboarding status
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [onboardingCompleted, setOnboardingCompleted] = useState<boolean | null>(null)
  const [checkingOnboarding, setCheckingOnboarding] = useState(true)

  useEffect(() => {
    async function checkOnboarding() {
      if (!user) {
        setCheckingOnboarding(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()

      if (error) {
        console.error('Error checking onboarding status:', error)
      }

      setOnboardingCompleted((data as any)?.onboarding_completed ?? false)
      setCheckingOnboarding(false)
    }

    checkOnboarding()
  }, [user])

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (checkingOnboarding) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="xl" text="Loading..." />
      </div>
    )
  }

  if (!onboardingCompleted) {
    return <Navigate to="/onboarding" replace />
  }

  return <>{children}</>
}

function AppRoutes() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Spinner size="xl" text="Loading..." />
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={user ? <AuthenticatedRedirect /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <AuthenticatedRedirect /> : <Signup />}
        />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route
          path="/onboarding"
          element={user ? <Onboarding /> : <Navigate to="/login" replace />}
        />
        <Route
          path="/dashboard"
          element={<ProtectedRoute><Dashboard /></ProtectedRoute>}
        />
        <Route
          path="/progress"
          element={<ProtectedRoute><Progress /></ProtectedRoute>}
        />
        <Route
          path="/settings"
          element={<ProtectedRoute><Settings /></ProtectedRoute>}
        />
        <Route
          path="/profile"
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
        />
        <Route
          path="/feed"
          element={<ProtectedRoute><Feed /></ProtectedRoute>}
        />
        <Route
          path="/challenges"
          element={<ProtectedRoute><Challenges /></ProtectedRoute>}
        />
        <Route
          path="/challenge/:id"
          element={<ProtectedRoute><ChallengeDetail /></ProtectedRoute>}
        />
        <Route
          path="/challenges/:id/join"
          element={<ProtectedRoute><JoinChallenge /></ProtectedRoute>}
        />
        <Route
          path="/groups"
          element={<ProtectedRoute><Groups /></ProtectedRoute>}
        />
        <Route
          path="/groups/:id"
          element={<ProtectedRoute><GroupDetail /></ProtectedRoute>}
        />
        <Route path="/profile/:userId" element={<PublicProfile />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route
          path="/groups"
          element={<ProtectedRoute><Groups /></ProtectedRoute>}
        />
        <Route
          path="/groups/:id"
          element={<ProtectedRoute><GroupDetail /></ProtectedRoute>}
        />
      </Routes>
      {user && <MobileBottomNav />}
    </>
  )
}

function App() {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 2, // 2 minutes - more aggressive caching
            gcTime: 1000 * 60 * 5, // 5 minutes in cache (renamed from cacheTime)
            refetchOnWindowFocus: false,
            refetchOnReconnect: false, // Prevent refetch on reconnect
            retry: 1,
            networkMode: 'online', // Only query when online
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <CelebrationProvider>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </CelebrationProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
