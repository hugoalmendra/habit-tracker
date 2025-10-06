import { motion } from 'framer-motion'
import { Target, CheckCircle2, LineChart, Trophy } from 'lucide-react'

const steps = [
  {
    icon: Target,
    number: '01',
    title: 'Define Your Path',
    description: 'Set your goals and let AI suggest personalized habits tailored to your aspirations.',
  },
  {
    icon: CheckCircle2,
    number: '02',
    title: 'Practice Daily',
    description: 'Check in each day and mark habits complete. Build the discipline that leads to transformation.',
  },
  {
    icon: LineChart,
    number: '03',
    title: 'Track Progress',
    description: 'Watch your consistency build over time with beautiful visualizations and insights.',
  },
  {
    icon: Trophy,
    number: '04',
    title: 'Achieve Mastery',
    description: 'Compound improvements lead to extraordinary results. Your journey unfolds, one day at a time.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-kaizen-bg dark:bg-kaizen-dark-gray relative">
      {/* Diagonal stripes pattern for dark mode */}
      <div className="absolute inset-0 dark:opacity-[0.015] opacity-0 pointer-events-none bg-[repeating-linear-gradient(45deg,rgba(255,255,255,0.03),rgba(255,255,255,0.03)_10px,transparent_10px,transparent_20px)]" />
      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-bold text-kaizen-slate dark:text-white mb-4"
          >
            Your Journey to <span className="text-kaizen-crimson">Mastery</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-300"
          >
            The path to mastery isn't found in grand gestures, but in the discipline of daily practice.
          </motion.p>
        </div>

        {/* Steps */}
        <div className="max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, x: index % 2 === 0 ? -40 : 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              className="relative"
            >
              {/* Connector Line */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute left-14 top-24 w-0.5 h-32 bg-gradient-to-b from-kaizen-crimson/50 to-transparent" />
              )}

              <div className="flex items-start gap-6 mb-12">
                {/* Icon Circle */}
                <div className="relative flex-shrink-0">
                  <div className="w-28 h-28 rounded-full bg-gradient-to-br from-kaizen-crimson to-kaizen-gold p-[2px]">
                    <div className="w-full h-full rounded-full bg-kaizen-bg dark:bg-kaizen-dark-gray flex items-center justify-center">
                      <step.icon className="h-12 w-12 text-kaizen-crimson" />
                    </div>
                  </div>
                  {/* Step Number */}
                  <div className="absolute -top-2 -right-2 w-10 h-10 rounded-full bg-kaizen-charcoal dark:bg-white text-white dark:text-kaizen-charcoal flex items-center justify-center font-bold text-sm">
                    {step.number}
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-4">
                  <h3 className="text-2xl md:text-3xl font-bold text-kaizen-slate dark:text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
