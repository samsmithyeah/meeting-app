import { useDraggable } from '@dnd-kit/core'
import type { Answer } from '../types'

interface DraggableAnswerProps {
  answer: Answer
  showName: boolean
  isDraggable: boolean
}

export default function DraggableAnswer({ answer, showName, isDraggable }: DraggableAnswerProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: answer.id,
    disabled: !isDraggable
  })

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: isDragging ? 1000 : undefined
      }
    : undefined

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-4 bg-neutral-50 rounded-xl border border-neutral-100 transition-all ${
        isDragging ? 'shadow-lg shadow-coral-500/20 scale-[1.02] rotate-1' : ''
      } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''}`}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
    >
      <div className="flex items-start gap-3">
        {isDraggable && (
          <div className="flex-shrink-0 pt-1 text-neutral-300 hover:text-neutral-400 transition-colors">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
            </svg>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-neutral-800 leading-relaxed">{answer.text}</p>
          {showName && answer.participantName && (
            <p className="text-sm text-neutral-500 mt-2 flex items-center gap-1.5">
              <span className="w-5 h-5 bg-gradient-to-br from-coral-400 to-amber-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                {answer.participantName.charAt(0).toUpperCase()}
              </span>
              {answer.participantName}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
