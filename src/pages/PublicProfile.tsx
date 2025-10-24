// @ts-nocheck
import { useState, useEffect } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useFollowers } from '@/hooks/useFollowers'
import { usePublicGroups } from '@/hooks/usePublicGroups'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion } from 'framer-motion'
import { User, Moon, Sun, ChevronLeft, ChevronRight, Heart, MessageCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { format, startOfMonth, endOfMonth, eachDayOfInterval, formatDistanceToNow } from 'date-fns'
import NotificationsDropdown from '@/components/social/NotificationsDropdown'
import AvatarDropdown from '@/components/layout/AvatarDropdown'
import GlobalSearch from '@/components/layout/GlobalSearch'
import BadgesDisplay from '@/components/challenges/BadgesDisplay'

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

export default function PublicProfile() {
  const { userId } = useParams()
  const { theme, toggleTheme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { followUser, unfollowUser, checkIsFollowing } = useFollowers()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [habits, setHabits] = useState<Habit[]>([])
  const [completions, setCompletions] = useState<Completion[]>([])
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentDate] = useState(new Date())
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [showFollowingModal, setShowFollowingModal] = useState(false)
  const [followersList, setFollowersList] = useState<FollowerProfile[]>([])
  const [followingList, setFollowingList] = useState<FollowerProfile[]>([])
  const [isFollowing, setIsFollowing] = useState(false)
  const [followLoading, setFollowLoading] = useState(false)
  const [recentPosts, setRecentPosts] = useState<Post[]>([])
  const [postsLoading, setPostsLoading] = useState(true)
  const [currentPostIndex, setCurrentPostIndex] = useState(0)
  const [userGroups, setUserGroups] = useState<any[]>([])

  useEffect(() => {
    loadPublicProfile()
    loadRecentPosts()
  }, [userId])

  const loadPublicProfile = async () => {
    if (!userId) return

    try {
      // Load profile
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('display_name, photo_url, bio, is_public')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('Profile error:', profileError)
        setLoading(false)
        return
      }

      if (!profileData?.is_public) {
        setProfile(null)
        setLoading(false)
        return
      }

      setProfile(profileData as Profile)

      // Load habits
      const { data: habitsData, error: habitsError } = await supabase
        .from('habits')
        .select('id, name, color, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: true })

      if (habitsError) throw habitsError
      setHabits((habitsData || []) as Habit[])

      // Load this month's completions
      const monthStart = startOfMonth(currentDate)
      const monthEnd = endOfMonth(currentDate)

      const { data: completionsData, error: completionsError } = await supabase
        .from('habit_completions')
        .select('completed_date, habit_id')
        .eq('user_id', userId)
        .gte('completed_date', format(monthStart, 'yyyy-MM-dd'))
        .lte('completed_date', format(monthEnd, 'yyyy-MM-dd'))

      if (completionsError) throw completionsError
      setCompletions(completionsData || [])

      // Load followers count
      const { count: followersCount, error: followersCountError } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId)
        .eq('status', 'accepted')

      if (!followersCountError) {
        setFollowersCount(followersCount || 0)
      }

      // Load following count
      const { count: followingCount, error: followingCountError } = await supabase
        .from('followers')
        .select('*', { count: 'exact', head: true })
        .eq('follower_id', userId)
        .eq('status', 'accepted')

      if (!followingCountError) {
        setFollowingCount(followingCount || 0)
      }

      // Check if current user is following this profile
      if (user && userId !== user.id) {
        const following = await checkIsFollowing(userId)
        setIsFollowing(following)
      }

      // Load user's public groups
      const { data: memberships } = await supabase
        .from('user_group_memberships')
        .select('group_id')
        .eq('user_id', userId)

      if (memberships && memberships.length > 0) {
        const groupIds = memberships.map(m => m.group_id)
        const { data: groupsData } = await supabase
          .from('public_groups')
          .select('id, name, avatar_url, is_private')
          .in('id', groupIds)
          .eq('is_private', false) // Only show public groups on public profile

        setUserGroups(groupsData || [])
      }
    } catch (error) {
      console.error('Error loading public profile:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadRecentPosts = async () => {
    if (!userId) return

    try {
      setPostsLoading(true)

      const { data: postsData, error } = await supabase
        .from('posts')
        .select('id, content, created_at, image_url')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      // Get reaction and comment counts for each post
      const postsWithCounts = await Promise.all(
        (postsData || []).map(async (post) => {
          const [reactionsResult, commentsResult] = await Promise.all([
            supabase.from('post_reactions').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
            supabase.from('post_comments').select('id', { count: 'exact', head: true }).eq('post_id', post.id),
          ])

          return {
            ...post,
            reactions_count: reactionsResult.count || 0,
            comments_count: commentsResult.count || 0,
          }
        })
      )

      setRecentPosts(postsWithCounts)
    } catch (error) {
      console.error('Error loading recent posts:', error)
    } finally {
      setPostsLoading(false)
    }
  }

  const handleFollowToggle = async () => {
    if (!userId || !user) return

    setFollowLoading(true)
    try {
      if (isFollowing) {
        await unfollowUser(userId)
        setIsFollowing(false)
        setFollowersCount(prev => prev - 1)
      } else {
        await followUser(userId)
        setIsFollowing(true)
        setFollowersCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error toggling follow:', error)
    } finally {
      setFollowLoading(false)
    }
  }

  const loadFollowersList = async () => {
    if (!userId) return

    const { data: followersData } = await supabase
      .from('followers')
      .select('follower_id')
      .eq('following_id', userId)
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
    if (!userId) return

    const { data: followingData } = await supabase
      .from('followers')
      .select('following_id')
      .eq('follower_id', userId)
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

  if (loading) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center">
        <div className="text-lg font-medium text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-secondary flex items-center justify-center p-6">
        <Card className="max-w-md w-full border-border/40 shadow-apple-lg rounded-2xl">
          <CardContent className="p-12 text-center">
            <h2 className="text-2xl font-semibold text-foreground mb-3">
              Profile Not Found
            </h2>
            <p className="text-muted-foreground">
              This profile is either private or doesn't exist.
            </p>
          </CardContent>
        </Card>
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
    <div className="min-h-screen bg-secondary pb-20 md:pb-0">
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
            {user ? (
              <>
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
              </>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={toggleTheme}
                  className="h-9 w-9 p-0 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all"
                >
                  {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                </Button>
                <Link to="/login">
                  <Button variant="ghost" size="sm" className="h-9 px-4 text-sm font-medium">
                    Login
                  </Button>
                </Link>
                <Link to="/signup">
                  <Button size="sm" className="h-9 px-4 text-sm font-medium">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
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
              <div className="flex flex-col md:flex-row md:items-center md:justify-start gap-6">
                {/* Top section: Avatar and Name (always together) */}
                <div className="flex items-center gap-6 md:gap-8">
                  {/* Profile Photo with Fallback */}
                  <div className="h-20 w-20 rounded-full overflow-hidden border-2 border-border shrink-0 bg-secondary/50 flex items-center justify-center">
                    {profile.photo_url ? (
                      <img
                        src={profile.photo_url}
                        alt={profile.display_name || 'User'}
                        className="h-full w-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                          e.currentTarget.parentElement?.classList.add('show-fallback')
                        }}
                      />
                    ) : (
                      <User className="h-10 w-10 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 md:flex-initial">
                    <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-foreground mb-2">
                      {profile.display_name || 'Anonymous'}
                    </h1>
                    {profile.bio && (
                      <p className="text-base text-muted-foreground hidden md:block">{profile.bio}</p>
                    )}
                  </div>
                </div>

                {/* Bio on mobile (below avatar and name) */}
                {profile.bio && (
                  <p className="text-base text-muted-foreground md:hidden -mt-3">
                    {profile.bio}
                  </p>
                )}

                {/* Followers/Following section - stacks below on mobile */}
                <div className="flex items-center gap-8 md:gap-10 text-sm md:ml-auto">
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

                {/* Follow/Unfollow Button - full width on mobile */}
                {user && userId !== user.id && (
                  <Button
                    onClick={handleFollowToggle}
                    disabled={followLoading}
                    variant={isFollowing ? 'outline' : 'default'}
                    className="w-full md:w-auto md:shrink-0"
                  >
                    {followLoading ? 'Loading...' : isFollowing ? 'Unfollow' : 'Follow'}
                  </Button>
                )}
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

          {/* Current Habits */}
          {habits.length > 0 && (
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardContent className="p-8">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground mb-6">
                  Current Habits
                </h2>
                <div className="grid gap-3 md:grid-cols-2">
                  {habits.map((habit) => (
                    <div
                      key={habit.id}
                      className="flex items-center gap-3 p-4 rounded-xl border border-border/40 bg-secondary/50"
                    >
                      <div
                        className="h-3 w-3 rounded-full shrink-0"
                        style={{ backgroundColor: habit.color }}
                      />
                      <span className="font-medium text-foreground">{habit.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

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

          {/* Recent Posts */}
          {!postsLoading && recentPosts.length > 0 && (
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardContent className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-semibold tracking-tight text-foreground">
                    Recent Activity
                  </h2>
                  {recentPosts.length > 1 && (
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setCurrentPostIndex(prev => Math.max(0, prev - 1))}
                        disabled={currentPostIndex === 0}
                        className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <span className="text-sm text-muted-foreground min-w-[60px] text-center">
                        {currentPostIndex + 1} / {recentPosts.length}
                      </span>
                      <button
                        onClick={() => setCurrentPostIndex(prev => Math.min(recentPosts.length - 1, prev + 1))}
                        disabled={currentPostIndex === recentPosts.length - 1}
                        className="p-2 rounded-lg hover:bg-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="bg-secondary/50 rounded-2xl p-6">
                    <p className="text-foreground whitespace-pre-wrap mb-4">
                      {recentPosts[currentPostIndex].content}
                    </p>
                    {recentPosts[currentPostIndex].image_url && (
                      <img
                        src={recentPosts[currentPostIndex].image_url}
                        alt="Post"
                        className="rounded-xl w-full max-h-96 object-cover mb-4"
                      />
                    )}
                    <div className="flex items-center gap-6 text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        <span>{recentPosts[currentPostIndex].reactions_count || 0} reactions</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <MessageCircle className="h-4 w-4" />
                        <span>{recentPosts[currentPostIndex].comments_count || 0} comments</span>
                      </div>
                      <span className="ml-auto">
                        {formatDistanceToNow(new Date(recentPosts[currentPostIndex].created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Badges */}
          <BadgesDisplay userId={userId} />

          {/* Public Groups */}
          {userGroups.length > 0 && (
            <Card className="border-border/40 shadow-apple-lg rounded-2xl">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Groups</h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {userGroups.slice(0, 6).map((group) => (
                    <div key={group.id} className="flex">
                      <Card
                        onClick={() => navigate(`/groups/${group.id}`)}
                        className="overflow-hidden cursor-pointer hover:shadow-md transition-shadow flex flex-col w-full"
                      >
                        {/* Cover Photo */}
                        <div className="relative h-20 bg-gradient-to-br from-primary/20 via-primary/10 to-background overflow-hidden">
                          {group.avatar_url ? (
                            <img
                              src={group.avatar_url}
                              alt={group.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                              <div className="text-3xl font-bold text-primary/10">
                                {group.name.substring(0, 2).toUpperCase()}
                              </div>
                            </div>
                          )}
                        </div>
                        {/* Group Name */}
                        <div className="p-3 flex-1">
                          <p className="text-sm font-medium truncate">{group.name}</p>
                        </div>
                      </Card>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
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
    </div>
  )
}
