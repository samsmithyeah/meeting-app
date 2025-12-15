import { useState, type FormEvent } from 'react'
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

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!newAnswer.trim()) return

    setIsSubmitting(true)
    onSubmit(newAnswer.trim())
    setNewAnswer('')
    // Reset submitting state after a brief delay
    setTimeout(() => setIsSubmitting(false), 300)
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
    onEdit(editingId, editText.trim())
    setEditingId(null)
    setEditText('')
  }

  const handleDelete = (answerId: string) => {
    onDelete(answerId)
  }

  const canAddMore = allowMultiple || myAnswers.length === 0

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 space-y-4">
      {/* Submitted Answers */}
      {myAnswers.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">
            Your {myAnswers.length === 1 ? 'Answer' : 'Answers'}
          </h4>
          {myAnswers.map((answer) => (
            <div key={answer.id} className="p-3 bg-green-50 border border-green-200 rounded-lg">
              {editingId === answer.id ? (
                <div className="space-y-2">
                  <textarea
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                    rows={3}
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <button
                      type="button"
                      onClick={cancelEditing}
                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      disabled={!editText.trim()}
                      className="px-3 py-1.5 text-sm bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white rounded-lg"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <p className="flex-1 text-gray-800">{answer.text}</p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => startEditing(answer.id, answer.text)}
                      className="p-1.5 text-gray-500 hover:text-indigo-600 rounded"
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
                      className="p-1.5 text-gray-500 hover:text-red-600 rounded"
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
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
            rows={3}
            disabled={isSubmitting}
          />
          <button
            type="submit"
            disabled={!newAnswer.trim() || isSubmitting}
            className="mt-3 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
          >
            {isSubmitting ? 'Adding...' : myAnswers.length > 0 ? 'Add Answer' : 'Submit Answer'}
          </button>
        </form>
      )}

      {/* Message when can't add more */}
      {!canAddMore && (
        <p className="text-sm text-gray-500 text-center py-2">
          Only one answer allowed for this question
        </p>
      )}
    </div>
  )
}
