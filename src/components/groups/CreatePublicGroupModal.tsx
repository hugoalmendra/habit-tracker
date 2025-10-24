import { useState } from 'react'
import { usePublicGroups } from '@/hooks/usePublicGroups'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Lock, Globe, Image as ImageIcon, X } from 'lucide-react'

interface CreatePublicGroupModalProps {
  isOpen: boolean
  onClose: () => void
}

export default function CreatePublicGroupModal({ isOpen, onClose }: CreatePublicGroupModalProps) {
  const { user } = useAuth()
  const { createGroup, isCreating } = usePublicGroups()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [isPrivate, setIsPrivate] = useState(false)

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
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    try {
      let avatarUrl: string | undefined

      // Upload image if selected
      if (selectedImage && user) {
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
      }

      await createGroup({
        name: name.trim(),
        description: description.trim() || undefined,
        avatar_url: avatarUrl,
        is_private: isPrivate,
      })

      // Reset form
      setName('')
      setDescription('')
      setSelectedImage(null)
      setImagePreview(null)
      setIsPrivate(false)
      onClose()
    } catch (error: any) {
      console.error('Error creating group:', error)

      // Check if it's a duplicate name error (409 conflict)
      if (error?.code === '23505' || error?.message?.includes('duplicate') || error?.message?.includes('unique')) {
        alert('A group with this name already exists. Please choose a different name.')
      } else {
        alert('Failed to create group. Please try again.')
      }
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create New Group</DialogTitle>
            <DialogDescription>
              Create a group to connect with people who share your interests.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Group Name *</Label>
              <Input
                id="name"
                placeholder="e.g., Book Club, Fitness Enthusiasts, Jazz Lovers"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={50}
                required
              />
              <p className="text-xs text-muted-foreground">
                {name.length}/50 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Tell people what this group is about..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={200}
                rows={3}
              />
              <p className="text-xs text-muted-foreground">
                {description.length}/200 characters
              </p>
            </div>

            <div className="space-y-2">
              <Label>Cover Photo (optional)</Label>
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Group cover photo preview"
                    className="w-full h-40 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    className="absolute top-2 right-2 h-8 w-8 rounded-full shadow-lg"
                    onClick={removeImage}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <Input
                    id="avatar"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <Label htmlFor="avatar">
                    <div className="flex items-center gap-2 px-4 py-2 border border-input rounded-md hover:bg-accent hover:text-accent-foreground cursor-pointer transition-colors">
                      <ImageIcon className="h-4 w-4" />
                      <span>Upload Cover Photo</span>
                    </div>
                  </Label>
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Recommended: Landscape image (16:9 ratio), max 5MB
              </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  {isPrivate ? (
                    <Lock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Globe className="h-4 w-4 text-muted-foreground" />
                  )}
                  <Label htmlFor="private" className="cursor-pointer">
                    {isPrivate ? 'Private Group' : 'Public Group'}
                  </Label>
                </div>
                <p className="text-sm text-muted-foreground">
                  {isPrivate
                    ? 'Only invited members can join'
                    : 'Anyone can discover and join'}
                </p>
              </div>
              <Switch
                id="private"
                checked={isPrivate}
                onCheckedChange={setIsPrivate}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isCreating || !name.trim()}>
              {isCreating ? 'Creating...' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
