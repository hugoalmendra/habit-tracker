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
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-b border-stone-200/50 dark:border-stone-800/50">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="The Way of Kaizen"
              className="h-7 w-auto"
            />
          </Link>

          {/* Desktop Navigation - Zen style */}
          <div className="hidden md:flex items-center gap-12">
            <a
              href="#features"
              className="text-sm font-light text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors tracking-wide"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-light text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors tracking-wide"
            >
              How It Works
            </a>
            <a
              href="#philosophy"
              className="text-sm font-light text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors tracking-wide"
            >
              Philosophy
            </a>
          </div>

          {/* CTA Buttons - Minimalist */}
          <div className="hidden md:flex items-center gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 rounded-none text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-900"
            >
              {theme === 'dark' ? (
                <Sun className="h-4 w-4" strokeWidth={1.5} />
              ) : (
                <Moon className="h-4 w-4" strokeWidth={1.5} />
              )}
            </Button>
            <Button variant="ghost" asChild className="text-stone-700 dark:text-stone-300 font-light hover:bg-stone-100 dark:hover:bg-stone-900 rounded-none">
              <Link to="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 rounded-none font-light tracking-wider uppercase text-xs shadow-none"
            >
              <Link to="/signup">Begin</Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="h-6 w-6 text-stone-700 dark:text-stone-300" strokeWidth={1.5} />
            ) : (
              <Menu className="h-6 w-6 text-stone-700 dark:text-stone-300" strokeWidth={1.5} />
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
                  className="block text-base font-light text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="block text-base font-light text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a
                  href="#philosophy"
                  className="block text-base font-light text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-stone-100 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Philosophy
                </a>
                <div className="pt-4 space-y-2">
                  <Button
                    variant="ghost"
                    onClick={toggleTheme}
                    className="w-full justify-start gap-2 font-light rounded-none"
                  >
                    {theme === 'dark' ? <Sun className="h-4 w-4" strokeWidth={1.5} /> : <Moon className="h-4 w-4" strokeWidth={1.5} />}
                    {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
                  </Button>
                  <Button variant="ghost" asChild className="w-full font-light rounded-none">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 rounded-none font-light tracking-wider uppercase text-xs"
                  >
                    <Link to="/signup">Begin</Link>
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
