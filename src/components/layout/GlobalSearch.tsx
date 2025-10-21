import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, User, Trophy, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface UserResult {
  id: string
  display_name: string | null
  photo_url: string | null
  bio: string | null
}

interface ChallengeResult {
  id: string
  name: string
  description: string | null
  creator_id: string
  creator?: {
    display_name: string | null
  }
}

export default function GlobalSearch() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [isOpen, setIsOpen] = useState(false)
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [users, setUsers] = useState<UserResult[]>([])
  const [challenges, setChallenges] = useState<ChallengeResult[]>([])
  const [searching, setSearching] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const mobileInputRef = useRef<HTMLInputElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Auto-focus mobile input when modal opens
  useEffect(() => {
    if (isMobileModalOpen) {
      setTimeout(() => mobileInputRef.current?.focus(), 100)
    } else {
      setSearchQuery('')
      setUsers([])
      setChallenges([])
    }
  }, [isMobileModalOpen])

  // Perform search
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (searchQuery.trim().length >= 2) {
        performSearch()
      } else {
        setUsers([])
        setChallenges([])
      }
    }, 300)

    return () => clearTimeout(delayDebounceFn)
  }, [searchQuery])

  const performSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      // Search users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id, display_name, photo_url, bio')
        .or(`display_name.ilike.%${searchQuery}%,bio.ilike.%${searchQuery}%`)
        .eq('is_public', true)
        .neq('id', user?.id || '')
        .limit(5)

      // Search challenges
      const { data: challengesData } = await supabase
        .from('challenges')
        .select('id, name, description, creator_id')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`)
        .limit(5)

      // Fetch creator names for challenges
      if (challengesData && challengesData.length > 0) {
        const challengesWithCreators = await Promise.all(
          challengesData.map(async (challenge) => {
            const { data: creator } = await supabase
              .from('profiles')
              .select('display_name')
              .eq('id', challenge.creator_id)
              .maybeSingle()

            return {
              ...challenge,
              creator
            }
          })
        )
        setChallenges(challengesWithCreators as ChallengeResult[])
      } else {
        setChallenges([])
      }

      setUsers(usersData || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  const handleUserClick = (userId: string) => {
    navigate(`/profile/${userId}`)
    setIsOpen(false)
    setIsMobileModalOpen(false)
    setSearchQuery('')
  }

  const handleChallengeClick = (challengeId: string) => {
    navigate(`/challenge/${challengeId}`)
    setIsOpen(false)
    setIsMobileModalOpen(false)
    setSearchQuery('')
  }

  const handleClear = () => {
    setSearchQuery('')
    setUsers([])
    setChallenges([])
    inputRef.current?.focus()
    mobileInputRef.current?.focus()
  }

  const hasResults = users.length > 0 || challenges.length > 0

  const renderResults = () => {
    if (searching) {
      return (
        <div className="p-8 text-center">
          <p className="text-sm text-muted-foreground">Searching...</p>
        </div>
      )
    }

    if (!hasResults && searchQuery.trim().length >= 2) {
      return (
        <div className="p-8 text-center">
          <Search className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-40" />
          <p className="text-sm text-muted-foreground">No results found</p>
        </div>
      )
    }

    return (
      <div>
        {/* Users Section */}
        {users.length > 0 && (
          <div className="p-3">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Users
            </div>
            <div className="space-y-1">
              {users.map((userResult) => (
                <button
                  key={userResult.id}
                  onClick={() => handleUserClick(userResult.id)}
                  className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <Avatar className="h-10 w-10 shrink-0">
                    <AvatarImage src={userResult.photo_url || undefined} />
                    <AvatarFallback>
                      {userResult.display_name?.[0]?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">
                      {userResult.display_name || 'Anonymous'}
                    </p>
                    {userResult.bio && (
                      <p className="text-xs text-muted-foreground truncate">
                        {userResult.bio}
                      </p>
                    )}
                  </div>
                  <User className="h-4 w-4 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Challenges Section */}
        {challenges.length > 0 && (
          <div className="p-3 border-t border-border/40">
            <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              Challenges
            </div>
            <div className="space-y-1">
              {challenges.map((challenge) => (
                <button
                  key={challenge.id}
                  onClick={() => handleChallengeClick(challenge.id)}
                  className="w-full flex items-start gap-3 p-3 rounded-lg hover:bg-secondary transition-colors text-left"
                >
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <Trophy className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="text-sm font-medium text-foreground">
                        {challenge.name}
                      </p>
                    </div>
                    {challenge.description && (
                      <p className="text-xs text-muted-foreground line-clamp-2">
                        {challenge.description}
                      </p>
                    )}
                    {challenge.creator?.display_name && (
                      <p className="text-xs text-muted-foreground mt-1">
                        by {challenge.creator.display_name}
                      </p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <>
      {/* Mobile Search Icon */}
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsMobileModalOpen(true)}
        className="md:hidden h-9 w-9 p-0 flex-shrink-0"
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Desktop Search */}
      <div className="hidden md:block relative" ref={searchRef}>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            ref={inputRef}
            type="text"
            placeholder="Search users, challenges..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            className="h-9 pl-9 pr-9 w-64 bg-secondary/50 border-border/40 focus:bg-background transition-colors"
          />
          {searchQuery && (
            <button
              onClick={handleClear}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <AnimatePresence>
          {isOpen && searchQuery.trim().length >= 2 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute top-12 left-0 w-96 z-50"
            >
              <Card className="border-border/40 shadow-apple-lg rounded-2xl overflow-hidden max-h-[500px] overflow-y-auto">
                {renderResults()}
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Mobile Search Modal */}
      <Dialog open={isMobileModalOpen} onOpenChange={setIsMobileModalOpen}>
        <DialogContent className="sm:max-w-md p-0 gap-0 h-[80vh] flex flex-col">
          <DialogHeader className="p-4 pb-3 border-b border-border/40 text-left">
            <DialogTitle className="text-left">Search</DialogTitle>
          </DialogHeader>
          <div className="p-4 pt-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                ref={mobileInputRef}
                type="text"
                placeholder="Search users, challenges..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 pl-9 pr-9 bg-secondary/50 border-border/40 focus:bg-background transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
          <div className="flex-1 overflow-y-auto">
            {searchQuery.trim().length >= 2 ? (
              renderResults()
            ) : (
              <div className="p-8 text-center">
                <Search className="mx-auto h-12 w-12 text-muted-foreground mb-3 opacity-40" />
                <p className="text-sm text-muted-foreground">
                  Type at least 2 characters to search
                </p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
