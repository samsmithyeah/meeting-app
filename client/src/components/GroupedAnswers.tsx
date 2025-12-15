import { useState, useMemo } from 'react'
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, pointerWithin } from '@dnd-kit/core'
import { useDroppable } from '@dnd-kit/core'
import AnswerGroup from './AnswerGroup'
import DraggableAnswer from './DraggableAnswer'
import CreateGroupModal from './CreateGroupModal'
import type { Answer, GroupedAnswersData } from '../types'

interface GroupedAnswersProps {
  data: GroupedAnswersData
  showNames: boolean
  isFacilitator: boolean
  onMoveAnswer?: (answerId: string, targetGroupId: string | null) => void
  onCreateGroup?: (name: string) => void
  onRenameGroup?: (groupId: string, name: string) => void
  onDeleteGroup?: (groupId: string) => void
}

function UngroupedSection({
  answers,
  showNames,
  isFacilitator
}: {
  answers: Answer[]
  showNames: boolean
  isFacilitator: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: 'ungrouped'
  })

  if (answers.length === 0 && !isFacilitator) {
    return null
  }

  return (
    <div
      ref={setNodeRef}
      className={`rounded-3xl border-2 border-dashed transition-colors ${
        isOver ? 'border-accent/50 bg-accent/5' : 'border-stroke/80 bg-surface2/70'
      }`}
    >
      <div className="p-4 border-b border-stroke/70">
        <div className="flex items-center gap-2">
          <h4 className="font-semibold text-ink">Ungrouped</h4>
          <span className="badge">{answers.length}</span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {answers.length === 0 ? (
          <p className="text-sm text-muted text-center py-4">
            {isFacilitator ? 'Drag answers here to ungroup them' : 'No ungrouped answers'}
          </p>
        ) : (
          answers.map((answer) => (
            <DraggableAnswer
              key={answer.id}
              answer={answer}
              showName={showNames}
              isDraggable={isFacilitator}
            />
          ))
        )}
      </div>
    </div>
  )
}

export default function GroupedAnswers({
  data,
  showNames,
  isFacilitator,
  onMoveAnswer,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup
}: GroupedAnswersProps) {
  const [activeAnswer, setActiveAnswer] = useState<Answer | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Build lookup maps for O(1) answer and group lookups
  const { answerMap, answerToGroupMap } = useMemo(() => {
    const am = new Map<string, Answer>()
    const atgm = new Map<string, string | null>()
    for (const group of data.groups) {
      for (const answer of group.answers) {
        am.set(answer.id, answer)
        atgm.set(answer.id, group.id)
      }
    }
    for (const answer of data.ungrouped) {
      am.set(answer.id, answer)
      atgm.set(answer.id, null)
    }
    return { answerMap: am, answerToGroupMap: atgm }
  }, [data])

  const handleDragStart = (event: DragStartEvent) => {
    const answer = answerMap.get(event.active.id as string) || null
    setActiveAnswer(answer)
  }

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveAnswer(null)

    const { active, over } = event
    if (!over || !onMoveAnswer) return

    const answerId = active.id as string
    const targetId = over.id as string

    // Determine the target group ID (null for ungrouped)
    const targetGroupId = targetId === 'ungrouped' ? null : targetId

    // Get current group of the answer from lookup map
    const currentGroupId = answerToGroupMap.get(answerId) ?? null

    // Only move if the target is different
    if (currentGroupId !== targetGroupId) {
      onMoveAnswer(answerId, targetGroupId)
    }
  }

  const totalAnswers =
    data.groups.reduce((sum, g) => sum + g.answers.length, 0) + data.ungrouped.length

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h3 className="text-sm font-semibold text-ink">Grouped responses</h3>
          <span className="badge">{totalAnswers}</span>
        </div>
        {isFacilitator && (
          <button onClick={() => setShowCreateModal(true)} className="btn-secondary px-3 py-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New group
          </button>
        )}
      </div>

      <DndContext
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="space-y-4">
          {data.groups.map((group) => (
            <AnswerGroup
              key={group.id}
              group={group}
              showNames={showNames}
              isFacilitator={isFacilitator}
              onRename={onRenameGroup ? (name) => onRenameGroup(group.id, name) : undefined}
              onDelete={onDeleteGroup ? () => onDeleteGroup(group.id) : undefined}
            />
          ))}

          <UngroupedSection
            answers={data.ungrouped}
            showNames={showNames}
            isFacilitator={isFacilitator}
          />
        </div>

        {/* Drag overlay for visual feedback */}
        <DragOverlay>
          {activeAnswer && (
            <div className="opacity-90">
              <DraggableAnswer answer={activeAnswer} showName={showNames} isDraggable={false} />
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {/* Create group modal */}
      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={(name) => {
          onCreateGroup?.(name)
          setShowCreateModal(false)
        }}
      />
    </div>
  )
}
