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
    <div className="surface p-6 sm:p-8 space-y-4">
      {/* Submitted Answers */}
      {myAnswers.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4">
            <h4 className="text-sm font-semibold text-ink">
              Your {myAnswers.length === 1 ? 'answer' : 'answers'}
            </h4>
            <span className="badge">{myAnswers.length}</span>
          </div>
          {myAnswers.map((answer) => (
            <div
              key={answer.id}
              className="rounded-2xl border border-stroke/70 bg-surface2/70 p-4 shadow-inset transition"
            >
              {editingId === answer.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="textarea resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button type="button" onClick={cancelEditing} className="btn-ghost px-3 py-2">
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={!editText.trim()}
                      className="btn-primary px-4 py-2"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-ink/90">{answer.text}</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEditing(answer.id, answer.text)}
                      className="btn-ghost px-2 py-2"
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
                      className="btn-ghost px-2 py-2 text-danger hover:bg-danger/10"
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
        <form onSubmit={handleSubmit}>
          <textarea
            value={newAnswer}
            onChange={(e) => setNewAnswer(e.target.value)}
            placeholder={myAnswers.length > 0 ? 'Add another answer...' : 'Type your answer...'}
            className="textarea resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!newAnswer.trim() || isSubmitting}
            className="btn-primary mt-3 w-full py-3"
          >
            {isSubmitting ? 'Adding…' : myAnswers.length > 0 ? 'Add answer' : 'Submit answer'}
          </button>
        </form>
      )}

      {/* Message when can't add more */}
      {!canAddMore && (
        <div className="rounded-2xl border border-stroke/70 bg-surface2/70 p-4 text-center shadow-inset">
          <p className="text-sm text-muted">Only one answer is allowed for this question.</p>
        </div>
      )}
    </div>
  )
}
