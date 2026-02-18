import OpenAI from 'openai'

const openai = new OpenAI({
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  dangerouslyAllowBrowser: true, // Note: In production, move this to a backend
})

const SYSTEM_COLORS = [
  '#007AFF', // System Blue
  '#34C759', // System Green
  '#FF9500', // System Orange
  '#FF3B30', // System Red
  '#AF52DE', // System Purple
  '#FF2D55', // System Pink
  '#5AC8FA', // System Teal
  '#FFCC00', // System Yellow
]

interface GeneratedHabit {
  name: string
  description: string
  color: string
}

// Fallback habit templates for common goals
const HABIT_TEMPLATES: Record<string, Array<{ name: string; description: string }>> = {
  health: [
    { name: 'Morning Exercise', description: '30 minutes of cardio or strength training' },
    { name: 'Eat Vegetables', description: 'Include vegetables in at least 2 meals' },
    { name: 'Drink Water', description: 'Drink at least 8 glasses of water throughout the day' },
    { name: 'Sleep Schedule', description: 'Go to bed and wake up at consistent times' },
  ],
  productivity: [
    { name: 'Morning Planning', description: 'Plan your top 3 priorities for the day' },
    { name: 'Deep Work Block', description: '2 hours of focused work without distractions' },
    { name: 'Inbox Zero', description: 'Process all emails and messages by end of day' },
    { name: 'Learning Time', description: 'Dedicate 30 minutes to learning something new' },
  ],
  mindfulness: [
    { name: 'Morning Meditation', description: '10 minutes of quiet meditation or breathing' },
    { name: 'Gratitude Journal', description: 'Write 3 things you are grateful for' },
    { name: 'Evening Reflection', description: 'Review your day and note key learnings' },
    { name: 'Digital Detox', description: 'No screens 1 hour before bed' },
  ],
  relationships: [
    { name: 'Quality Time', description: 'Spend 30 minutes with loved ones without devices' },
    { name: 'Reach Out', description: 'Message or call a friend or family member' },
    { name: 'Active Listening', description: 'Practice being fully present in conversations' },
    { name: 'Acts of Kindness', description: 'Do something thoughtful for someone' },
  ],
  fitness: [
    { name: 'Daily Movement', description: 'At least 30 minutes of physical activity' },
    { name: 'Stretch Routine', description: '10 minutes of stretching morning and evening' },
    { name: 'Track Nutrition', description: 'Log meals and stay within calorie goals' },
    { name: 'Stay Hydrated', description: 'Drink water before, during, and after workouts' },
  ],
  learning: [
    { name: 'Read Daily', description: 'Read at least 20 pages of a book' },
    { name: 'Practice Skills', description: 'Dedicate 1 hour to deliberate practice' },
    { name: 'Take Notes', description: 'Summarize key learnings in your own words' },
    { name: 'Teach Others', description: 'Share what you learned with someone' },
  ],
}

function generateFallbackHabits(goal: string): Array<{ name: string; description: string }> {
  const goalLower = goal.toLowerCase()

  // Try to match keywords to templates
  for (const [key, habits] of Object.entries(HABIT_TEMPLATES)) {
    if (goalLower.includes(key)) {
      return habits.slice(0, 4)
    }
  }

  // Check for common keywords
  if (goalLower.match(/\b(fit|exercise|workout|gym|run|walk)\b/)) {
    return HABIT_TEMPLATES.fitness.slice(0, 4)
  }
  if (goalLower.match(/\b(work|career|focus|time|task|project)\b/)) {
    return HABIT_TEMPLATES.productivity.slice(0, 4)
  }
  if (goalLower.match(/\b(mind|mental|stress|calm|peace|anxiety)\b/)) {
    return HABIT_TEMPLATES.mindfulness.slice(0, 4)
  }
  if (goalLower.match(/\b(family|friend|social|relationship|connect)\b/)) {
    return HABIT_TEMPLATES.relationships.slice(0, 4)
  }
  if (goalLower.match(/\b(learn|study|skill|read|course|knowledge)\b/)) {
    return HABIT_TEMPLATES.learning.slice(0, 4)
  }

  // Default to health habits
  return HABIT_TEMPLATES.health.slice(0, 4)
}

