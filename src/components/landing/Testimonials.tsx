import { motion } from 'framer-motion'
import { Card, CardContent } from '@/components/ui/card'
import { Star } from 'lucide-react'

const testimonials = [
  {
    name: 'Sarah Davis',
    role: 'Product Designer',
    image: '/avatar1.jpg',
    quote: 'The AI habit suggestions were spot-on for my goals. I\'ve built a 90-day streak and my productivity has never been better.',
    rating: 5,
  },
  {
    name: 'Marcus Johnson',
    role: 'Fitness Instructor',
    image: '/avatar2.jpg',
    quote: 'Sharing my public profile keeps me accountable. The visual progress tracking is incredibly motivating. This is the habit tracker I\'ve been looking for.',
    rating: 5,
  },
  {
    name: 'Yuki Tanaka',
    role: 'Entrepreneur',
    image: '/avatar3.jpg',
    quote: 'The philosophy of Kaizen resonates deeply with me. Small daily improvements compound into remarkable results. My clients love it too.',
    rating: 5,
  },
]

const stats = [
  { number: '10,000+', label: 'Active Users' },
  { number: '2M+', label: 'Habits Completed' },
  { number: '500+', label: 'Longest Streak (days)' },
]

export default function Testimonials() {
  return (
    <section className="py-32 bg-stone-50 dark:bg-zinc-950 relative">
      {/* Zen paper texture */}
      <div className="absolute inset-0 opacity-[0.015] dark:opacity-[0.02] pointer-events-none bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZmlsdGVyIGlkPSJub2lzZSI+PGZlVHVyYnVsZW5jZSB0eXBlPSJmcmFjdGFsTm9pc2UiIGJhc2VGcmVxdWVuY3k9IjAuOSIgbnVtT2N0YXZlcz0iNCIvPjwvZmlsdGVyPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIG9wYWNpdHk9IjAuMyIvPjwvc3ZnPg==')]" />

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
            <svg viewBox="0 0 100 100" className="w-12 h-12 mx-auto opacity-20 dark:opacity-30">
              <circle
                cx="50"
                cy="50"
                r="30"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.5"
                className="text-stone-800 dark:text-stone-200"
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
            className="text-3xl md:text-4xl font-light text-stone-900 dark:text-stone-100 mb-6 tracking-wide"
          >
            Voices from the Path
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1, delay: 0.2 }}
            className="text-lg text-stone-600 dark:text-stone-400 font-light leading-relaxed"
          >
            Stories from those walking the way
          </motion.p>
        </div>

        {/* Stats - Minimalist */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: index * 0.15 }}
              className="text-center"
            >
              <div className="text-4xl md:text-5xl font-light text-stone-900 dark:text-stone-100 mb-3">
                {stat.number}
              </div>
              <div className="text-stone-500 dark:text-stone-500 text-sm tracking-wider uppercase font-light">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial Cards - Zen style */}
        <div className="grid md:grid-cols-3 gap-12">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 1, delay: index * 0.15 }}
            >
              <Card className="h-full border border-stone-200 dark:border-stone-800 hover:border-stone-300 dark:hover:border-stone-700 hover:shadow-lg transition-all duration-500 bg-white dark:bg-black rounded-none">
                <CardContent className="p-10">
                  {/* Quote */}
                  <p className="text-stone-600 dark:text-stone-400 leading-loose mb-8 font-light">
                    "{testimonial.quote}"
                  </p>

                  {/* Divider */}
                  <div className="w-12 h-px bg-stone-300 dark:bg-stone-700 mb-8" />

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 object-cover border border-stone-300 dark:border-stone-700"
                    />
                    <div>
                      <div className="font-light text-stone-900 dark:text-stone-100">{testimonial.name}</div>
                      <div className="text-xs text-stone-500 dark:text-stone-500 uppercase tracking-wider font-light">{testimonial.role}</div>
                    </div>
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
