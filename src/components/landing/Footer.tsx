import { Link } from 'react-router-dom'
import { Instagram } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-zinc-100 text-zinc-600 py-16">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-12 mb-12">
          {/* Brand */}
          <div className="col-span-1 sm:col-span-2 md:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <img
                src="/logo-dark.png"
                alt="The Way of Kaizen"
                className="h-7 w-auto"
              />
            </div>
            <p className="text-zinc-500 text-sm max-w-md font-light leading-relaxed">
              Transform through small, deliberate steps. Build habits with intention.
            </p>
            <div className="flex gap-4 mt-8">
              <a
                href="https://www.instagram.com/the.way.of.kaizen/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 border border-zinc-300 hover:border-zinc-400 flex items-center justify-center transition-colors"
                aria-label="Follow us on Instagram"
              >
                <Instagram className="h-4 w-4" strokeWidth={1.5} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-zinc-700 font-light mb-6 text-sm tracking-wider uppercase">Product</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <a href="#features" className="text-zinc-500 hover:text-zinc-700 transition-colors font-light">
                  Features
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-zinc-500 hover:text-zinc-700 transition-colors font-light">
                  How It Works
                </a>
              </li>
              <li>
                <a href="#philosophy" className="text-zinc-500 hover:text-zinc-700 transition-colors font-light">
                  Philosophy
                </a>
              </li>
              <li>
                <Link to="/signup" className="text-zinc-500 hover:text-zinc-700 transition-colors font-light">
                  Get Started
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-zinc-700 font-light mb-6 text-sm tracking-wider uppercase">Legal</h4>
            <ul className="space-y-3 text-sm">
              <li>
                <Link to="/privacy" className="text-zinc-500 hover:text-zinc-700 transition-colors font-light">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-zinc-500 hover:text-zinc-700 transition-colors font-light">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="w-full h-px bg-zinc-200 mb-8" />

        {/* Bottom Bar */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-zinc-500 font-light tracking-wide">
            © 2025 The Way of Kaizen. All rights reserved.
          </p>
          <p className="text-xs text-zinc-500 flex items-center gap-2 font-light">
            Made with <span className="text-kaizen-crimson">❤️</span> and <span className="text-kaizen-crimson">改善</span>
          </p>
        </div>
      </div>
    </footer>
  )
}
