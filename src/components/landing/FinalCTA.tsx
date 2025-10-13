import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'

export default function FinalCTA() {
  return (
    <section className="py-32 bg-white relative overflow-hidden">
      {/* Zen paper texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')]" />

      {/* Large Enso background */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] pointer-events-none">
        <svg viewBox="0 0 200 200" className="w-full h-full opacity-[0.02]">
          <circle
            cx="100"
            cy="100"
            r="90"
            fill="none"
            stroke="currentColor"
            strokeWidth="0.5"
            className="text-stone-900"
            strokeLinecap="round"
            strokeDasharray="565"
            strokeDashoffset="30"
          />
        </svg>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          {/* Small Enso */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-12"
          >
            <svg viewBox="0 0 100 100" className="w-12 h-12 mx-auto opacity-20">
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-stone-800"
                strokeLinecap="round"
                strokeDasharray="188"
                strokeDashoffset="12"
              />
            </svg>
          </motion.div>

          {/* Headline - Zen style */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.1 }}
            className="text-3xl md:text-5xl font-light text-stone-900 mb-8 tracking-wide leading-tight"
          >
            Begin Your Practice
          </motion.h2>

          {/* Japanese character */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-5xl font-light text-stone-400/30 mb-12 select-none"
          >
            始
          </motion.div>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg text-stone-600 mb-16 max-w-xl mx-auto font-light leading-loose"
          >
            The best time to plant a tree was twenty years ago.
            <br />
            The second best time is now.
          </motion.p>

          {/* CTA Button - Minimalist */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="flex flex-col items-center gap-8 mb-12"
          >
            <Button
              asChild
              size="lg"
              className="bg-stone-900 text-stone-50 hover:bg-stone-800 h-12 px-16 text-base font-light tracking-widest uppercase border-none rounded-none transition-all duration-300 shadow-lg hover:shadow-xl"
            >
              <Link to="/signup">
                Begin
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="ghost"
              className="text-stone-600 hover:text-stone-900 h-12 px-8 text-sm font-light tracking-wider uppercase transition-all duration-300"
            >
              <Link to="/login">Sign In</Link>
            </Button>
          </motion.div>

          {/* Divider line */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.5 }}
            className="w-16 h-px bg-stone-300 mx-auto mb-12"
          />

          {/* Trust Badge */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-xs text-stone-500 font-light tracking-wider"
          >
            Free forever · No credit card
          </motion.p>
        </div>
      </div>
    </section>
  )
}
