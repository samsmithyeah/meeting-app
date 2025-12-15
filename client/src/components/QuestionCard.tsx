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

  const isUrgent = timeLeft !== null && timeLeft <= 10

  return (
    <div className="card overflow-hidden">
      {/* Gradient accent bar */}
      <div className="h-1 bg-gradient-to-r from-coral-500 via-amber-500 to-coral-400" />

      <div className="p-6">
        {/* Timer */}
        {timeLeft !== null && status === 'answering' && (
          <div className="flex justify-center mb-6">
            <div
              className={`relative flex items-center justify-center w-24 h-24 rounded-full ${
                isUrgent
                  ? 'bg-red-50 border-4 border-red-200'
                  : 'bg-neutral-50 border-4 border-neutral-200'
              }`}
            >
              {isUrgent && (
                <div className="absolute inset-0 rounded-full animate-ping bg-red-200 opacity-30" />
              )}
              <div className="text-center">
                <div
                  className={`text-3xl font-mono font-bold ${
                    isUrgent ? 'text-red-600' : 'text-neutral-900'
                  }`}
                >
                  {formatTime(timeLeft)}
                </div>
                <div
                  className={`text-xs font-medium ${isUrgent ? 'text-red-500' : 'text-neutral-500'}`}
                >
                  remaining
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Question text */}
        <h2 className="text-xl font-semibold text-neutral-900 text-center leading-relaxed">
          {question.text}
        </h2>

        {/* Status indicators */}
        {isFacilitator && status === 'answering' && (
          <div className="mt-6 flex justify-center">
            <div className="badge badge-live">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
              </span>
              <span>
                {answeredCount} of {totalCount} answered
              </span>
            </div>
          </div>
        )}

        {status === 'revealed' && (
          <div className="mt-6 flex justify-center">
            <div className="badge badge-complete">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
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
              <span>Answers Revealed</span>
            </div>
          </div>
        )}

        {/* Question options indicator */}
        {question.allowMultipleAnswers && status !== 'revealed' && (
          <p className="mt-4 text-sm text-neutral-500 text-center flex items-center justify-center gap-1.5">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
              />
            </svg>
            Multiple answers allowed
          </p>
        )}
      </div>
    </div>
  )
}
