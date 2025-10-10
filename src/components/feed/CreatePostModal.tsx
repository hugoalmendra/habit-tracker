import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Globe, Users, Lock, Image, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePosts } from '@/hooks/usePosts'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'

interface CreatePostModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

const PRIVACY_OPTIONS = [
  { value: 'public' as const, label: 'Public', icon: Globe, description: 'Anyone can see this post' },
  { value: 'friends' as const, label: 'Friends', icon: Users, description: 'Only your friends can see' },
  { value: 'private' as const, label: 'Private', icon: Lock, description: 'Only you can see' },
]

export default function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const { user } = useAuth()
  const [content, setContent] = useState('')
  const [privacy, setPrivacy] = useState<'public' | 'friends' | 'private'>('public')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { createPost } = usePosts()

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image must be less than 5MB')
        return
      }
      setSelectedImage(file)
      const reader = new FileReader()
      reader.onloadend = () => {
        setImagePreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemoveImage = () => {
    setSelectedImage(null)
    setImagePreview(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    setIsSubmitting(true)
    try {
      let imageUrl: string | undefined

      // Upload image if selected
      if (selectedImage && user) {
        const fileExt = selectedImage.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`

        const { error: uploadError } = await supabase.storage
          .from('post-images')
          .upload(fileName, selectedImage)

        if (uploadError) throw uploadError

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
          .from('post-images')
          .getPublicUrl(fileName)

        imageUrl = publicUrl
      }

      await createPost({ content: content.trim(), privacy, image_url: imageUrl })
      setContent('')
      setPrivacy('public')
      handleRemoveImage()
      onOpenChange(false)
    } catch (error) {
      console.error('Error creating post:', error)
      alert('Failed to create post. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleClose = () => {
    setContent('')
    setPrivacy('public')
    handleRemoveImage()
    onOpenChange(false)
  }

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-lg rounded-2xl bg-background p-6 shadow-apple-lg"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Header */}
              <h2 className="mb-6 text-2xl font-semibold tracking-tight">Create Post</h2>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Content */}
                <div>
                  <label htmlFor="content" className="mb-2 block text-sm font-medium">
                    What's on your mind?
                  </label>
                  <textarea
                    id="content"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Share your progress, thoughts, or achievements..."
                    rows={5}
                    className="w-full rounded-xl border border-border/60 bg-background px-4 py-3 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 resize-none"
                    required
                    autoFocus
                  />
                </div>

                {/* Image Upload */}
                <div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageSelect}
                    className="hidden"
                  />

                  {imagePreview ? (
                    <div className="relative rounded-xl overflow-hidden border border-border/60">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="w-full h-48 object-cover"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="icon"
                        onClick={handleRemoveImage}
                        className="absolute top-2 right-2 h-8 w-8 rounded-lg shadow-lg"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full rounded-xl border-dashed"
                    >
                      <Image className="h-4 w-4 mr-2" />
                      Add Image
                    </Button>
                  )}
                </div>

                {/* Privacy */}
                <div>
                  <label className="mb-3 block text-sm font-medium">Privacy</label>
                  <div className="grid gap-2">
                    {PRIVACY_OPTIONS.map((option) => {
                      const Icon = option.icon
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setPrivacy(option.value)}
                          className={`flex items-center gap-3 rounded-xl border-2 p-4 text-left transition-all ${
                            privacy === option.value
                              ? 'border-primary bg-primary/5'
                              : 'border-border/60 hover:border-border'
                          }`}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          <div className="flex-1">
                            <p className="font-medium">{option.label}</p>
                            <p className="text-xs text-muted-foreground">{option.description}</p>
                          </div>
                          <div className={`h-5 w-5 rounded-full border-2 ${
                            privacy === option.value
                              ? 'border-primary bg-primary'
                              : 'border-border'
                          }`}>
                            {privacy === option.value && (
                              <div className="h-full w-full flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-primary-foreground" />
                              </div>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleClose}
                    className="flex-1 rounded-xl"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={!content.trim() || isSubmitting}
                    className="flex-1 rounded-xl bg-primary hover:bg-primary/90"
                  >
                    {isSubmitting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  )
}
