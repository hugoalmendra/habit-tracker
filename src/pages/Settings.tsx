import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useTheme } from '@/contexts/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ArrowLeft, Upload, Copy, Check, X, User } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

export default function Settings() {
  const { user } = useAuth()
  const { theme } = useTheme()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [displayName, setDisplayName] = useState('')
  const [photoUrl, setPhotoUrl] = useState('')
  const [bio, setBio] = useState('')
  const [isPublic, setIsPublic] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    loadProfile()
  }, [user])

  const loadProfile = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('display_name, photo_url, bio, is_public')
        .eq('id', user.id)
        .single()

      if (error) throw error

      if (data) {
        setDisplayName(data.display_name || '')
        setPhotoUrl(data.photo_url || '')
        setBio(data.bio || '')
        setIsPublic(data.is_public || false)
      }
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    if (!user) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          photo_url: photoUrl,
          bio: bio,
          is_public: isPublic,
        })
        .eq('id', user.id)

      if (error) throw error

      alert('Profile updated successfully!')
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
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

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPG, PNG, or WebP)')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    setUploading(true)
    try {
      // Delete old photo if exists
      if (photoUrl) {
        const oldPath = photoUrl.split('/').pop()
        if (oldPath) {
          await supabase.storage
            .from('profile-photos')
            .remove([`${user.id}/${oldPath}`])
        }
      }

      // Upload new photo
      const fileExt = file.name.split('.').pop()
      const fileName = `avatar-${Date.now()}.${fileExt}`
      const filePath = `${user.id}/${fileName}`

      const { error: uploadError } = await supabase.storage
        .from('profile-photos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) throw uploadError

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      setPhotoUrl(urlData.publicUrl)

      // Auto-save to database
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      alert('Photo uploaded successfully!')
    } catch (error) {
      console.error('Error uploading photo:', error)
      alert('Failed to upload photo. Please try again.')
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemovePhoto = async () => {
    if (!user || !photoUrl) return

    if (!confirm('Are you sure you want to remove your profile photo?')) return

    setUploading(true)
    try {
      // Delete from storage
      const oldPath = photoUrl.split('/').pop()
      if (oldPath) {
        await supabase.storage
          .from('profile-photos')
          .remove([`${user.id}/${oldPath}`])
      }

      // Update database
      const { error } = await supabase
        .from('profiles')
        .update({ photo_url: null })
        .eq('id', user.id)

      if (error) throw error

      setPhotoUrl('')
      alert('Photo removed successfully!')
    } catch (error) {
      console.error('Error removing photo:', error)
      alert('Failed to remove photo. Please try again.')
    } finally {
      setUploading(false)
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
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              className="h-9 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
              asChild
            >
              <Link to="/dashboard">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Link>
            </Button>
            <img
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="The Way of Kaizen"
              className="h-8 w-auto"
            />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-4xl font-semibold tracking-tight text-foreground mb-2">
            Profile Settings
          </h1>
          <p className="text-base text-muted-foreground mb-10">
            Customize your profile and share your progress
          </p>

          <div className="space-y-6">
            {/* Profile Photo */}
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardHeader>
                <CardTitle>Profile Photo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center gap-4">
                  {/* Photo Preview */}
                  <div className="relative">
                    <div className="h-32 w-32 rounded-full overflow-hidden border-2 border-border bg-secondary/50 flex items-center justify-center">
                      {photoUrl ? (
                        <img
                          src={photoUrl}
                          alt="Profile"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-16 w-16 text-muted-foreground" />
                      )}
                    </div>
                    {photoUrl && (
                      <button
                        onClick={handleRemovePhoto}
                        disabled={uploading}
                        className="absolute -top-2 -right-2 h-8 w-8 rounded-full bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Upload Button */}
                  <div className="flex gap-2">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <Button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      variant="outline"
                      className="h-10 rounded-xl border-border/50 hover:bg-secondary/50 transition-all"
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      {uploading ? 'Uploading...' : photoUrl ? 'Change Photo' : 'Upload Photo'}
                    </Button>
                  </div>

                  <p className="text-xs text-muted-foreground text-center">
                    JPG, PNG or WebP. Max size 5MB.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Profile Information */}
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    placeholder="Your name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="h-12 rounded-xl border-border/50 bg-secondary/50 px-4 text-base"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    placeholder="Tell others about your journey..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="min-h-24 rounded-xl border-border/50 bg-secondary/50 px-4 py-3 text-base resize-none"
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground text-right">
                    {bio.length}/500
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Public Profile */}
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardHeader>
                <CardTitle>Public Profile</CardTitle>
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
              </CardContent>
            </Card>

            {/* Save Button */}
            <Button
              onClick={handleSave}
              disabled={saving}
              className="w-full h-12 rounded-xl bg-primary text-base font-medium text-primary-foreground hover:bg-primary/90 active:scale-[0.98] transition-all shadow-apple-sm"
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </motion.div>
      </main>
    </div>
  )
}
