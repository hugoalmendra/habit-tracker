import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Shield } from 'lucide-react'

interface PromoteMemberModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  memberName: string
  memberPhoto?: string | null
  onConfirm: () => void
  isPromoting: boolean
}

export default function PromoteMemberModal({
  open,
  onOpenChange,
  memberName,
  memberPhoto,
  onConfirm,
  isPromoting
}: PromoteMemberModalProps) {
  const handleConfirm = () => {
    onConfirm()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Promote to Admin</DialogTitle>
          <DialogDescription>
            Are you sure you want to promote this member to admin?
          </DialogDescription>
        </DialogHeader>

        <div className="flex items-center gap-4 py-4">
          <Avatar className="h-16 w-16">
            <AvatarImage src={memberPhoto || undefined} />
            <AvatarFallback className="text-lg">
              {memberName.substring(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <p className="font-semibold text-lg">{memberName}</p>
            <p className="text-sm text-muted-foreground">
              Will become a group admin
            </p>
          </div>
          <Shield className="h-8 w-8 text-primary" />
        </div>

        <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
          <p className="text-sm font-medium">Admin privileges include:</p>
          <ul className="text-sm text-muted-foreground space-y-1 ml-4">
            <li>• Edit group details and settings</li>
            <li>• Invite new members</li>
            <li>• Remove members from the group</li>
            <li>• Promote other members to admin</li>
            <li>• Pin and manage discussions</li>
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isPromoting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isPromoting}
          >
            <Shield className="mr-2 h-4 w-4" />
            {isPromoting ? 'Promoting...' : 'Promote to Admin'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
