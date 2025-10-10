import { Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function Terms() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen bg-white dark:bg-black">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" className="h-9 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all" asChild>
              <Link to="/">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Home
              </Link>
            </Button>
            <Link to="/dashboard">
              <img
                src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
                alt="The Way of Kaizen"
                className="h-8 w-auto cursor-pointer"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <h1 className="text-4xl md:text-5xl font-bold text-kaizen-slate dark:text-white mb-4">
          Terms of Service
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-8">
          Last updated: January 2025
        </p>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              1. Acceptance of Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              By accessing and using The Way of Kaizen ("the Service"), you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              2. Description of Service
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The Way of Kaizen is a habit tracking and personal development platform that helps users build and maintain positive habits through AI-powered insights, progress tracking, and community accountability.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              3. User Accounts
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You are responsible for:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Maintaining the confidentiality of your account credentials</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and current information</li>
              <li>Notifying us immediately of any unauthorized access</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              4. Acceptable Use
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Use the Service for any illegal purpose</li>
              <li>Attempt to gain unauthorized access to the Service</li>
              <li>Interfere with or disrupt the Service</li>
              <li>Upload malicious code or viruses</li>
              <li>Harass, abuse, or harm other users</li>
              <li>Violate any applicable laws or regulations</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              5. Public Profiles
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              If you choose to make your profile public, you understand and agree that:
            </p>
            <ul className="list-disc pl-6 text-gray-700 dark:text-gray-300 space-y-2">
              <li>Your profile information and habit data will be visible to others</li>
              <li>You are responsible for the content you share publicly</li>
              <li>You can change your profile privacy settings at any time</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              6. Intellectual Property
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The Service and its original content, features, and functionality are owned by The Way of Kaizen and are protected by international copyright, trademark, and other intellectual property laws.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              7. Termination
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We may terminate or suspend your account and access to the Service immediately, without prior notice or liability, for any reason, including if you breach these Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              8. Disclaimers
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              The Service is provided "as is" without warranties of any kind, either express or implied. We do not guarantee that the Service will be uninterrupted, secure, or error-free.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              9. Limitation of Liability
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              In no event shall The Way of Kaizen be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the Service.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              10. Changes to Terms
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              We reserve the right to modify these Terms at any time. We will notify users of any material changes. Your continued use of the Service after such modifications constitutes acceptance of the updated Terms.
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-bold text-kaizen-slate dark:text-white mb-4">
              11. Contact Information
            </h2>
            <p className="text-gray-700 dark:text-gray-300 mb-4">
              For questions about these Terms, please contact us at legal@kaizen.app
            </p>
          </section>
        </div>
      </main>
    </div>
  )
}
