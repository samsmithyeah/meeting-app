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
      className={`rounded-2xl border-2 border-dashed transition-all ${
        isOver ? 'border-coral-400 bg-coral-50' : 'border-neutral-200 bg-neutral-50'
      }`}
    >
      <div className="p-4 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <svg
            className="w-4 h-4 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h16"
            />
          </svg>
          <h4 className="font-medium text-neutral-700">Ungrouped</h4>
          <span className="px-2 py-0.5 text-xs font-medium text-neutral-600 bg-neutral-200 rounded-full">
            {answers.length}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-3">
        {answers.length === 0 ? (
          <p className="text-sm text-neutral-500 text-center py-4">
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
        <h3 className="font-semibold text-neutral-900 flex items-center gap-2">
          <svg
            className="w-5 h-5 text-neutral-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          Grouped Responses
          <span className="text-sm font-normal text-neutral-500">({totalAnswers})</span>
        </h3>
        {isFacilitator && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-coral-600 hover:text-coral-700 hover:bg-coral-50 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            New Group
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
            <div className="opacity-90 rotate-2 scale-105">
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
