import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Moon, Sun } from 'lucide-react'
import NotificationsDropdown from '@/components/social/NotificationsDropdown'
import AvatarDropdown from '@/components/layout/AvatarDropdown'
import GlobalSearch from '@/components/layout/GlobalSearch'
import GroupsNotificationBadge from '@/components/groups/GroupsNotificationBadge'

interface HeaderProps {
  showNotifications?: boolean
}

export default function Header({ showNotifications = false }: HeaderProps) {
  const { theme, toggleTheme } = useTheme()

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
      <div className="container mx-auto px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
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
            {showNotifications && <NotificationsDropdown />}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 flex-shrink-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <div className="flex-shrink-0">
              <AvatarDropdown />
            </div>
          </div>
        </div>
      </div>
    </header>
  )
}
