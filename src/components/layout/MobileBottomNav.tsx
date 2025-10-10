import { Link, useLocation } from 'react-router-dom'
import { Home, TrendingUp, Trophy, Users } from 'lucide-react'
import { motion } from 'framer-motion'

export default function MobileBottomNav() {
  const location = useLocation()

  const navItems = [
    { path: '/dashboard', icon: Home, label: 'Home' },
    { path: '/progress', icon: TrendingUp, label: 'Progress' },
    { path: '/challenges', icon: Trophy, label: 'Challenges' },
    { path: '/feed', icon: Users, label: 'Feed' },
  ]

  const isActive = (path: string) => location.pathname === path

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-t border-border/40 shadow-apple-lg">
      <div className="grid grid-cols-4 h-16 px-2">
        {navItems.map(({ path, icon: Icon, label }) => {
          const active = isActive(path)

          return (
            <Link
              key={path}
              to={path}
              className="relative flex flex-col items-center justify-center gap-1 group"
            >
              <div className={`flex items-center justify-center transition-all ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              </div>
              <span className={`text-xs font-medium transition-all ${
                active ? 'text-primary' : 'text-muted-foreground'
              }`}>
                {label}
              </span>

              {active && (
                <motion.div
                  layoutId="bottomNavIndicator"
                  className="absolute -top-px left-0 right-0 h-0.5 bg-primary"
                  initial={false}
                  transition={{ type: 'spring', stiffness: 500, damping: 40 }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
