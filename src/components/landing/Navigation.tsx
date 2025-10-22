import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function Navigation() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-xl border-b border-stone-200/50">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-3">
            <img
              src="/logo-light.png"
              alt="The Way of Kaizen"
              className="h-7 w-auto"
            />
          </Link>

          {/* Desktop Navigation - Zen style */}
          <div className="hidden md:flex items-center gap-12">
            <a
              href="#features"
              className="text-sm font-light text-stone-700 hover:text-stone-900 transition-colors tracking-wide"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="text-sm font-light text-stone-700 hover:text-stone-900 transition-colors tracking-wide"
            >
              How It Works
            </a>
            <a
              href="#philosophy"
              className="text-sm font-light text-stone-700 hover:text-stone-900 transition-colors tracking-wide"
            >
              Philosophy
            </a>
          </div>

          {/* CTA Buttons - Minimalist */}
          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" asChild className="text-stone-700 font-light hover:bg-stone-100 rounded-none">
              <Link to="/login">Login</Link>
            </Button>
            <Button
              asChild
              className="bg-stone-900 text-stone-50 hover:bg-stone-800 rounded-none font-light tracking-wider uppercase text-xs shadow-none"
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
              <X className="h-6 w-6 text-stone-700" strokeWidth={1.5} />
            ) : (
              <Menu className="h-6 w-6 text-stone-700" strokeWidth={1.5} />
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
                  className="block text-base font-light text-stone-700 hover:text-stone-900 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Features
                </a>
                <a
                  href="#how-it-works"
                  className="block text-base font-light text-stone-700 hover:text-stone-900 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  How It Works
                </a>
                <a
                  href="#philosophy"
                  className="block text-base font-light text-stone-700 hover:text-stone-900 transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Philosophy
                </a>
                <div className="pt-4 space-y-2">
                  <Button variant="outline" asChild className="w-full font-medium rounded-none border-stone-900 text-stone-900 hover:bg-stone-900 hover:text-stone-50">
                    <Link to="/login">Login</Link>
                  </Button>
                  <Button
                    asChild
                    className="w-full bg-stone-900 text-stone-50 hover:bg-stone-800 rounded-none font-light tracking-wider uppercase text-xs"
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
