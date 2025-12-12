import { useState, useEffect } from 'react'
import type { QuestionCardProps } from '../types'

export default function QuestionCard({
  question,
  status,
  answeredCount = 0,
  totalCount = 0,
  timerEnd,
  isFacilitator
}: QuestionCardProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!timerEnd) {
      setTimeLeft(null)
      return
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [timerEnd])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      {/* Timer */}
      {timeLeft !== null && status === 'answering' && (
        <div className={`mb-4 text-center ${timeLeft <= 10 ? 'text-red-600' : 'text-gray-600'}`}>
          <div className="text-3xl font-mono font-bold">{formatTime(timeLeft)}</div>
          <div className="text-sm">remaining</div>
        </div>
      )}

      {/* Question */}
      <div className="text-xl font-medium text-gray-900 text-center">{question.text}</div>

      {/* Status indicators */}
      {isFacilitator && status === 'answering' && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-blue-500"></span>
            </span>
            <span className="font-medium">
              {answeredCount} of {totalCount} answered
            </span>
          </div>
        </div>
      )}

      {status === 'revealed' && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 bg-green-50 text-green-700 px-4 py-2 rounded-full">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
              />
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
              />
            </svg>
            <span className="font-medium">Answers Revealed</span>
          </span>
        </div>
      )}

      {/* Question options indicator */}
      {question.allowMultipleAnswers && status !== 'revealed' && (
        <p className="mt-3 text-sm text-gray-500 text-center">Multiple answers allowed</p>
      )}
    </div>
  )
}