export async function generateHabits(goal: string): Promise<GeneratedHabit[]> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const useAI = apiKey && apiKey !== 'your-openai-api-key-here'

  // If no API key or API fails, use fallback
  if (!useAI) {
    console.log('Using fallback habit generation (no OpenAI API key configured)')
    const habits = generateFallbackHabits(goal)
    return habits.map((habit) => ({
      ...habit,
      color: SYSTEM_COLORS[Math.floor(Math.random() * SYSTEM_COLORS.length)],
    }))
  }

  const prompt = `You are a habit coach helping someone improve their life through the philosophy of Kaizen (continuous improvement).

The user wants to improve: "${goal}"

Generate 3-5 specific, actionable daily habits that will help them achieve this goal. Each habit should be:
- Specific and measurable
- Achievable in a single day
- Directly related to their goal
- Focused on consistent small improvements

Return ONLY a valid JSON array of objects with this exact structure:
[
  {
    "name": "Brief habit name (max 50 chars)",
    "description": "Clear description of what to do (max 100 chars)"
  }
]

Example for "My health":
[
  {"name": "Morning Exercise", "description": "30 minutes of cardio or strength training"},
  {"name": "Eat Vegetables", "description": "Include vegetables in at least 2 meals"},
  {"name": "Drink Water", "description": "Drink at least 8 glasses of water throughout the day"}
]

Important: Return ONLY the JSON array, no other text or markdown.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a habit coaching expert. You respond only with valid JSON arrays.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const content = completion.choices[0]?.message?.content?.trim() || '[]'

    // Remove markdown code blocks if present
    const cleanedContent = content
      .replace(/```json\n?/g, '')
      .replace(/```\n?/g, '')
      .trim()

    const habits = JSON.parse(cleanedContent)

    // Add random colors to each habit
    return habits.map((habit: { name: string; description: string }) => ({
      ...habit,
      color: SYSTEM_COLORS[Math.floor(Math.random() * SYSTEM_COLORS.length)],
    }))
  } catch (error) {
    console.error('OpenAI API error, falling back to template habits:', error)
    // Fallback to template-based generation if API fails
    const habits = generateFallbackHabits(goal)
    return habits.map((habit) => ({
      ...habit,
      color: SYSTEM_COLORS[Math.floor(Math.random() * SYSTEM_COLORS.length)],
    }))
  }
}

// --- Life Report ---

type LifeAreaName = 'Health' | 'Career' | 'Spirit' | 'Mindset' | 'Joy'

const LIFE_AREAS: Record<LifeAreaName, { color: string; label: string }> = {
  Health: { color: '#34C759', label: 'Physical wellbeing' },
  Career: { color: '#FF9500', label: 'Work, finances, skills' },
  Spirit: { color: '#FF3B30', label: 'Spirituality, gratitude' },
  Mindset: { color: '#AF52DE', label: 'Mental wellness, growth' },
  Joy: { color: '#FFCC00', label: 'Relationships, fun, purpose' },
}

export interface CategoryScore {
  category: LifeAreaName
  color: string
  label: string
  completionRate: number
  totalHabits: number
  completedCount: number
  expectedCount: number
  hasHabits: boolean
}

export interface LifeReportAnalysis {
  summary: string
  strongAreas: string[]
  weakAreas: string[]
  recommendations: string[]
}

interface HabitForReport {
  id: string
  category: string
  frequency_type: string | null
  frequency_config: unknown
  start_date: string | null
}

interface CompletionForReport {
  habit_id: string
  completed_date: string
}

export function computeCategoryScores(
  habits: HabitForReport[],
  completions: CompletionForReport[],
  periodDays: number = 30
): CategoryScore[] {
  const periodStart = new Date()
  periodStart.setDate(periodStart.getDate() - periodDays)
  const periodStartStr = periodStart.toISOString().split('T')[0]

  // Group completions by habit_id for fast lookup
  const completionsByHabit = new Map<string, number>()
  for (const c of completions) {
    if (c.completed_date >= periodStartStr) {
      completionsByHabit.set(c.habit_id, (completionsByHabit.get(c.habit_id) || 0) + 1)
    }
  }

  const scores: CategoryScore[] = []

  for (const [area, meta] of Object.entries(LIFE_AREAS) as [LifeAreaName, { color: string; label: string }][]) {
    const areaHabits = habits.filter(h => h.category === area)

    if (areaHabits.length === 0) {
      scores.push({
        category: area,
        color: meta.color,
        label: meta.label,
        completionRate: 0,
        totalHabits: 0,
        completedCount: 0,
        expectedCount: 0,
        hasHabits: false,
      })
      continue
    }

    let totalExpected = 0
    let totalCompleted = 0

    for (const h of areaHabits) {
      // Account for habits created mid-period
      const habitStart = h.start_date || periodStartStr
      const effectiveStart = habitStart > periodStartStr ? habitStart : periodStartStr
      const startDate = new Date(effectiveStart)
      const today = new Date()
      const activeDays = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)))
      const days = Math.min(activeDays, periodDays)

      let expected = days
      if (h.frequency_type === 'specific_days' && h.frequency_config) {
        const config = h.frequency_config as { days?: number[] }
        const daysPerWeek = config.days?.length || 7
        expected = Math.round((daysPerWeek / 7) * days)
      } else if (h.frequency_type === 'weekly_target' && h.frequency_config) {
        const config = h.frequency_config as { target?: number }
        expected = Math.round((config.target || 3) * (days / 7))
      }

      totalExpected += Math.max(1, expected)
      totalCompleted += completionsByHabit.get(h.id) || 0
    }

    const rate = totalExpected > 0 ? Math.min(100, (totalCompleted / totalExpected) * 100) : 0

    scores.push({
      category: area,
      color: meta.color,
      label: meta.label,
      completionRate: Math.round(rate),
      totalHabits: areaHabits.length,
      completedCount: totalCompleted,
      expectedCount: totalExpected,
      hasHabits: true,
    })
  }

  // Sort weakest first
  return scores.sort((a, b) => {
    if (!a.hasHabits && b.hasHabits) return -1
    if (a.hasHabits && !b.hasHabits) return 1
    return a.completionRate - b.completionRate
  })
}

function getFallbackAnalysis(scores: CategoryScore[]): LifeReportAnalysis {
  const withHabits = scores.filter(s => s.hasHabits)
  const withoutHabits = scores.filter(s => !s.hasHabits)
  const strong = withHabits.filter(s => s.completionRate >= 70).map(s => s.category)
  const weak = withHabits.filter(s => s.completionRate < 50).map(s => s.category)

  const strongest = withHabits.length > 0
    ? withHabits.reduce((a, b) => a.completionRate > b.completionRate ? a : b)
    : null
  const weakest = withHabits.length > 0
    ? withHabits.reduce((a, b) => a.completionRate < b.completionRate ? a : b)
    : null

  let summary = ''
  if (strongest && weakest && strongest.category !== weakest.category) {
    summary = `Your strongest area is ${strongest.category} at ${strongest.completionRate}%. ${weakest.category} needs the most attention at ${weakest.completionRate}%.`
  } else if (strongest) {
    summary = `You're performing consistently across your habits with ${strongest.category} leading at ${strongest.completionRate}%.`
  } else {
    summary = 'Start tracking habits to see your life area analysis.'
  }

  const recommendations: string[] = []
  for (const s of weak) {
    recommendations.push(`Focus on improving your ${s} habits — even completing one more per week makes a difference.`)
  }
  for (const s of withoutHabits) {
    recommendations.push(`You have no habits tracking ${s.category}. Consider adding one to cover this life area.`)
  }
  if (recommendations.length === 0 && strong.length > 0) {
    recommendations.push('Great consistency! Consider increasing the challenge in your strongest areas.')
  }

  return {
    summary,
    strongAreas: strong,
    weakAreas: [...weak, ...withoutHabits.map(s => s.category)],
    recommendations: recommendations.slice(0, 5),
  }
}

