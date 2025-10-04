import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="py-24 bg-gradient-to-br from-kaizen-bg via-white to-kaizen-bg dark:from-black dark:via-kaizen-dark-gray dark:to-black relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-0 left-0 w-96 h-96 bg-kaizen-crimson/20 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-kaizen-gold/20 rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Headline */}
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-6xl font-bold text-kaizen-slate dark:text-white mb-6"
          >
            Your Journey to Mastery{' '}
            <span className="bg-gradient-to-r from-kaizen-crimson to-kaizen-gold bg-clip-text text-transparent">
              Begins Today
            </span>
          </motion.h2>

          {/* Subheadline */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-12 max-w-2xl mx-auto"
          >
            The best time to start was yesterday. The next best time is now.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
          >
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-kaizen-crimson text-white hover:bg-kaizen-crimson/90 h-14 px-10 text-lg shadow-xl hover:shadow-2xl transition-all group"
            >
              <Link to="/signup">
                Start Your Journey
                <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </Button>

            <Button
              asChild
              size="lg"
              variant="outline"
              className="w-full sm:w-auto border-2 border-kaizen-charcoal dark:border-white text-kaizen-charcoal dark:text-white hover:bg-kaizen-charcoal hover:text-white dark:hover:bg-white dark:hover:text-kaizen-charcoal h-14 px-10 text-lg transition-all"
            >
              <Link to="/login">Sign In</Link>
            </Button>
          </motion.div>

          {/* Trust Badge */}
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="text-sm text-gray-500 dark:text-gray-400 mt-8"
          >
            Join 10,000+ practitioners • Free to start • No credit card required
          </motion.p>

          {/* Decorative Quote */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="mt-16 pt-16 border-t border-gray-200 dark:border-gray-700"
          >
            <p className="text-lg text-gray-500 dark:text-gray-400 italic">
              "A journey of a thousand miles begins with a single step"
            </p>
            <p className="text-sm text-kaizen-gold font-medium mt-2">— Lao Tzu</p>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
