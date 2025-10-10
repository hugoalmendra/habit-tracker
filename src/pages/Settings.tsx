import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Copy, Check } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import Header from '@/components/layout/Header'

export default function Settings() {
  const { user } = useAuth()
  const [isPublic, setIsPublic] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('is_public')
        .eq('id', user.id)
        .maybeSingle()

      if (error) throw error

      if (data) {
        setIsPublic(data.is_public || false)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSavePrivacy = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          is_public: isPublic,
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Privacy settings updated successfully!')
    } catch (error) {
      console.error('Error saving privacy settings:', error)
      alert('Failed to save privacy settings. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const copyProfileLink = () => {
    const profileUrl = `${window.location.origin}/profile/${user?.id}`
    navigator.clipboard.writeText(profileUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleChangePassword = async () => {
    if (!user) return

    if (newPassword !== confirmPassword) {
      alert('New passwords do not match')
      return
    }

    if (newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }

    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) throw error

      alert('Password updated successfully!')
      setNewPassword('')
      setConfirmPassword('')
    } catch (error) {
      console.error('Error changing password:', error)
      alert('Failed to change password. Please try again.')
    } finally {
      setChangingPassword(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-lg font-medium text-muted-foreground">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-secondary">
      <Header showNotifications />

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-2">
            Settings
          </h1>
          <p className="text-base text-muted-foreground mb-10">
            Manage your account settings and privacy
          </p>

          <div className="space-y-6">
            {/* Password Change */}
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    placeholder="Enter new password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="h-12 rounded-xl border-border/50 bg-secondary/50 px-4 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-12 rounded-xl border-border/50 bg-secondary/50 px-4 text-base"
                  />
                </div>

                <Button
                  onClick={handleChangePassword}
                  disabled={changingPassword || !newPassword || !confirmPassword}
                  className="w-full h-12 rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
                >
                  {changingPassword ? 'Changing Password...' : 'Change Password'}
                </Button>
              </CardContent>
            </Card>

            {/* Privacy Settings */}
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardHeader>
                <CardTitle>Privacy Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Make profile public</Label>
                    <p className="text-sm text-muted-foreground">
                      Allow others to view your habits and progress
                    </p>
                  </div>
                  <button
                    onClick={() => setIsPublic(!isPublic)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      isPublic ? 'bg-primary' : 'bg-border'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        isPublic ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>

                {isPublic && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-2"
                  >
                    <Label>Share your profile</Label>
                    <div className="flex gap-2">
                      <Input
                        value={`${window.location.origin}/profile/${user?.id}`}
                        readOnly
                        className="h-12 rounded-xl border-border/50 bg-secondary/50 px-4 text-base"
                      />
                      <Button
                        onClick={copyProfileLink}
                        className="h-12 rounded-xl bg-primary px-4 text-primary-foreground hover:bg-primary/90"
                      >
                        {copied ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Copy className="h-5 w-5" />
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}

                <Button
                  onClick={handleSavePrivacy}
                  disabled={saving}
                  className="w-full h-12 rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
                >
                  {saving ? 'Saving...' : 'Save Privacy Settings'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
