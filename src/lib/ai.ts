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
