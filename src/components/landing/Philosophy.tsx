import { motion } from 'framer-motion'

export default function Philosophy() {
  return (
    <section id="philosophy" className="py-32 bg-zinc-950 relative overflow-hidden">
      {/* Zen paper texture */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')]" />

      {/* Large background Kanji - very subtle */}
      <div className="absolute inset-0 opacity-[0.02] pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[24rem] font-light text-zinc-100">
          改善
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Kanji - Minimalist */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1.2 }}
            className="mb-16"
          >
            <div className="text-7xl md:text-8xl font-light text-zinc-100 mb-6">
              改善
            </div>
            <p className="text-zinc-400 text-base tracking-[0.5em] uppercase font-light">Kaizen</p>
            <p className="text-zinc-500 text-sm mt-2 font-light">Continuous Improvement</p>
          </motion.div>

          {/* Quote - Zen style */}
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-xl md:text-2xl font-light text-zinc-300 mb-12 leading-loose max-w-3xl mx-auto"
          >
            "When you improve a little each day, eventually big things occur. Not tomorrow, not the next day, but eventually a big gain is made."
          </motion.blockquote>

          {/* Divider - Minimalist */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.4 }}
            className="h-px w-24 bg-zinc-700 mx-auto mb-12"
          />

          {/* Explanation - Zen spacing */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.6 }}
            className="text-zinc-400 text-base max-w-2xl mx-auto space-y-8 font-light leading-loose"
          >
            <p>
              Kaizen is the ancient Japanese philosophy of continuous improvement through small, incremental changes.
            </p>
            <p>
              Rooted in the samurai tradition of daily discipline and deliberate practice, Kaizen teaches that mastery comes not from dramatic transformations, but from the compound effect of consistent effort.
            </p>
            <p>
              The Way of Kaizen embodies this timeless wisdom, guiding you to build lasting habits that transform your life, one day at a time.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
