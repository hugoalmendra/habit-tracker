import { Link, useLocation } from 'react-router-dom'
import { Home, TrendingUp, User, Trophy, Activity } from 'lucide-react'

export default function Navigation() {
  const location = useLocation()

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/40 bg-background/80 backdrop-blur-xl">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-around py-3">
          <Link
            to="/dashboard"
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/dashboard')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Home className="h-5 w-5" />
            <span className="text-xs font-medium">Home</span>
          </Link>

          <Link
            to="/progress"
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/progress')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <TrendingUp className="h-5 w-5" />
            <span className="text-xs font-medium">Progress</span>
          </Link>

          <Link
            to="/challenges"
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/challenges')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Trophy className="h-5 w-5" />
            <span className="text-xs font-medium">Challenges</span>
          </Link>

          <Link
            to="/feed"
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/feed')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Activity className="h-5 w-5" />
            <span className="text-xs font-medium">Feed</span>
          </Link>

          <Link
            to="/profile"
            className={`flex flex-col items-center gap-1 transition-colors ${
              isActive('/profile')
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="h-5 w-5" />
            <span className="text-xs font-medium">Profile</span>
          </Link>
        </div>
      </div>
    </nav>
  )
}
