import { Link } from 'react-router-dom'
import { Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-kaizen-charcoal text-white/80 py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <img
                src="/logo-dark.png"
                alt="The Way of Kaizen"
                className="h-8 w-auto"
              />
            </div>
            <p className="text-white/60 text-sm max-w-md">
              Transform through 1% daily improvements. Build habits, track progress, achieve mastery.
            </p>
            <div className="flex gap-4 mt-6">
              <a
                href="https://www.instagram.com/the.way.of.kaizen/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-full bg-white/10 hover:bg-kaizen-crimson flex items-center justify-center transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#features" className="hover:text-kaizen-crimson transition-colors">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="hover:text-kaizen-crimson transition-colors">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#philosophy" className="hover:text-kaizen-crimson transition-colors">
                  Philosophy
                </a>
              </li>
              <li>
                <Link to="/signup" className="hover:text-kaizen-crimson transition-colors">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-white font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link to="/privacy" className="hover:text-kaizen-crimson transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-kaizen-crimson transition-colors">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-white/50">
            © 2025 The Way of Kaizen. All rights reserved.
          </p>
          <p className="text-sm text-white/50 flex items-center gap-2">
            Made with <span className="text-kaizen-crimson">❤️</span> and <span className="text-kaizen-gold">改善</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
