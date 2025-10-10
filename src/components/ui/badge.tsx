import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 backdrop-blur-md",
  {
    variants: {
      variant: {
        default:
          "border-primary/30 bg-primary/50 text-primary hover:bg-primary/60",
        secondary:
          "border-secondary/30 bg-secondary/50 text-secondary-foreground hover:bg-secondary/60",
        destructive:
          "border-destructive/30 bg-destructive/50 text-destructive hover:bg-destructive/60",
        outline: "text-foreground border-white/20 dark:border-white/10 bg-white/40 dark:bg-black/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
