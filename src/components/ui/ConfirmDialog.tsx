import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X } from 'lucide-react'
import { Button } from './button'

interface ConfirmDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: 'danger' | 'warning' | 'info'
}

export default function ConfirmDialog({
  open,
  onOpenChange,
  onConfirm,
  title,
  description,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger'
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  const handleCancel = () => {
    onOpenChange(false)
  }

  const variantStyles = {
    danger: {
      iconBg: 'bg-destructive/10',
      iconColor: 'text-destructive',
      buttonClass: 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
    },
    warning: {
      iconBg: 'bg-yellow-500/10',
      iconColor: 'text-yellow-600',
      buttonClass: 'bg-yellow-500 hover:bg-yellow-600 text-white'
    },
    info: {
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      buttonClass: 'bg-primary hover:bg-primary/90'
    }
  }

  const style = variantStyles[variant]

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleCancel}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
          />

          {/* Dialog */}
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-md rounded-2xl bg-background shadow-apple-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleCancel}
                className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              {/* Content */}
              <div className="p-6">
                {/* Icon */}
                <div className="flex justify-center mb-4">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-full ${style.iconBg}`}>
                    <AlertTriangle className={`h-7 w-7 ${style.iconColor}`} />
                  </div>
                </div>

                {/* Title */}
                <h2 className="text-xl font-semibold text-center mb-2">
                  {title}
                </h2>

                {/* Description */}
                <p className="text-sm text-muted-foreground text-center mb-6">
                  {description}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    className="flex-1 rounded-xl"
                  >
                    {cancelText}
                  </Button>
                  <Button
                    type="button"
                    onClick={handleConfirm}
                    className={`flex-1 rounded-xl ${style.buttonClass}`}
                  >
                    {confirmText}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
