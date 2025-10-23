import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { usePublicGroups, PublicGroup } from '@/hooks/usePublicGroups'
import { Switch } from '@/components/ui/switch'
import { Image as ImageIcon, X } from 'lucide-react'
import Spinner from '@/components/ui/Spinner'

interface EditPublicGroupModalProps {
  isOpen: boolean
  onClose: () => void
  group: PublicGroup
}

export default function EditPublicGroupModal({ isOpen, onClose, group }: EditPublicGroupModalProps) {
  const { user } = useAuth()
  const { updateGroup } = usePublicGroups()
  const [name, setName] = useState(group.name)
  const [description, setDescription] = useState(group.description || '')
  const [isPrivate, setIsPrivate] = useState(group.is_private)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(group.avatar_url)
  const [removeExistingImage, setRemoveExistingImage] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Update form when group changes
  useEffect(() => {
    setName(group.name)
    setDescription(group.description || '')
    setIsPrivate(group.is_private)
    setImagePreview(group.avatar_url)
    setRemoveExistingImage(false)
    setSelectedImage(null)
  }, [group])

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('Image must be less than 5MB')
        return
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file')
        return
      }

      setSelectedImage(file)
      setRemoveExistingImage(false)

      // Create preview
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    setRemoveExistingImage(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)

    try {
      let avatarUrl: string | undefined | null = group.avatar_url

      // Handle image upload
      if (selectedImage) {
        const fileExt = selectedImage.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('group-avatars')
          .upload(fileName, selectedImage)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('group-avatars')
          .getPublicUrl(fileName)

        avatarUrl = publicUrl

        // Delete old image if it exists
        if (group.avatar_url) {
          const oldPath = group.avatar_url.split('/group-avatars/')[1]
          if (oldPath) {
            await supabase.storage
              .from('group-avatars')
              .remove([oldPath])
          }
        }
      } else if (removeExistingImage) {
        // Remove the existing image
        if (group.avatar_url) {
          const oldPath = group.avatar_url.split('/group-avatars/')[1]
          if (oldPath) {
            await supabase.storage
              .from('group-avatars')
              .remove([oldPath])
          }
        }
        avatarUrl = null
      }

      await updateGroup({
        groupId: group.id,
        name,
        description,
        avatar_url: avatarUrl,
        is_private: isPrivate,
      })

      onClose()

      // Reset form
      setSelectedImage(null)
      setRemoveExistingImage(false)
    } catch (error: any) {
      console.error('Error updating group:', error)
      alert(error.message || 'Failed to update group. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Group</DialogTitle>
          <DialogDescription>
            Update your group's name, description, avatar, and privacy settings.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">
              Group Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter group name"
              required
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's this group about?"
              rows={3}
              maxLength={500}
            />
          </div>

          <div className="space-y-2">
            <Label>Group Avatar</Label>
            {imagePreview ? (
              <div className="relative">
                <img
                  src={imagePreview}
                  alt="Group avatar preview"
                  className="w-32 h-32 object-cover rounded-lg border"
                />
                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
                  onClick={removeImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ) : (
              <div>
                <Input
                  id="edit-avatar"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
                <Label htmlFor="edit-avatar">
                  <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                    <ImageIcon className="h-4 w-4" />
                    <span>Upload Image</span>
                  </div>
                </Label>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Recommended: Square image, max 5MB
            </p>
          </div>

          <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="space-y-0.5">
              <Label htmlFor="edit-private" className="text-base">
                Private Group
              </Label>
              <p className="text-sm text-muted-foreground">
                Only invited members can join
              </p>
            </div>
            <Switch
              id="edit-private"
              checked={isPrivate}
              onCheckedChange={setIsPrivate}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !name.trim()}>
              {isLoading ? (
                <>
                  <Spinner size="sm" className="mr-2" />
                  Updating...
                </>
              ) : (
                'Update Group'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
