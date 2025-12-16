import { useDraggable } from '@dnd-kit/core'
import { GripVertical } from 'lucide-react'
import { cn } from '../lib/utils'
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
      className={cn(
        "p-3 bg-background rounded-lg border border-border shadow-sm transition-all duration-200",
        isDragging && "shadow-xl ring-2 ring-primary/20 opacity-90 scale-105 rotate-1",
        isDraggable && "cursor-grab active:cursor-grabbing hover:border-primary/50"
      )}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
    >
      <div className="flex items-start gap-3">
        {isDraggable && (
          <div className="flex-shrink-0 pt-1 text-muted-foreground/50">
            <GripVertical className="w-4 h-4" />
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-foreground text-sm leading-relaxed">{answer.text}</p>
          {showName && answer.participantName && (
            <p className="text-xs text-muted-foreground mt-1.5 font-medium">— {answer.participantName}</p>
          )}
        </div>
      </div>
    </div>
  )
}
