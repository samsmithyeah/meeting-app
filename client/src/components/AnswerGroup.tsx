import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronRight, Edit2, Trash2, Check, X } from 'lucide-react'
import DraggableAnswer from './DraggableAnswer'
import { Button } from './ui/Button'
import { cn } from '../lib/utils'
import type { GroupWithAnswers } from '../types'

interface AnswerGroupProps {
  group: GroupWithAnswers
  showNames: boolean
  isFacilitator: boolean
  onRename?: (name: string) => void
  onDelete?: () => void
}

export default function AnswerGroup({
  group,
  showNames,
  isFacilitator,
  onRename,
  onDelete
}: AnswerGroupProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState(group.name)
  const [originalName, setOriginalName] = useState(group.name)

  const { setNodeRef, isOver } = useDroppable({
    id: group.id
  })

  const startEditing = () => {
    setOriginalName(group.name)
    setEditName(group.name)
    setIsEditing(true)
  }

  const handleRename = () => {
    // Only rename if the text actually changed from when we started editing
    if (editName.trim() && editName.trim() !== originalName && onRename) {
      onRename(editName.trim())
    }
    setIsEditing(false)
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename()
    } else if (e.key === 'Escape') {
      setEditName(originalName)
      setIsEditing(false)
    }
  }

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "rounded-xl border-2 transition-all duration-200 overflow-hidden",
        isOver 
          ? "border-primary bg-primary/5 shadow-md" 
          : "border-border bg-card hover:border-border/80"
      )}
    >
      {/* Group Header */}
      <div className="flex items-center justify-between p-3 border-b border-border/50 bg-muted/30">
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-6 w-6 text-muted-foreground hover:text-foreground"
          >
            <motion.div
              animate={{ rotate: isExpanded ? 90 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.div>
          </Button>

          {isEditing ? (
            <div className="flex items-center gap-2 flex-1">
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                onBlur={handleRename}
                onKeyDown={handleKeyDown}
                className="flex-1 px-2 py-1 text-sm bg-background border border-input rounded focus:outline-none focus:ring-2 focus:ring-ring"
                autoFocus
              />
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={handleRename}>
                <Check className="w-3 h-3 text-green-500" />
              </Button>
              <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => {
                setEditName(originalName)
                setIsEditing(false)
              }}>
                <X className="w-3 h-3 text-destructive" />
              </Button>
            </div>
          ) : (
            <h4 className="font-medium text-foreground truncate text-sm">{group.name}</h4>
          )}

          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-muted-foreground bg-secondary rounded-full">
            {group.answers.length}
          </span>
        </div>

        {isFacilitator && !isEditing && (
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="ghost"
              size="icon"
              onClick={startEditing}
              className="h-7 w-7 text-muted-foreground hover:text-primary"
              title="Rename group"
            >
              <Edit2 className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-muted-foreground hover:text-destructive"
              title="Delete group"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        )}
      </div>

      {/* Answers */}
      <AnimatePresence initial={false}>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="p-3 space-y-2 min-h-[60px]">
              {group.answers.length === 0 ? (
                <div className="h-full flex items-center justify-center py-4">
                  <p className="text-xs text-muted-foreground text-center">
                    {isFacilitator ? 'Drag answers here' : 'No answers in this group'}
                  </p>
                </div>
              ) : (
                group.answers.map((answer) => (
                  <DraggableAnswer
                    key={answer.id}
                    answer={answer}
                    showName={showNames}
                    isDraggable={isFacilitator}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
