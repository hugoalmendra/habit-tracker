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
    <section id="how-it-works" className="py-32 bg-white relative">
      {/* Zen paper texture */}
      <div className="absolute inset-0 opacity-[0.015] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')]" />

      <div className="container mx-auto px-6 relative z-10">
        {/* Section Header - Zen style */}
        <div className="text-center max-w-2xl mx-auto mb-24">
          {/* Small Enso */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1 }}
            className="mb-8"
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

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.1 }}
            className="text-3xl md:text-4xl font-light text-stone-900 mb-6 tracking-wide"
          >
            The Four Steps
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-lg text-stone-600 font-light leading-relaxed"
          >
            The path unfolds through patient, deliberate practice
          </motion.p>
        </div>

        {/* Steps - Zen minimalist */}
        <div className="max-w-4xl mx-auto">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: index * 0.15 }}
              className="relative"
            >
              {/* Connector Line - Zen style */}
              {index < steps.length - 1 && (
                <div className="hidden md:block absolute left-8 top-20 w-px h-24 bg-stone-200" />
              )}

              <div className="flex items-start gap-8 mb-16">
                {/* Step Number - Minimalist */}
                <div className="flex-shrink-0">
                  <div className="w-16 h-16 border border-stone-300 flex items-center justify-center">
                    <span className="text-2xl font-light text-stone-400">
                      {step.number}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex-1 pt-2">
                  <div className="flex items-start gap-4 mb-4">
                    <step.icon className="h-6 w-6 text-stone-900 flex-shrink-0 mt-1" strokeWidth={1} />
                    <h3 className="text-2xl font-light text-stone-900 tracking-wide">
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-stone-600 leading-loose font-light pl-10">
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
