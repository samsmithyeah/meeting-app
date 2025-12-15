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
    <div className="surface p-6 sm:p-8">
      {/* Timer */}
      {timeLeft !== null && status === 'answering' && (
        <div
          className={`mb-5 rounded-2xl border p-4 text-center shadow-inset ${
            timeLeft <= 10
              ? 'border-danger/25 bg-danger/5 text-danger'
              : 'border-stroke/70 bg-surface2/70 text-muted'
          }`}
        >
          <div className="text-3xl font-mono font-semibold tracking-tight">
            {formatTime(timeLeft)}
          </div>
          <div className="mt-1 text-xs font-semibold uppercase tracking-widest">remaining</div>
        </div>
      )}

      {/* Question */}
      <div className="text-center">
        <h2 className="text-balance text-xl sm:text-2xl font-semibold tracking-tight text-ink">
          {question.text}
        </h2>
      </div>

      {/* Status indicators */}
      {isFacilitator && status === 'answering' && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-stroke/70 bg-surface2/70 px-4 py-2 text-ink shadow-inset">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent/70 opacity-60"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-accent"></span>
            </span>
            <span className="font-semibold">
              {answeredCount} of {totalCount} answered
            </span>
          </div>
        </div>
      )}

      {status === 'revealed' && (
        <div className="mt-4 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-success/25 bg-success/10 px-4 py-2 text-success shadow-inset">
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
            <span className="font-semibold">Answers revealed</span>
          </span>
        </div>
      )}

      {/* Question options indicator */}
      {question.allowMultipleAnswers && status !== 'revealed' && (
        <p className="mt-3 text-sm text-muted text-center">Multiple answers allowed</p>
      )}
    </div>
  )
}
