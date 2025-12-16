import { forwardRef } from 'react'
import type { Answer } from '../types'

interface AnswerCardProps {
  revealed?: boolean
  answer?: Answer
  showName?: boolean
  isDraggable?: boolean
  isDragging?: boolean
  style?: React.CSSProperties
  className?: string
}

const AnswerCard = forwardRef<
  HTMLDivElement,
  AnswerCardProps & React.HTMLAttributes<HTMLDivElement>
>(
  (
    {
      revealed = true,
      answer,
      showName = false,
      isDraggable = false,
      isDragging = false,
      style,
      className = '',
      ...props
    },
    ref
  ) => {
    return (
      <div
        ref={ref}
        style={style}
        className={`p-4 bg-gray-50 rounded-lg border border-gray-100 ${
          isDragging ? 'shadow-lg opacity-90' : ''
        } ${isDraggable ? 'cursor-grab active:cursor-grabbing' : ''} ${className}`}
        {...props}
      >
        {revealed && answer ? (
          <div className="flex items-start gap-3">
            {isDraggable && (
              <div className="flex-shrink-0 pt-1 text-gray-400">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M7 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 2zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 7 14zm6-8a2 2 0 1 0-.001-4.001A2 2 0 0 0 13 6zm0 2a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 8zm0 6a2 2 0 1 0 .001 4.001A2 2 0 0 0 13 14z" />
                </svg>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-gray-800">{answer.text}</p>
              {showName && answer.participantName && (
                <p className="text-sm text-gray-500 mt-2">— {answer.participantName}</p>
              )}
            </div>
          </div>
        ) : (
          <div className="flex-1 min-w-0">
            <div className="h-5 bg-gray-200 rounded w-3/4" />
          </div>
        )}
      </div>
    )
  }
)

AnswerCard.displayName = 'AnswerCard'

export default AnswerCard
