import { motion } from 'framer-motion'

export default function Philosophy() {
  return (
    <section id="philosophy" className="py-24 bg-gradient-to-br from-kaizen-charcoal via-kaizen-slate to-kaizen-charcoal relative overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-1/4 left-1/4 text-[20rem] font-bold text-white">
          改善
        </div>
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Kanji */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="mb-12"
          >
            <div className="text-8xl md:text-9xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-kaizen-crimson via-kaizen-crimson-light to-kaizen-crimson">
              改善
            </div>
            <p className="text-white/80 text-xl mt-4 tracking-widest">KAIZEN</p>
          </motion.div>

          {/* Quote */}
          <motion.blockquote
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-2xl md:text-3xl font-medium text-white/90 italic mb-8 leading-relaxed"
          >
            "When you improve a little each day, eventually big things occur. Not tomorrow, not the next day, but eventually a big gain is made."
          </motion.blockquote>

          {/* Divider */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            whileInView={{ opacity: 1, scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="h-px w-32 bg-gradient-to-r from-transparent via-kaizen-crimson-light to-transparent mx-auto mb-8"
          />

          {/* Explanation */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-white/70 text-lg max-w-3xl mx-auto space-y-6"
          >
            <p>
              <span className="text-kaizen-gold font-semibold">Kaizen (改善)</span> is the ancient Japanese philosophy of continuous improvement through small, incremental changes.
            </p>
            <p>
              Rooted in the samurai tradition of daily discipline and deliberate practice, Kaizen teaches that mastery comes not from dramatic transformations, but from the compound effect of 1% improvements every day.
            </p>
            <p>
              The Way of Kaizen embodies this timeless wisdom, guiding you to build lasting habits that transform your life, one day at a time.
            </p>
          </motion.div>

          {/* Decorative Element */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.8 }}
            className="mt-12 flex justify-center gap-4"
          >
            <div className="w-16 h-16 rounded-full border-2 border-kaizen-crimson/30" />
            <div className="w-16 h-16 rounded-full border-2 border-kaizen-gold/30" />
            <div className="w-16 h-16 rounded-full border-2 border-white/30" />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
