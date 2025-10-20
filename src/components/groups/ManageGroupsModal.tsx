import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Users, Plus, Edit2, Trash2, UserPlus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFollowerGroups, type FollowerGroup } from '@/hooks/useFollowerGroups'
import CreateGroupModal from './CreateGroupModal'
import EditGroupModal from './EditGroupModal'

interface ManageGroupsModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function ManageGroupsModal({ open, onOpenChange }: ManageGroupsModalProps) {
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [selectedGroup, setSelectedGroup] = useState<FollowerGroup | null>(null)

  const { groups, loadingGroups, deleteGroup, isDeleting } = useFollowerGroups()

  const handleEditGroup = (group: FollowerGroup) => {
    setSelectedGroup(group)
    setShowEditModal(true)
  }

  const handleDeleteGroup = async (group: FollowerGroup) => {
    if (!window.confirm(`Are you sure you want to delete "${group.name}"? This cannot be undone.`)) {
      return
    }

    try {
      await deleteGroup(group.id)
    } catch (error) {
      console.error('Error deleting group:', error)
      alert(`Failed to delete group: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  const handleClose = () => {
    onOpenChange(false)
  }

  return (
    <>
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
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative w-full max-w-2xl rounded-2xl bg-background shadow-apple-lg my-8"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Close button */}
                <button
                  onClick={handleClose}
                  className="absolute right-4 top-4 rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors z-10"
                >
                  <X className="h-5 w-5" />
                </button>

                {/* Content */}
                <div className="p-6">
                  {/* Header */}
                  <div className="flex items-center justify-between mb-6 pr-8">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Users className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Manage Groups</h2>
                        <p className="text-sm text-muted-foreground">
                          {groups?.length || 0} group{groups?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>

                    <Button
                      onClick={() => setShowCreateModal(true)}
                      className="rounded-xl bg-primary hover:bg-primary/90"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Create Group
                    </Button>
                  </div>

                  {/* Groups List */}
                  {loadingGroups ? (
                    <div className="text-center py-12 text-muted-foreground">
                      Loading groups...
                    </div>
                  ) : groups && groups.length > 0 ? (
                    <div className="grid gap-4 sm:grid-cols-2">
                      {groups.map((group) => (
                        <motion.div
                          key={group.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="rounded-xl border border-border/40 bg-secondary/30 p-5 hover:shadow-md transition-all"
                        >
                          {/* Group Header */}
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                                <Users className="h-6 w-6 text-primary" />
                              </div>
                              <div>
                                <h3 className="font-semibold text-base">{group.name}</h3>
                                <p className="text-xs text-muted-foreground">
                                  {group.member_count || 0} member{group.member_count !== 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Description */}
                          {group.description && (
                            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                              {group.description}
                            </p>
                          )}

                          {/* Actions */}
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditGroup(group)}
                              className="flex-1 rounded-lg"
                            >
                              <Edit2 className="h-3.5 w-3.5 mr-1.5" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteGroup(group)}
                              disabled={isDeleting}
                              className="flex-1 rounded-lg hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50"
                            >
                              <Trash2 className="h-3.5 w-3.5 mr-1.5" />
                              Delete
                            </Button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-16">
                      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-secondary/50 mx-auto mb-4">
                        <UserPlus className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <h3 className="text-lg font-semibold mb-2">No groups yet</h3>
                      <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                        Create groups to organize your followers and make it easier to invite them to challenges.
                      </p>
                      <Button
                        onClick={() => setShowCreateModal(true)}
                        className="rounded-xl bg-primary hover:bg-primary/90"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Create Your First Group
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Create Group Modal */}
      <CreateGroupModal
        open={showCreateModal}
        onOpenChange={setShowCreateModal}
      />

      {/* Edit Group Modal */}
      <EditGroupModal
        open={showEditModal}
        onOpenChange={setShowEditModal}
        group={selectedGroup}
      />
    </>
  )
}
