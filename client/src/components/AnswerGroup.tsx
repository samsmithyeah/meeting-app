import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import DraggableAnswer from './DraggableAnswer'
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
      className={`rounded-xl border-2 transition-colors ${
        isOver ? 'border-indigo-400 bg-indigo-50' : 'border-gray-200 bg-white'
      }`}
    >
      {/* Group Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-100">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-gray-500 hover:text-gray-700"
          >
            <svg
              className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>

          {isEditing ? (
            <input
              type="text"
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="flex-1 px-2 py-1 border border-indigo-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          ) : (
            <h4 className="font-medium text-gray-900 truncate">{group.name}</h4>
          )}

          <span className="flex-shrink-0 px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
            {group.answers.length}
          </span>
        </div>

        {isFacilitator && !isEditing && (
          <div className="flex items-center gap-1">
            <button
              onClick={startEditing}
              className="p-1.5 text-gray-400 hover:text-indigo-600 rounded"
              title="Rename group"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                />
              </svg>
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 text-gray-400 hover:text-red-600 rounded"
              title="Delete group"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* Answers */}
      {isExpanded && (
        <div className="p-4 space-y-3">
          {group.answers.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-4">
              {isFacilitator ? 'Drag answers here' : 'No answers in this group'}
            </p>
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
      )}
    </div>
  )
}
