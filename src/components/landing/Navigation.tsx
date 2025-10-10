import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Menu, X, Moon, Sun } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const { theme, toggleTheme } = useTheme()

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 dark:bg-black/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="The Way of Kaizen"
              className="h-8 w-auto"
            />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            <a
              href="#features"
              className="text-sm font-medium text-kaizen-slate dark:text-gray-300 hover:text-kaizen-crimson dark:hover:text-kaizen-crimson transition-colors"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-medium text-kaizen-slate dark:text-gray-300 hover:text-kaizen-crimson dark:hover:text-kaizen-crimson transition-colors"
            >
              How It Works
            </a>
            <a
              href="#philosophy"
              className="text-sm font-medium text-kaizen-slate dark:text-gray-300 hover:text-kaizen-crimson dark:hover:text-kaizen-crimson transition-colors"
            >
              Philosophy
            </a>
          </div>

          {/* CTA Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 rounded-lg text-kaizen-slate dark:text-gray-300"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </Button>
            <Button variant="ghost" asChild className="text-kaizen-slate dark:text-gray-300">
              <Link to="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-kaizen-crimson text-white hover:bg-kaizen-crimson/90 shadow-lg"
            >
              <Link to="/signup">Get Started</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-kaizen-slate dark:text-gray-300" />
            ) : (
              <Menu className="h-6 w-6 text-kaizen-slate dark:text-gray-300" />
            )}
          </button>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden overflow-hidden"
            >
              <div className="pt-4 pb-6 space-y-4">
                <a
                  href="#features"
                  className="block text-base font-medium text-kaizen-slate dark:text-gray-300 hover:text-kaizen-crimson transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="block text-base font-medium text-kaizen-slate dark:text-gray-300 hover:text-kaizen-crimson transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a
                  href="#philosophy"
                  className="block text-base font-medium text-kaizen-slate dark:text-gray-300 hover:text-kaizen-crimson transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Philosophy
                </a>
                <div className="pt-4 space-y-2">
                  <Button
                    variant="ghost"
                    onClick={toggleTheme}
                    className="w-full justify-start gap-2"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </Button>
                  <Button variant="ghost" asChild className="w-full">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-kaizen-crimson text-white hover:bg-kaizen-crimson/90"
                  >
                    <Link to="/signup">Get Started</Link>
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </nav>
  )
}
