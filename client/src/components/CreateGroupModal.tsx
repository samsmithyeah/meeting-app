import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Layers } from 'lucide-react'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'

interface CreateGroupModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (name: string) => void
}

export default function CreateGroupModal({ isOpen, onClose, onCreate }: CreateGroupModalProps) {
  const [name, setName] = useState('')

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
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md z-50"
          >
            <Card className="border-border shadow-xl">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-lg font-semibold flex items-center">
                  <Layers className="w-5 h-5 mr-2 text-primary" />
                  Create New Group
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={handleClose} className="h-8 w-8">
                  <X className="w-4 h-4" />
                </Button>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4 pt-4">
                  <div className="space-y-2">
                    <label htmlFor="group-name" className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      Group Name
                    </label>
                    <Input
                      id="group-name"
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g., Technical Issues"
                      autoFocus
                    />
                  </div>

                  <div className="flex justify-end gap-3 pt-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleClose}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      disabled={!name.trim()}
                    >
                      Create Group
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  )
}
