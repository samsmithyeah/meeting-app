import { useState } from 'react'

export default function AnswerInput({ allowMultiple, onSubmit, timerEnd }) {
  const [answers, setAnswers] = useState([''])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const addAnswer = () => {
    if (allowMultiple) {
      setAnswers([...answers, ''])
    }
  }

  const removeAnswer = (index) => {
    if (answers.length > 1) {
      setAnswers(answers.filter((_, i) => i !== index))
    }
  }

  const updateAnswer = (index, value) => {
    const updated = [...answers]
    updated[index] = value
    setAnswers(updated)
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    const validAnswers = answers.filter((a) => a.trim())
    if (validAnswers.length === 0) return

    setIsSubmitting(true)
    onSubmit(allowMultiple ? validAnswers : validAnswers[0])
  }

  const hasValidAnswer = answers.some((a) => a.trim())

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-6">
      <div className="space-y-3">
        {answers.map((answer, index) => (
          <div key={index} className="flex gap-2">
            <textarea
              value={answer}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder={allowMultiple ? `Answer ${index + 1}` : 'Type your answer...'}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
              rows={3}
              disabled={isSubmitting}
            />
            {allowMultiple && answers.length > 1 && (
              <button
                type="button"
                onClick={() => removeAnswer(index)}
                className="text-gray-400 hover:text-red-500 p-2"
                disabled={isSubmitting}
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        ))}
      </div>

      {allowMultiple && (
        <button
          type="button"
          onClick={addAnswer}
          className="mt-3 text-indigo-600 hover:text-indigo-800 font-medium text-sm"
          disabled={isSubmitting}
        >
          + Add another answer
        </button>
      )}

      <button
        type="submit"
        disabled={!hasValidAnswer || isSubmitting}
        className="mt-4 w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
      >
        {isSubmitting ? 'Submitting...' : 'Submit Answer'}
      </button>
    </form>
  )
}
