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
    <section className="py-24 bg-white dark:bg-black relative">
      {/* Dot pattern for dark mode */}
      <div className="absolute inset-0 dark:opacity-[0.02] opacity-0 pointer-events-none bg-[radial-gradient(rgba(255,255,255,0.1)_1px,transparent_1px)] bg-[size:20px_20px]" />
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
            Trusted by <span className="text-kaizen-crimson">Thousands</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-gray-600 dark:text-gray-300"
          >
            Join a community of practitioners committed to daily excellence
          </motion.p>
        </div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
        >
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
              className="text-center"
            >
              <div className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-kaizen-crimson to-kaizen-crimson-light bg-clip-text text-transparent mb-2">
                {stat.number}
              </div>
              <div className="text-gray-600 font-medium">{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>

        {/* Testimonial Cards */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
            >
              <Card className="h-full border-2 border-white/20 dark:border-white/10 hover:border-kaizen-crimson/30 dark:hover:border-kaizen-crimson/50 hover:shadow-xl dark:hover:shadow-kaizen-crimson/10 transition-all duration-300">
                <CardContent className="p-8">
                  {/* Rating */}
                  <div className="flex gap-1 mb-4">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-kaizen-gold text-kaizen-gold" />
                    ))}
                  </div>

                  {/* Quote */}
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </p>

                  {/* Author */}
                  <div className="flex items-center gap-4">
                    <img
                      src={testimonial.image}
                      alt={testimonial.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <div className="font-bold text-kaizen-slate dark:text-white">{testimonial.name}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</div>
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
