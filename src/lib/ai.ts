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

// --- Daily Insight ---

export interface DailyInsightContext {
  habits: Array<{
    name: string
    category: string
    description: string | null
    frequency_type: string
  }>
  completedToday: string[]
  pendingToday: string[]
  currentStreak: number
  weeklyProgress: Array<{
    habitName: string
    completedThisWeek: number
    target: number
  }>
  monthlyCompletionRate: number
  totalXP: number
  rankName: string
  rankLevel: number
  categoryBreakdown: Record<string, { completed: number; total: number }>
}

function getFallbackInsight(context: DailyInsightContext): string {
  const todayProgress = context.completedToday.length
  const todayTotal = context.completedToday.length + context.pendingToday.length
  const pct = todayTotal > 0 ? Math.round((todayProgress / todayTotal) * 100) : 0

  if (pct === 100) {
    return `All ${todayTotal} habits completed today — a perfect day on your path. Your ${context.currentStreak}-day streak as a ${context.rankName} shows the power of consistent small steps. Rest well tonight; tomorrow brings another opportunity for kaizen.`
  }
  if (pct >= 50) {
    return `You have completed ${todayProgress} of ${todayTotal} habits so far today. With ${context.pendingToday.length} remaining, there is still time to finish strong. Remember: the ${context.rankName} does not seek perfection, only steady progress.`
  }
  if (todayProgress > 0) {
    return `A beginning has been made with ${todayProgress} habit${todayProgress > 1 ? 's' : ''} completed. The remaining ${context.pendingToday.length} await your attention. Even one small step forward keeps the momentum of your ${context.currentStreak}-day journey alive.`
  }
  return `Today is a fresh canvas. You have ${todayTotal} habits ready and waiting. A ${context.rankName} knows that the hardest step is always the first — begin with whichever habit feels most natural right now.`
}

export async function generateDailyInsight(context: DailyInsightContext): Promise<string> {
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY
  const useAI = apiKey && apiKey !== 'your-openai-api-key-here'

  if (!useAI) {
    return getFallbackInsight(context)
  }

  const todayProgress = context.completedToday.length
  const todayTotal = context.completedToday.length + context.pendingToday.length
  const completionPct = todayTotal > 0 ? Math.round((todayProgress / todayTotal) * 100) : 0

  const prompt = `You are a wise Kaizen mentor in a habit tracking app called "The Way of Kaizen."
Your voice is calm, encouraging, and grounded in Japanese philosophy of continuous improvement (kaizen).
You speak with the wisdom of a sensei but remain warm and practical.

Here is the user's current progress data:

TODAY'S PROGRESS: ${todayProgress}/${todayTotal} habits completed (${completionPct}%)
Completed: ${context.completedToday.length > 0 ? context.completedToday.join(', ') : 'None yet'}
Remaining: ${context.pendingToday.length > 0 ? context.pendingToday.join(', ') : 'All done!'}

STREAK: ${context.currentStreak} consecutive days
MONTHLY COMPLETION RATE: ${context.monthlyCompletionRate}%
RANK: ${context.rankName} (Level ${context.rankLevel}) with ${context.totalXP} XP

CATEGORY BREAKDOWN:
${Object.entries(context.categoryBreakdown)
  .map(([cat, data]) => `- ${cat}: ${data.completed}/${data.total} completed today`)
  .join('\n')}

${context.weeklyProgress.length > 0 ? `WEEKLY TARGETS:\n${context.weeklyProgress.map(w => `- ${w.habitName}: ${w.completedThisWeek}/${w.target} this week`).join('\n')}` : ''}

Based on this data, provide a brief daily insight (3-5 sentences max). Include:
1. A personalized observation about their progress today
2. One specific, actionable suggestion for improvement
3. An encouraging closing thought aligned with kaizen philosophy

Keep it concise, warm, and actionable. Do NOT use bullet points or numbered lists - write in flowing prose.
Do NOT use generic motivational cliches. Be specific to their data.`

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a Kaizen sensei providing daily wisdom. Respond in plain text only, no markdown formatting.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.8,
      max_tokens: 300,
    })

    return completion.choices[0]?.message?.content?.trim() || getFallbackInsight(context)
  } catch (error) {
    console.error('OpenAI daily insight error, using fallback:', error)
    return getFallbackInsight(context)
  }
}
