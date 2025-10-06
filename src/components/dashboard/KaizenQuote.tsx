import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

const KAIZEN_QUOTES = [
  {
    quote: "Small daily improvements over time lead to stunning results.",
    author: "Robin Sharma"
  },
  {
    quote: "Continuous improvement is better than delayed perfection.",
    author: "Mark Twain"
  },
  {
    quote: "The secret of change is to focus all of your energy not on fighting the old, but on building the new.",
    author: "Socrates"
  },
  {
    quote: "Success is the sum of small efforts repeated day in and day out.",
    author: "Robert Collier"
  },
  {
    quote: "A journey of a thousand miles begins with a single step.",
    author: "Lao Tzu"
  },
  {
    quote: "Progress, not perfection.",
    author: "Unknown"
  },
  {
    quote: "The man who moves a mountain begins by carrying away small stones.",
    author: "Confucius"
  },
  {
    quote: "Little by little, one travels far.",
    author: "J.R.R. Tolkien"
  },
  {
    quote: "Excellence is not a destination; it is a continuous journey that never ends.",
    author: "Brian Tracy"
  },
  {
    quote: "When you improve a little each day, eventually big things occur.",
    author: "John Wooden"
  },
  {
    quote: "The only way to do great work is to love what you do and commit to getting better every day.",
    author: "Steve Jobs"
  },
  {
    quote: "Compounding is the eighth wonder of the world. Small changes compound into remarkable results.",
    author: "Albert Einstein (adapted)"
  },
  {
    quote: "Fall seven times, stand up eight.",
    author: "Japanese Proverb"
  },
  {
    quote: "Habit is the intersection of knowledge, skill, and desire.",
    author: "Stephen Covey"
  },
  {
    quote: "We are what we repeatedly do. Excellence, then, is not an act but a habit.",
    author: "Aristotle"
  },
  {
    quote: "The best time to plant a tree was 20 years ago. The second best time is now.",
    author: "Chinese Proverb"
  },
  {
    quote: "Small deeds done are better than great deeds planned.",
    author: "Peter Marshall"
  },
  {
    quote: "If you can't do great things, do small things in a great way.",
    author: "Napoleon Hill"
  },
  {
    quote: "Perfection is not attainable, but if we chase perfection we can catch excellence.",
    author: "Vince Lombardi"
  },
  {
    quote: "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson"
  }
]

export default function KaizenQuote() {
  const [quote, setQuote] = useState(KAIZEN_QUOTES[0])

  useEffect(() => {
    // Get a consistent quote for the day based on the date
    const today = new Date().toDateString()
    const hash = today.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const index = hash % KAIZEN_QUOTES.length
    setQuote(KAIZEN_QUOTES[index])
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="h-full"
    >
      <div className="relative overflow-hidden rounded-2xl border border-border/40 bg-gradient-to-br from-primary/5 via-background to-background p-4 sm:p-5 shadow-apple h-full flex flex-col">
        {/* Decorative element */}
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl" />

        <div className="relative flex-1 flex flex-col">
          <div className="flex items-center gap-2 mb-3">
            <div className="shrink-0 p-1.5 rounded-lg bg-primary/10">
              <Sparkles className="h-4 w-4 text-primary" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Daily Wisdom
            </h3>
          </div>

          <blockquote className="flex-1 flex flex-col justify-center space-y-2">
            <p className="text-sm sm:text-base font-medium leading-relaxed text-foreground">
              "{quote.quote}"
            </p>
            <footer className="text-xs text-muted-foreground">
              — {quote.author}
            </footer>
          </blockquote>
        </div>
      </div>
    </motion.div>
  )
}
