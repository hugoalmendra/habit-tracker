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
    hasImage: true,
  },
  {
    icon: TrendingUp,
    title: 'Visualize Your Journey',
    description:
      'Every samurai tracked their training. Every master measured their growth. Visualize your journey with elegant heatmaps, streak tracking, and insights that reveal the power of consistency. Watch small actions compound into extraordinary results.',
    visual: '📈',
    hasImage: true,
  },
  {
    icon: Users,
    title: 'Accountability Through Transparency',
    description:
      'Transparency breeds accountability. Honor demands integrity. Share your journey publicly and join a community of practitioners committed to continuous improvement. Your progress inspires others; their presence keeps you honest.',
    visual: '👥',
    hasImage: true,
  },
]

export default function Features() {
  return (
    <section id="features" className="py-32 bg-zinc-900 relative">
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
                className="text-zinc-200"
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
            className="text-3xl md:text-4xl font-light text-zinc-100 mb-6 tracking-wide"
          >
            Three Pillars of Practice
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-lg text-zinc-400 font-light leading-relaxed"
          >
            Like a master perfecting their craft, build your practice with intention and clarity
          </motion.p>
        </div>

        {/* Feature Cards - Zen minimalist */}
        <div className="grid md:grid-cols-3 gap-12 md:gap-16">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: index * 0.15 }}
            >
              <Card className="h-full border border-zinc-800 hover:border-zinc-700 hover:shadow-lg transition-all duration-500 group bg-zinc-950 rounded-none">
                <CardContent className="p-10">
                  {/* Icon - Minimalist */}
                  <div className="mb-8 inline-flex p-3 border border-zinc-700 text-zinc-100 group-hover:border-zinc-600 transition-all duration-300">
                    <feature.icon className="h-6 w-6" strokeWidth={1} />
                  </div>

                  {/* Title */}
                  <h3 className="text-xl font-light text-zinc-100 mb-4 tracking-wide">
                    {feature.title}
                  </h3>

                  {/* Description */}
                  <p className="text-zinc-400 leading-loose mb-8 font-light text-sm">
                    {feature.description}
                  </p>

                  {/* Visual Placeholder */}
                  {feature.hasImage ? (
                    <div className="overflow-hidden border border-zinc-800">
                      <img
                        src={`/feature${index + 1}-dark.jpg`}
                        alt={`${feature.title} preview`}
                        className="w-full h-auto opacity-80 hover:opacity-100 transition-opacity duration-500"
                      />
                    </div>
                  ) : (
                    <div className="border border-zinc-800 p-8 text-center">
                      <div className="text-4xl mb-2 opacity-40">{feature.visual}</div>
                      <p className="text-xs text-zinc-500 font-light tracking-wider uppercase">Preview</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
