import { useState } from 'react'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export default function CreateGroupModal({ isOpen, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState('')

  if (!isOpen) return null

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (name.trim()) {
      onCreate(name.trim())
      setName('')
      onClose()
    }
  }

  const handleClose = () => {
    setName('')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={handleClose} />

      {/* Modal */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Create new group"
        className="relative surface-solid p-6 w-full max-w-md mx-4 animate-fade-up"
      >
        <h3 className="text-lg font-semibold tracking-tight text-ink mb-4">Create new group</h3>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="group-name" className="block text-sm font-semibold text-ink">
              Group name
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Technical Issues"
              className="input mt-2"
              autoFocus
            />
          </div>

          <div className="flex justify-end gap-3">
            <button type="button" onClick={handleClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" disabled={!name.trim()} className="btn-primary">
              Create
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
