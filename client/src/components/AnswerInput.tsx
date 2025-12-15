import { useState, useRef, useEffect, type FormEvent } from 'react'
import type { AnswerInputProps } from '../types'

export default function AnswerInput({
  allowMultiple,
  myAnswers,
  onSubmit,
  onEdit,
  onDelete
}: AnswerInputProps) {
  const [newAnswer, setNewAnswer] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current)
      }
    }
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!newAnswer.trim()) return

    setIsSubmitting(true)
    onSubmit(newAnswer.trim())
    setNewAnswer('')
    // Reset submitting state after a brief delay
    submitTimerRef.current = setTimeout(() => setIsSubmitting(false), 300)
  }

  const startEditing = (answerId: string, text: string) => {
    setEditingId(answerId)
    setEditText(text)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = () => {
    if (!editingId || !editText.trim()) return
    const originalAnswer = myAnswers.find((a) => a.id === editingId)
    // Skip if text hasn't changed
    if (originalAnswer && editText.trim() === originalAnswer.text) {
      setEditingId(null)
      setEditText('')
      return
    }
    onEdit(editingId, editText.trim())
    setEditingId(null)
    setEditText('')
  }

  const handleDelete = (answerId: string) => {
    onDelete(answerId)
  }

  const canAddMore = allowMultiple || myAnswers.length === 0

  return (
    <div className="card p-6 space-y-4">
      {/* Submitted Answers */}
      {myAnswers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-neutral-700 flex items-center gap-2">
            <svg
              className="w-4 h-4 text-green-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
            Your {myAnswers.length === 1 ? 'Answer' : 'Answers'}
          </h4>
          {myAnswers.map((answer) => (
            <div
              key={answer.id}
              className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl transition-all"
            >
              {editingId === answer.id ? (
                <div className="space-y-3">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="textarea-field"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={cancelEditing} className="btn-ghost text-sm">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={!editText.trim()}
                      className="btn-primary text-sm py-2 px-4"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-3">
                  <p className="flex-1 text-neutral-800 leading-relaxed">{answer.text}</p>
                  <div className="flex gap-1 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => startEditing(answer.id, answer.text)}
                      className="p-2 text-neutral-400 hover:text-coral-600 hover:bg-coral-50 rounded-lg transition-colors"
                      title="Edit"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
                        />
                      </svg>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(answer.id)}
                      className="p-2 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Add New Answer Form */}
      {canAddMore && (
        <form onSubmit={handleSubmit} className="space-y-3">
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder={myAnswers.length > 0 ? 'Add another answer...' : 'Type your answer...'}
            className="textarea-field"
            rows={3}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!newAnswer.trim() || isSubmitting}
            className="btn-primary w-full"
          >
            {isSubmitting ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
                {myAnswers.length > 0 ? 'Add Answer' : 'Submit Answer'}
              </>
            )}
          </button>
        </form>
      )}

      {/* Message when can't add more */}
      {!canAddMore && (
        <p className="text-sm text-neutral-500 text-center py-2 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          Only one answer allowed for this question
        </p>
      )}
    </div>
  )
}
