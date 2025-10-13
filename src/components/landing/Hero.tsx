import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { useTheme } from '@/contexts/ThemeContext'

export default function Hero() {
  const { theme } = useTheme()

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Background Image */}
      <div className="absolute inset-0 z-0">
        <img
          src="/kaizen-landing/background-hero-light.png"
          alt=""
          className="w-full h-full object-cover dark:hidden"
        />
        <img
          src="/kaizen-landing/background-hero-dark.png"
          alt=""
          className="w-full h-full object-cover hidden dark:block"
        />
      </div>

      {/* Overlay for better text readability */}
      <div className="absolute inset-0 bg-white/40 dark:bg-black/40 z-[1]" />

      {/* Subtle Enso circles in background */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-[2]">
        {/* Large Enso - top right */}
        <motion.div
          className="absolute -top-20 -right-20 w-96 h-96"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, ease: "easeOut" }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.03] dark:opacity-[0.05]">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-stone-900 dark:text-stone-100"
              strokeLinecap="round"
              strokeDasharray="502"
              strokeDashoffset="25"
            />
          </svg>
        </motion.div>

        {/* Small Enso - bottom left */}
        <motion.div
          className="absolute -bottom-10 -left-10 w-64 h-64"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 2, delay: 0.3, ease: "easeOut" }}
        >
          <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.02] dark:opacity-[0.04]">
            <circle
              cx="100"
              cy="100"
              r="80"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              className="text-stone-900 dark:text-stone-100"
              strokeLinecap="round"
              strokeDasharray="502"
              strokeDashoffset="30"
            />
          </svg>
        </motion.div>

        {/* Bamboo stalks - minimalist */}
        <motion.div
          className="absolute top-1/4 right-12 opacity-[0.04] dark:opacity-[0.06]"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        >
          <div className="flex gap-3">
            <div className="w-1 h-32 bg-stone-900 dark:bg-stone-100 rounded-full" />
            <div className="w-1 h-24 bg-stone-900 dark:bg-stone-100 rounded-full" />
            <div className="w-1 h-28 bg-stone-900 dark:bg-stone-100 rounded-full" />
          </div>
        </motion.div>
      </div>

      <div className="container mx-auto px-6 relative z-[3]">
        <div className="max-w-4xl mx-auto text-center">
          {/* Zen symbol above headline */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="mb-12"
          >
            <svg viewBox="0 0 100 100" className="w-16 h-16 mx-auto opacity-30 dark:opacity-40">
              <circle
                cx="50"
                cy="50"
                r="35"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-stone-800 dark:text-stone-200"
                strokeLinecap="round"
                strokeDasharray="220"
                strokeDashoffset="15"
              />
            </svg>
          </motion.div>

          {/* Headline - Zen style */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
            className="text-5xl md:text-7xl lg:text-8xl font-light tracking-wide mb-8 leading-tight"
          >
            <span className="block text-stone-900 dark:text-stone-100 mb-2">
              The Way
            </span>
            <span className="block text-stone-900 dark:text-stone-100">
              of Kaizen
            </span>
          </motion.h1>

          {/* Japanese character for "way" */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.4 }}
            className="text-6xl font-light text-stone-400/30 dark:text-stone-600/30 mb-8 select-none"
          >
            道
          </motion.div>

          {/* Subheadline - More spacious */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.5, ease: "easeOut" }}
            className="text-lg md:text-xl text-stone-600 dark:text-stone-400 mb-16 max-w-2xl mx-auto leading-relaxed font-light tracking-wide"
          >
            Transform through small, deliberate steps.
            <br className="hidden md:block" />
            Build habits with intention. Achieve mastery through consistency.
          </motion.p>

          {/* CTA - Minimalist zen button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6, ease: "easeOut" }}
            className="flex flex-col items-center gap-6 mb-6"
          >
            <Button
              asChild
              size="lg"
              className="bg-stone-900 dark:bg-stone-100 text-stone-50 dark:text-stone-900 hover:bg-stone-800 dark:hover:bg-stone-200 h-12 px-12 text-base font-light tracking-widest uppercase border-none rounded-none transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Link to="/signup">
                Begin
              </Link>
            </Button>

            <p className="text-sm text-stone-500 dark:text-stone-500 font-light tracking-wide">
              Free forever · No credit card
            </p>
          </motion.div>

          {/* Hero Image - Zen minimalist border */}
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, delay: 0.8, ease: "easeOut" }}
            className="mt-24 relative"
          >
            <div className="relative overflow-hidden border border-stone-200 dark:border-stone-800 shadow-2xl">
              <img
                src={theme === 'dark' ? '/dark-hero.jpg' : '/light-hero.jpg'}
                alt="The Way of Kaizen Dashboard"
                className="w-full h-auto opacity-90"
              />
            </div>
            {/* Subtle shadow effect */}
            <div className="absolute inset-0 -z-10 bg-gradient-to-b from-stone-400/10 to-transparent blur-2xl transform translate-y-12" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
