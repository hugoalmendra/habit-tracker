import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useTheme } from '@/contexts/ThemeContext'
import { useAuth } from '@/contexts/AuthContext'
import { useFollowers } from '@/hooks/useFollowers'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { ArrowLeft, Search, Users, UserPlus, UserMinus, User as UserIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'

interface UserProfile {
  id: string
  display_name: string | null
  photo_url: string | null
  bio: string | null
}

export default function Social() {
  const { theme } = useTheme()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { followers, following, followUser, unfollowUser, checkIsFollowing } = useFollowers()
  const [activeTab, setActiveTab] = useState<'find' | 'followers' | 'following'>('find')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<UserProfile[]>([])
  const [searching, setSearching] = useState(false)
  const [followingStates, setFollowingStates] = useState<Record<string, boolean>>({})

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

      // Check following status for each result
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
    } catch (error) {
      console.error('Error following user:', error)
    }
  }

  const handleUnfollow = async (userId: string) => {
    try {
      await unfollowUser(userId)
      setFollowingStates((prev) => ({ ...prev, [userId]: false }))
    } catch (error) {
      console.error('Error unfollowing user:', error)
    }
  }

  return (
    <div className="min-h-screen bg-secondary">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl shadow-apple-sm">
        <div className="container mx-auto flex items-center justify-between px-4 sm:px-6 py-4">
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
            <Link to="/dashboard">
              <img
                src={theme === 'light' ? '/logo-light.png' : '/logo-dark.png'}
                alt="The Way of Kaizen"
                className="h-7 sm:h-8 w-auto cursor-pointer"
              />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        >
          <h1 className="text-3xl sm:text-4xl font-semibold tracking-tight text-foreground mb-2">
            Social
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-8">
            Connect with friends and track progress together
          </p>

          {/* Tabs */}
          <div className="flex gap-2 mb-8 border-b border-border/40">
            <button
              onClick={() => setActiveTab('find')}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === 'find'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Search className="inline-block h-4 w-4 mr-2" />
              Find Friends
            </button>
            <button
              onClick={() => setActiveTab('followers')}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === 'followers'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="inline-block h-4 w-4 mr-2" />
              Followers ({followers?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('following')}
              className={`px-4 py-3 text-sm font-medium transition-all border-b-2 ${
                activeTab === 'following'
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <UserPlus className="inline-block h-4 w-4 mr-2" />
              Following ({following?.length || 0})
            </button>
          </div>

          {/* Find Friends Tab */}
          {activeTab === 'find' && (
            <div className="space-y-6">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search by name or email..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="h-12 pl-12 rounded-xl border-border/50 bg-background text-base"
                />
              </div>

              {searching && (
                <div className="text-center py-8 text-muted-foreground">
                  Searching...
                </div>
              )}

              {!searching && searchQuery && searchResults.length === 0 && (
                <Card className="p-12 text-center border-border/40 shadow-apple-lg rounded-2xl">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-base text-muted-foreground">
                    No users found matching "{searchQuery}"
                  </p>
                </Card>
              )}

              <div className="space-y-3">
                {searchResults.map((profile) => (
                  <Card
                    key={profile.id}
                    className="p-4 border-border/40 shadow-apple rounded-xl hover:shadow-apple-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => navigate(`/profile/${profile.id}`)}
                      >
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border bg-secondary/50 flex items-center justify-center flex-shrink-0">
                          {profile.photo_url ? (
                            <img
                              src={profile.photo_url}
                              alt={profile.display_name || 'User'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-6 w-6 text-muted-foreground" />
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
                          className="h-9 rounded-lg border-border/50"
                        >
                          <UserMinus className="h-4 w-4 mr-2" />
                          Unfollow
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          onClick={() => handleFollow(profile.id)}
                          className="h-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90"
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
          )}

          {/* Followers Tab */}
          {activeTab === 'followers' && (
            <div className="space-y-3">
              {!followers || followers.length === 0 ? (
                <Card className="p-12 text-center border-border/40 shadow-apple-lg rounded-2xl">
                  <Users className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">No followers yet</h3>
                  <p className="text-base text-muted-foreground">
                    Share your profile to gain followers
                  </p>
                </Card>
              ) : (
                followers.map((follower) => (
                  <Card
                    key={follower.id}
                    className="p-4 border-border/40 shadow-apple rounded-xl hover:shadow-apple-lg transition-all cursor-pointer"
                    onClick={() => navigate(`/profile/${follower.follower_id}`)}
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border bg-secondary/50 flex items-center justify-center flex-shrink-0">
                        {follower.follower?.photo_url ? (
                          <img
                            src={follower.follower.photo_url}
                            alt={follower.follower.display_name || 'User'}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <UserIcon className="h-6 w-6 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {follower.follower?.display_name || 'Anonymous User'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Following since {new Date(follower.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* Following Tab */}
          {activeTab === 'following' && (
            <div className="space-y-3">
              {!following || following.length === 0 ? (
                <Card className="p-12 text-center border-border/40 shadow-apple-lg rounded-2xl">
                  <UserPlus className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Not following anyone</h3>
                  <p className="text-base text-muted-foreground mb-6">
                    Find friends to follow and stay motivated together
                  </p>
                  <Button
                    onClick={() => setActiveTab('find')}
                    className="h-10 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    <Search className="h-4 w-4 mr-2" />
                    Find Friends
                  </Button>
                </Card>
              ) : (
                following.map((follow) => (
                  <Card
                    key={follow.id}
                    className="p-4 border-border/40 shadow-apple rounded-xl hover:shadow-apple-lg transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className="flex items-center gap-4 flex-1 cursor-pointer"
                        onClick={() => navigate(`/profile/${follow.following_id}`)}
                      >
                        <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-border bg-secondary/50 flex items-center justify-center flex-shrink-0">
                          {follow.following?.photo_url ? (
                            <img
                              src={follow.following.photo_url}
                              alt={follow.following.display_name || 'User'}
                              className="h-full w-full object-cover"
                            />
                          ) : (
                            <UserIcon className="h-6 w-6 text-muted-foreground" />
                          )}
                        </div>
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {follow.following?.display_name || 'Anonymous User'}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            Following since {new Date(follow.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleUnfollow(follow.following_id)}
                        className="h-9 rounded-lg border-border/50"
                      >
                        <UserMinus className="h-4 w-4 mr-2" />
                        Unfollow
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          )}
        </motion.div>
      </main>
    </div>
  )
}
