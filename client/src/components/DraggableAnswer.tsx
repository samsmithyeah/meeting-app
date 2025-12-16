import { useDraggable } from '@dnd-kit/core'
import AnswerCard from './AnswerCard'
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
    <AnswerCard
      ref={setNodeRef}
      style={style}
      revealed={true}
      answer={answer}
      showName={showName}
      isDraggable={isDraggable}
      isDragging={isDragging}
      {...(isDraggable ? { ...listeners, ...attributes } : {})}
    />
  )
}
