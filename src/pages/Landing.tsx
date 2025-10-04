import Navigation from '@/components/landing/Navigation'
import Hero from '@/components/landing/Hero'
import Features from '@/components/landing/Features'
import HowItWorks from '@/components/landing/HowItWorks'
import Philosophy from '@/components/landing/Philosophy'
import Testimonials from '@/components/landing/Testimonials'
import FinalCTA from '@/components/landing/FinalCTA'
import Footer from '@/components/landing/Footer'

export default function Landing() {
  return (
    <div className="min-h-screen bg-kaizen-bg">
      <Navigation />
      <Hero />
      <Features />
      <HowItWorks />
      <Philosophy />
      <Testimonials />
      <FinalCTA />
      <Footer />
    </div>
  )
}
