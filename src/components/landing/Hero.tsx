import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight, Sparkles } from 'lucide-react'
import { useTheme } from '@/contexts/ThemeContext'

export default function Hero() {
  const { theme } = useTheme()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-b from-kaizen-bg via-white to-kaizen-bg dark:from-black dark:via-kaizen-dark-gray dark:to-black pt-20">
      {/* Subtle texture overlay for dark mode */}
      <div className="absolute inset-0 dark:opacity-[0.03] opacity-0 pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNiIgc3Ryb2tlPSIjZmZmIi8+PC9nPjwvc3ZnPg==')]" />
      {/* Floating Samurai Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Katana Sword */}
        <motion.div
          className="absolute top-20 left-10 text-kaizen-crimson/15 dark:text-kaizen-crimson/20 text-7xl"
          animate={{
            y: [0, -30, 0],
            rotate: [-45, -40, -45],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          ⚔️
        </motion.div>
        {/* Torii Gate */}
        <motion.div
          className="absolute top-40 right-20 text-kaizen-gold/15 dark:text-kaizen-gold/20 text-6xl"
          animate={{
            y: [0, -25, 0],
            opacity: [0.15, 0.25, 0.15],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        >
          ⛩️
        </motion.div>
        {/* Meditation/Discipline Symbol */}
        <motion.div
          className="absolute bottom-40 left-1/4 text-kaizen-charcoal/10 dark:text-white/10 text-5xl"
          animate={{
            y: [0, -20, 0],
            scale: [1, 1.1, 1],
          }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut", delay: 2 }}
        >
          🧘
        </motion.div>
        {/* Second Katana */}
        <motion.div
          className="absolute bottom-20 right-1/3 text-kaizen-crimson/10 dark:text-kaizen-crimson/15 text-6xl"
          animate={{
            y: [0, -15, 0],
            rotate: [45, 50, 45],
          }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 3 }}
        >
          ⚔️
        </motion.div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-kaizen-crimson/50 dark:bg-kaizen-crimson/50 backdrop-blur-md border border-kaizen-crimson/30 text-kaizen-crimson dark:text-kaizen-crimson text-sm font-medium mb-8"
          >
            <Sparkles className="h-4 w-4" />
            Join 10,000+ practitioners on their journey
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight mb-6"
          >
            <span className="bg-gradient-to-r from-kaizen-slate via-kaizen-charcoal to-kaizen-slate dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent">
              Master Your Life,
            </span>
            <br />
            <span className="bg-gradient-to-r from-kaizen-crimson to-kaizen-crimson-light bg-clip-text text-transparent">
              One Day at a Time
            </span>
          </motion.h1>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-3xl mx-auto leading-relaxed"
          >
            The Way of Kaizen: Transform through 1% daily improvements. Build habits, track progress, achieve mastery.
          </motion.p>

          {/* CTA Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-md mx-auto mb-6"
          >
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-kaizen-crimson/50 backdrop-blur-md text-kaizen-crimson border border-kaizen-crimson/30 hover:bg-kaizen-crimson/60 h-14 px-8 text-lg shadow-xl hover:shadow-2xl transition-all"
            >
              <Link to="/signup">
                Begin Your Journey
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-sm text-gray-500 dark:text-gray-400"
          >
            Free to start. No credit card required.
          </motion.p>

          {/* Hero Image */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.5 }}
            className="mt-16 relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white dark:border-kaizen-charcoal">
              <img
                src={theme === 'dark' ? '/dark-hero.jpg' : '/light-hero.jpg'}
                alt="The Way of Kaizen Dashboard"
                className="w-full h-auto"
              />
            </div>
            {/* Shadow effect */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-kaizen-crimson/20 to-transparent blur-3xl transform translate-y-8" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
