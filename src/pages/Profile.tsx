import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useFollowers } from '@/hooks/useFollowers'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { User, Edit2, X, Check, Upload, Search, UserPlus, UserMinus, Moon, Sun, ChevronLeft, ChevronRight, Users } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, formatDistanceToNow } from 'date-fns'
import BadgesDisplay from '@/components/challenges/BadgesDisplay'
import NotificationsDropdown from '@/components/social/NotificationsDropdown'
import AvatarDropdown from '@/components/layout/AvatarDropdown'
import GlobalSearch from '@/components/layout/GlobalSearch'
import ManageGroupsModal from '@/components/groups/ManageGroupsModal'

interface Profile {
  display_name: string | null
  photo_url: string | null
  bio: string | null
  is_public: boolean
}

interface Habit {
  id: string
  name: string
  color: string
  category: string
  created_at: string
}

interface Completion {
  completed_date: string
  habit_id: string
}

interface Post {
  id: string
  content: string
  created_at: string
  image_url?: string
  reactions_count?: number
  comments_count?: number
}

interface FollowerProfile {
  id: string
  display_name: string | null
  photo_url: string | null
}

interface UserProfile {
  id: string
  display_name: string | null
  photo_url: string | null
  bio: string | null
}

export default function Profile() {
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { followUser, unfollowUser, checkIsFollowing } = useFollowers()

  const [profile, setProfile] = useState<Profile | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentDate] = useState(new Date())
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [currentPostIndex, setCurrentPostIndex] = useState(0)

  // Edit mode states
  const [isEditing, setIsEditing] = useState(false)
  const [editFirstName, setEditFirstName] = useState('')
  const [editLastName, setEditLastName] = useState('')
  const [editBio, setEditBio] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)

  // Modals
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [showManageGroupsModal, setShowManageGroupsModal] = useState(false)
  const [followersList, setFollowersList] = useState<FollowerProfile[]>([])
  const [followingList, setFollowingList] = useState<FollowerProfile[]>([])

  // Search states
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})

  // Habits filter
  const [selectedHabitCategory, setSelectedHabitCategory] = useState<string>('all')

  useEffect(() => {
    loadProfile()
    loadRecentPosts()
  }, [user])

  const loadRecentPosts = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .from('posts')
        .select('id, user_id, content, created_at, image_url, privacy')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)

      if (error) throw error

      // Fetch reactions and comments count for each post
      const postsWithCounts = await Promise.all(
        (data || []).map(async (post) => {
          const [reactionsData, commentsData] = await Promise.all([
            supabase
              .from('post_reactions')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id),
            supabase
              .from('post_comments')
              .select('id', { count: 'exact', head: true })
              .eq('post_id', post.id)
          ])

          return {
            ...post,
            created_at: post.created_at || new Date().toISOString(),
            image_url: post.image_url || undefined,
            reactions_count: reactionsData.count || 0,
            comments_count: commentsData.count || 0
          }
        })
      )

      setRecentPosts(postsWithCounts)
    } catch (error) {
      console.error('Error loading posts:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  const loadProfile = async () => {
    if (!user) return

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, photo_url, bio, is_public')
        .eq('id', user.id)
        .maybeSingle()

      if (profileError) throw profileError
      if (!profileData) throw new Error('Profile not found')

      setProfile(profileData as Profile)

      // Split display_name into first and last name
      const nameParts = (profileData.display_name || '').split(' ')
      setEditFirstName(nameParts[0] || '')
      setEditLastName(nameParts.slice(1).join(' ') || '')
      setEditBio(profileData.bio || '')

      // Load habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('id, name, color, category, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true })

      if (habitsError) throw habitsError
      setHabits((habitsData || []) as Habit[])

      // Load this month's completions
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('completed_date, habit_id')
        .eq('user_id', user.id)
        .gte('completed_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('completed_date', format(monthEnd, 'yyyy-MM-dd'))

      if (completionsError) throw completionsError
      setCompletions(completionsData || [])

      // Load followers count
      const { count: followersCount, error: followersCountError } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', user.id)
        .eq('status', 'accepted')

      console.log('[Profile] Followers count for userId', user.id, ':', followersCount, 'Error:', followersCountError)

      setFollowersCount(followersCount || 0)

      // Load following count
      const { count: followingCount } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', user.id)
        .eq('status', 'accepted')

      setFollowingCount(followingCount || 0)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfile = async () => {
    if (!user) return

    // Validate first and last name are not empty
    if (!editFirstName.trim() || !editLastName.trim()) {
      alert('First Name and Last Name are required')
      return
    }

    // Combine first and last name
    const displayName = `${editFirstName.trim()} ${editLastName.trim()}`.trim()

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          display_name: displayName,
          bio: editBio,
        })
        .eq('id', user.id)

      if (error) throw error

      setProfile(prev => prev ? { ...prev, display_name: displayName, bio: editBio } : null)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving profile:', error)
      alert('Failed to save profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be smaller than 5MB')
      return
    }

    setUploading(true)
    try {
      // Delete old photo if exists
      if (profile?.photo_url) {
        const oldPath = profile.photo_url.split('/').pop()
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

      const { data: urlData } = supabase.storage
        .from('profile-photos')
        .getPublicUrl(filePath)

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ photo_url: urlData.publicUrl })
        .eq('id', user.id)

      if (updateError) throw updateError

      setProfile(prev => prev ? { ...prev, photo_url: urlData.publicUrl } : null)
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

  const loadFollowersList = async () => {
    if (!user) return

    const { data: followersData } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('following_id', user.id)
      .eq('status', 'accepted')

    if (followersData) {
      const profiles = await Promise.all(
        followersData.map(async (f) => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, photo_url')
            .eq('id', f.follower_id)
            .maybeSingle()
          if (error) console.error('Error loading profile:', error)
          return data
        })
      )
      setFollowersList(profiles.filter((p) => p !== null) as FollowerProfile[])
    }
    setShowFollowersModal(true)
  }

  const loadFollowingList = async () => {
    if (!user) return

    const { data: followingData } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', user.id)
      .eq('status', 'accepted')

    if (followingData) {
      const profiles = await Promise.all(
        followingData.map(async (f) => {
          const { data, error } = await supabase
            .from('profiles')
            .select('id, display_name, photo_url')
            .eq('id', f.following_id)
            .maybeSingle()
          if (error) console.error('Error loading profile:', error)
          return data
        })
      )
      setFollowingList(profiles.filter((p) => p !== null) as FollowerProfile[])
    }
    setShowFollowingModal(true)
  }

  const handleSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, photo_url, bio')
        .eq('is_public', true)
        .neq('id', user!.id)
        .or(`display_name.ilike.%${query}%,email.ilike.%${query}%`)
        .limit(20)

      if (error) throw error

      setSearchResults(data || [])

      const followingChecks = await Promise.all(
        (data || []).map(async (profile) => {
          const isFollowing = await checkIsFollowing(profile.id)
          return [profile.id, isFollowing] as [string, boolean]
        })
      )

      const followingMap = Object.fromEntries(followingChecks)
      setFollowingStates(followingMap)
    } catch (error) {
      console.error('Error searching users:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleFollow = async (userId: string) => {
    try {
      await followUser(userId)
      setFollowingStates((prev) => ({ ...prev, [userId]: true }))
      setFollowingCount(prev => prev + 1)
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser(userId)
      setFollowingStates((prev) => ({ ...prev, [userId]: false }))
      setFollowingCount(prev => prev - 1)
    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-lg font-medium text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-lg font-medium text-muted-foreground">Profile not found</div>
      </div>
    )
  }

  const monthStart = startOfMonth(currentDate)
  const monthEnd = endOfMonth(currentDate)
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd })

  const completionsByDate = new Map<string, number>()
  completions.forEach((completion) => {
    const date = completion.completed_date
    completionsByDate.set(date, (completionsByDate.get(date) || 0) + 1)
  })

  const totalHabits = habits.length
  const totalCompletions = completions.length

  return (
    <div className="min-h-screen bg-secondary pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
          <Link to="/dashboard">
            <img
              src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
              alt="The Way of Kaizen"
              className="h-7 sm:h-8 w-auto cursor-pointer"
            />
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <nav className="hidden md:flex items-center gap-1">
              <Link to="/dashboard">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Dashboard
                </Button>
              </Link>
              <Link to="/progress">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Progress
                </Button>
              </Link>
              <Link to="/challenges">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Challenges
                </Button>
              </Link>
              <Link to="/feed">
                <Button variant="ghost" size="sm" className="h-9 px-3 text-sm font-medium">
                  Feed
                </Button>
              </Link>
            </nav>
            <GlobalSearch />
            <NotificationsDropdown />
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <AvatarDropdown />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="space-y-8"
        >
          {/* Profile Header */}
          <Card className="border-border/40 shadow-apple-lg rounded-2xl">
            <CardContent className="p-8">
              <div className="flex flex-col md:flex-row items-start md:justify-between gap-6 md:gap-8">
                {/* Profile Photo */}
                <div className="flex items-center gap-6 w-full md:w-auto">
                  <div className="relative">
                    <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-border shrink-0 bg-secondary/50 flex items-center justify-center">
                      {profile.photo_url ? (
                        <img
                          src={profile.photo_url}
                          alt={profile.display_name || 'User'}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <User className="h-12 w-12 text-muted-foreground" />
                      )}
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full bg-primary text-primary-foreground hover:bg-primary/90 flex items-center justify-center shadow-lg transition-all disabled:opacity-50"
                    >
                      {uploading ? '...' : <Upload className="h-4 w-4" />}
                    </button>
                  </div>

                  {/* Name and Bio */}
                  <div className="flex-1">
                    {isEditing ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              First Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                              value={editFirstName}
                              onChange={(e) => setEditFirstName(e.target.value)}
                              placeholder="First Name"
                              className="h-10"
                              required
                            />
                          </div>
                          <div>
                            <label className="text-xs font-medium text-muted-foreground mb-1 block">
                              Last Name <span className="text-destructive">*</span>
                            </label>
                            <Input
                              value={editLastName}
                              onChange={(e) => setEditLastName(e.target.value)}
                              placeholder="Last Name"
                              className="h-10"
                              required
                            />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1 block">
                            Bio
                          </label>
                          <Textarea
                            value={editBio}
                            onChange={(e) => setEditBio(e.target.value)}
                            placeholder="Tell us about yourself..."
                            className="min-h-20 resize-none"
                            maxLength={500}
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={handleSaveProfile}
                            disabled={saving}
                            size="sm"
                            className="h-8"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            {saving ? 'Saving...' : 'Save'}
                          </Button>
                          <Button
                            onClick={() => {
                              setIsEditing(false)
                              const nameParts = (profile.display_name || '').split(' ')
                              setEditFirstName(nameParts[0] || '')
                              setEditLastName(nameParts.slice(1).join(' ') || '')
                              setEditBio(profile.bio || '')
                            }}
                            size="sm"
                            variant="outline"
                            className="h-8"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 mb-2">
                          <h1 className="text-3xl font-semibold tracking-tight text-foreground">
                            {profile.display_name || 'Anonymous'}
                          </h1>
                          <button
                            onClick={() => setIsEditing(true)}
                            className="p-1.5 rounded-lg hover:bg-secondary transition-colors"
                          >
                            <Edit2 className="h-4 w-4 text-muted-foreground" />
                          </button>
                        </div>
                        {profile.bio && (
                          <p className="text-base text-muted-foreground">{profile.bio}</p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Stats and Actions */}
                <div className="flex flex-col items-start md:items-end gap-4 w-full md:w-auto">
                  <div className="flex items-center gap-8 text-sm w-full md:w-auto justify-start md:justify-end">
                    <button
                      onClick={loadFollowersList}
                      className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="font-bold text-2xl text-foreground">{followersCount}</span>
                      <span>followers</span>
                    </button>
                    <button
                      onClick={loadFollowingList}
                      className="flex flex-col items-center text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <span className="font-bold text-2xl text-foreground">{followingCount}</span>
                      <span>following</span>
                    </button>
                  </div>
                  <Button
                    onClick={() => setShowManageGroupsModal(true)}
                    variant="outline"
                    className="rounded-xl w-full md:w-auto"
                  >
                    <Users className="h-4 w-4 mr-2" />
                    Manage Groups
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stats */}
          <div className="grid gap-5 md:grid-cols-3">
            <Card className="border-border/40 shadow-apple rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Total Habits
                </div>
                <div className="text-3xl font-bold text-foreground">{totalHabits}</div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-apple rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  This Month
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {totalCompletions}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/40 shadow-apple rounded-2xl">
              <CardContent className="p-6">
                <div className="text-sm font-medium text-muted-foreground mb-1">
                  Active Days
                </div>
                <div className="text-3xl font-bold text-foreground">
                  {completionsByDate.size}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity Posts */}
          {!postsLoading && recentPosts.length > 0 && (
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Recent Activity
                  </h2>
                  {recentPosts.length > 1 && (
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPostIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentPostIndex === 0}
                        className="h-8 w-8 p-0 rounded-full"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <span className="text-sm text-muted-foreground">
                        {currentPostIndex + 1} / {recentPosts.length}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setCurrentPostIndex(prev => Math.min(recentPosts.length - 1, prev + 1))}
                        disabled={currentPostIndex === recentPosts.length - 1}
                        className="h-8 w-8 p-0 rounded-full"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentPostIndex}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    <div className="rounded-xl border border-border/40 bg-secondary/30 p-6">
                      <p className="text-foreground whitespace-pre-wrap mb-4">
                        {recentPosts[currentPostIndex].content}
                      </p>
                      {recentPosts[currentPostIndex].image_url && (
                        <img
                          src={recentPosts[currentPostIndex].image_url}
                          alt="Post"
                          className="rounded-lg w-full max-h-96 object-cover mb-4"
                        />
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>{recentPosts[currentPostIndex].reactions_count || 0} reactions</span>
                          <span>{recentPosts[currentPostIndex].comments_count || 0} comments</span>
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(recentPosts[currentPostIndex].created_at), { addSuffix: true })}
                        </span>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => navigate('/feed')}
                      className="w-full"
                    >
                      View in Feed
                    </Button>
                  </motion.div>
                </AnimatePresence>
              </CardContent>
            </Card>
          )}

          {/* Current Habits */}
          {habits.length > 0 && (
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Current Habits
                  </h2>
                  <select
                    value={selectedHabitCategory}
                    onChange={(e) => setSelectedHabitCategory(e.target.value)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-secondary border border-border/40 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="all">All Categories</option>
                    <option value="Health">Health</option>
                    <option value="Hustle">Hustle</option>
                    <option value="Heart">Heart</option>
                    <option value="Harmony">Harmony</option>
                    <option value="Happiness">Happiness</option>
                  </select>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  {habits
                    .filter((habit) => selectedHabitCategory === 'all' || habit.category === selectedHabitCategory)
                    .map((habit) => (
                      <div
                        key={habit.id}
                        className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-secondary/50"
                      >
                        <div
                          className="h-3 w-3 rounded-full shrink-0"
                          style={{ backgroundColor: habit.color }}
                        />
                        <div className="flex-1 min-w-0">
                          <span className="font-medium text-foreground">{habit.name}</span>
                          <span className="ml-2 text-xs text-muted-foreground">({habit.category})</span>
                        </div>
                      </div>
                    ))}
                </div>
                {habits.filter((habit) => selectedHabitCategory === 'all' || habit.category === selectedHabitCategory).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No habits in this category
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Challenge Badges */}
          <BadgesDisplay />

          {/* Activity Calendar */}
          <Card className="border-border/40 shadow-apple-lg rounded-2xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">
                {format(currentDate, 'MMMM yyyy')} Activity
              </h2>
              <div className="grid grid-cols-7 gap-2">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                  <div
                    key={day}
                    className="p-2 text-center text-xs font-semibold text-muted-foreground"
                  >
                    {day}
                  </div>
                ))}
                {Array.from({ length: monthStart.getDay() }).map((_, i) => (
                  <div key={`empty-${i}`} className="p-2" />
                ))}
                {daysInMonth.map((day) => {
                  const dateStr = format(day, 'yyyy-MM-dd')
                  const completionsCount = completionsByDate.get(dateStr) || 0
                  const intensity = totalHabits > 0 ? (completionsCount / totalHabits) * 100 : 0

                  return (
                    <div
                      key={dateStr}
                      className="relative aspect-square rounded-xl p-2 text-center transition-all"
                      style={{
                        backgroundColor:
                          intensity > 0
                            ? `hsl(356 100% 64% / ${intensity / 100})`
                            : 'hsl(var(--secondary))',
                      }}
                    >
                      <div
                        className={`text-sm font-medium ${
                          intensity > 50 ? 'text-white' : 'text-foreground'
                        }`}
                      >
                        {day.getDate()}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </main>


      {/* Followers Modal */}
      <Dialog open={showFollowersModal} onOpenChange={setShowFollowersModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Followers ({followersList.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {followersList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No followers yet
              </div>
            ) : (
              followersList.map((follower) => (
                <div
                  key={follower.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-all"
                  onClick={() => {
                    setShowFollowersModal(false)
                    navigate(`/profile/${follower.id}`)
                  }}
                >
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-border bg-secondary/50 flex items-center justify-center flex-shrink-0">
                    {follower.photo_url ? (
                      <img
                        src={follower.photo_url}
                        alt={follower.display_name || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {follower.display_name || 'Anonymous User'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={showFollowingModal} onOpenChange={setShowFollowingModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Following ({followingList.length})</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-[400px] overflow-y-auto">
            {followingList.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Not following anyone
              </div>
            ) : (
              followingList.map((following) => (
                <div
                  key={following.id}
                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-secondary cursor-pointer transition-all"
                  onClick={() => {
                    setShowFollowingModal(false)
                    navigate(`/profile/${following.id}`)
                  }}
                >
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-border bg-secondary/50 flex items-center justify-center flex-shrink-0">
                    {following.photo_url ? (
                      <img
                        src={following.photo_url}
                        alt={following.display_name || 'User'}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <User className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-foreground">
                      {following.display_name || 'Anonymous User'}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Search Modal */}
      <Dialog open={showSearchModal} onOpenChange={setShowSearchModal}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>Find Friends</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="h-12 pl-12 rounded-xl"
              />
            </div>

            {searching && (
              <div className="text-center py-8 text-muted-foreground">
                Searching...
              </div>
            )}

            {!searching && searchQuery && searchResults.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No users found matching "{searchQuery}"
              </div>
            )}

            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {searchResults.map((profile) => (
                <Card
                  key={profile.id}
                  className="p-4 border-border/40 shadow-apple rounded-xl"
                >
                  <div className="flex items-center justify-between">
                    <div
                      className="flex items-center gap-4 flex-1 cursor-pointer"
                      onClick={() => {
                        setShowSearchModal(false)
                        navigate(`/profile/${profile.id}`)
                      }}
                    >
                      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border bg-secondary/50 flex items-center justify-center flex-shrink-0">
                        {profile.photo_url ? (
                          <img
                            src={profile.photo_url}
                            alt={profile.display_name || 'User'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <User className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {profile.display_name || 'Anonymous User'}
                        </h3>
                        {profile.bio && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {profile.bio}
                          </p>
                        )}
                      </div>
                    </div>
                    {followingStates[profile.id] ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnfollow(profile.id)}
                        className="h-9 rounded-lg"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => handleFollow(profile.id)}
                        className="h-9 rounded-lg"
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Follow
                      </Button>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Manage Groups Modal */}
      <ManageGroupsModal
        open={showManageGroupsModal}
        onOpenChange={setShowManageGroupsModal}
      />
    </div>
  )
}
