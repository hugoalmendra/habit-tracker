import { useState, useEffect } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from '@/contexts/AuthContext'
import { ThemeProvider } from '@/contexts/ThemeContext'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import MobileBottomNav from '@/components/layout/MobileBottomNav'
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
import Privacy from '@/pages/Privacy'
import Terms from '@/pages/Terms'

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

      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', user.id)
        .maybeSingle()

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
        <div className="text-lg">Loading...</div>
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
        <div className="text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="/signup"
          element={user ? <Navigate to="/onboarding" replace /> : <Signup />}
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
        <Route path="/profile/:userId" element={<PublicProfile />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
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
            staleTime: 1000 * 60 * 5, // 5 minutes
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
