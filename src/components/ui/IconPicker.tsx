import { useState } from 'react'
import {
  Dumbbell, Book, Coffee, Utensils, Moon, Sun, Heart, Brain,
  Sparkles, Target, TrendingUp, Music, Palette, Camera,
  Bike, Waves, Leaf, Zap, Star, Award,
  Clock, Calendar, CheckCircle2, Activity, Footprints, Apple,
  Pill, Salad, GlassWater, Cigarette, Wine, Bed,
  Briefcase, Code, Laptop, PenTool, FileText, DollarSign,
  Users, MessageCircle, Phone, Mail, Gift, Smile,
  type LucideIcon
} from 'lucide-react'
import { Label } from '@/components/ui/label'

// Curated icon list organized by category
const ICON_CATEGORIES = {
  'Health & Fitness': {
    Dumbbell, Activity, Footprints, Apple, Salad, GlassWater,
    Pill, Bed, Bike, Waves
  },
  'Habits & Wellness': {
    Moon, Sun, Heart, Brain, Sparkles, Leaf, Zap
  },
  'Productivity': {
    Target, TrendingUp, Clock, Calendar, CheckCircle2, Briefcase,
    Code, Laptop, PenTool, FileText
  },
  'Creative': {
    Music, Palette, Camera, Book, Coffee
  },
  'Social & Finance': {
    Users, MessageCircle, Phone, Mail, Gift, Smile,
    DollarSign, Award, Star
  },
  'Substances': {
    Cigarette, Wine
  }
}

// Flatten all icons into a single map
const ALL_ICONS: Record<string, LucideIcon> = {}
Object.values(ICON_CATEGORIES).forEach(category => {
  Object.entries(category).forEach(([name, icon]) => {
    ALL_ICONS[name] = icon
  })
})

interface IconPickerProps {
  value?: string | null
  onChange: (iconName: string | null) => void
  label?: string
}

export default function IconPicker({ value, onChange, label = 'Icon' }: IconPickerProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>(Object.keys(ICON_CATEGORIES)[0])

  const categoryIcons = ICON_CATEGORIES[selectedCategory as keyof typeof ICON_CATEGORIES]

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        {value && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Clear
          </button>
        )}
      </div>

      {/* Category Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-2 scrollbar-hide">
        {Object.keys(ICON_CATEGORIES).map((category) => (
          <button
            key={category}
            type="button"
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-all ${
              selectedCategory === category
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary/50 text-muted-foreground hover:bg-secondary'
            }`}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Icon Grid */}
      <div className="grid grid-cols-6 gap-2 p-3 rounded-xl border border-border/40 bg-secondary/20 max-h-[200px] overflow-y-auto">
        {Object.entries(categoryIcons).map(([iconName, IconComponent]) => (
          <button
            key={iconName}
            type="button"
            onClick={() => onChange(iconName)}
            className={`flex items-center justify-center p-3 rounded-lg transition-all hover:scale-110 ${
              value === iconName
                ? 'bg-primary text-primary-foreground shadow-md ring-2 ring-primary ring-offset-2 ring-offset-background'
                : 'bg-background hover:bg-secondary/50'
            }`}
            title={iconName}
          >
            <IconComponent className="h-5 w-5" />
          </button>
        ))}
      </div>

      {/* Selected Icon Preview */}
      {value && (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30 text-sm">
          <div className="flex items-center justify-center h-8 w-8 rounded-md bg-primary/10">
            {(() => {
              const SelectedIcon = ALL_ICONS[value]
              return SelectedIcon ? <SelectedIcon className="h-4 w-4 text-primary" /> : null
            })()}
          </div>
          <span className="text-xs font-medium">{value}</span>
        </div>
      )}
    </div>
  )
}

// Export the icon component getter for use in other components
export function getIconComponent(iconName: string | null | undefined): LucideIcon | null {
  if (!iconName) return null
  return ALL_ICONS[iconName] || null
}
