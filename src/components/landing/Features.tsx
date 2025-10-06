import { motion } from 'framer-motion'
import { Brain, TrendingUp, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'

const features = [
  {
    icon: Brain,
    title: 'Your Personal Sensei',
    description:
      'Your goals are unique. Your path should be too. Our AI sensei analyzes your aspirations and crafts a personalized habit strategy, guiding you with the wisdom of thousands of successful transformations.',
    visual: '🧠',
  },
  {
    icon: TrendingUp,
    title: 'Visualize Your Journey',
    description:
      'Every samurai tracked their training. Every master measured their growth. Visualize your journey with elegant heatmaps, streak tracking, and insights that reveal the power of consistency. Watch small actions compound into extraordinary results.',
    visual: '📈',
  },
  {
    icon: Users,
    title: 'Accountability Through Transparency',
    description:
      'Transparency breeds accountability. Honor demands integrity. Share your journey publicly and join a community of practitioners committed to continuous improvement. Your progress inspires others; their presence keeps you honest.',
    visual: '👥',
  },
]

export default function Features() {
  return (
    <section id="features" className="py-24 bg-white dark:bg-black relative">
      {/* Subtle grid pattern for dark mode */}
      <div className="absolute inset-0 dark:opacity-[0.02] opacity-0 pointer-events-none bg-[linear-gradient(rgba(255,255,255,.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.05)_1px,transparent_1px)] bg-[size:50px_50px]" />
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
            Master Your Path with
            <span className="text-kaizen-crimson"> Powerful Tools</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-300"
          >
            Like a samurai perfecting their craft through deliberate practice, you can achieve mastery through small, consistent actions.
          </motion.p>
        </div>

        {/* Feature Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 border-gray-200/50 dark:border-gray-800/50 hover:border-kaizen-crimson/30 hover:shadow-xl transition-all duration-300 group dark:bg-kaizen-dark-gray">
                <CardContent className="p-8">
                  {/* Icon */}
                  <div className="mb-6 inline-flex p-4 rounded-2xl bg-kaizen-crimson/10 dark:bg-kaizen-crimson/20 text-kaizen-crimson group-hover:scale-110 transition-transform">
                    <feature.icon className="h-8 w-8" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                    {feature.description}
                  </p>

                  {/* Visual Placeholder */}
                  <div className="rounded-xl bg-gradient-to-br from-kaizen-crimson/5 to-kaizen-crimson-light/5 dark:from-kaizen-crimson/10 dark:to-kaizen-crimson-light/10 p-6 text-center">
                    <div className="text-5xl mb-2">{feature.visual}</div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Feature Preview</p>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