export async function generateLifeReport(scores: CategoryScore[]): Promise<LifeReportAnalysis> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const useAI = apiKey && apiKey !== 'your-openai-api-key-here'

  if (!useAI) {
    return getFallbackAnalysis(scores)
  }

  const scoresSummary = scores.map(s =>
    s.hasHabits
      ? `${s.category} (${s.label}): ${s.completionRate}% completion rate (${s.totalHabits} habits, ${s.completedCount}/${s.expectedCount} completions)`
      : `${s.category} (${s.label}): No habits tracked`
  ).join('\n')

  const prompt = `You are a life coach analyzing a user's habit tracking data over the last 30 days.
Here are their completion rates across 5 life areas:

${scoresSummary}

Provide a brief, encouraging analysis in JSON format:
{
  "summary": "1-2 sentence overview of their life balance",
  "strongAreas": ["array of category names performing well (70%+)"],
  "weakAreas": ["array of category names needing improvement (<50% or no habits)"],
  "recommendations": ["3-5 specific, actionable recommendations referencing actual numbers"]
}

Be specific and reference the actual numbers. Be encouraging but honest about weak areas.
Return ONLY valid JSON, no other text.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a supportive life coach. Respond only with valid JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 500,
    })

    const content = completion.choices[0]?.message?.content?.trim() || '{}'
    const cleaned = content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    return JSON.parse(cleaned) as LifeReportAnalysis
  } catch (error) {
    console.error('OpenAI life report error, using fallback:', error)
    return getFallbackAnalysis(scores)
  }
}
