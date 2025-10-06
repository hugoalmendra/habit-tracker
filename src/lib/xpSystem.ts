// XP System with Samurai-themed ranks

export interface Rank {
  level: number
  name: string
  minXP: number
  maxXP: number
  color: string
}

export const RANKS: Rank[] = [
  { level: 1, name: 'Novice', minXP: 0, maxXP: 99, color: '#9CA3AF' }, // Gray
  { level: 2, name: 'Apprentice', minXP: 100, maxXP: 299, color: '#60A5FA' }, // Blue
  { level: 3, name: 'Warrior', minXP: 300, maxXP: 599, color: '#34D399' }, // Green
  { level: 4, name: 'Samurai', minXP: 600, maxXP: 999, color: '#A78BFA' }, // Purple
  { level: 5, name: 'Ronin', minXP: 1000, maxXP: 1499, color: '#F59E0B' }, // Amber
  { level: 6, name: 'Daimyo', minXP: 1500, maxXP: 2099, color: '#F97316' }, // Orange
  { level: 7, name: 'Shogun', minXP: 2100, maxXP: 2799, color: '#EF4444' }, // Red
  { level: 8, name: 'Master', minXP: 2800, maxXP: 3599, color: '#EC4899' }, // Pink
  { level: 9, name: 'Sensei', minXP: 3600, maxXP: 4499, color: '#DC2626' }, // Crimson
  { level: 10, name: 'Legend', minXP: 4500, maxXP: Infinity, color: '#FBBF24' }, // Gold
]

export function calculateXP(totalCompletions: number): number {
  // Each habit completion = 10 XP
  return totalCompletions * 10
}

export function getRankFromXP(xp: number): Rank {
  for (let i = RANKS.length - 1; i >= 0; i--) {
    if (xp >= RANKS[i].minXP) {
      return RANKS[i]
    }
  }
  return RANKS[0]
}

export function getProgressToNextRank(xp: number): {
  currentRank: Rank
  nextRank: Rank | null
  progressPercentage: number
  xpNeeded: number
  currentXP: number
} {
  const currentRank = getRankFromXP(xp)
  const nextRankIndex = RANKS.findIndex(r => r.level === currentRank.level) + 1
  const nextRank = nextRankIndex < RANKS.length ? RANKS[nextRankIndex] : null

  if (!nextRank) {
    // Max level reached
    return {
      currentRank,
      nextRank: null,
      progressPercentage: 100,
      xpNeeded: 0,
      currentXP: xp - currentRank.minXP,
    }
  }

  const xpInCurrentRank = xp - currentRank.minXP
  const xpNeededForNextRank = nextRank.minXP - currentRank.minXP
  const progressPercentage = (xpInCurrentRank / xpNeededForNextRank) * 100

  return {
    currentRank,
    nextRank,
    progressPercentage: Math.min(progressPercentage, 100),
    xpNeeded: nextRank.minXP - xp,
    currentXP: xpInCurrentRank,
  }
}
