import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'

interface QuestionForm {
  id: string
  text: string
  allowMultipleAnswers: boolean
  timeLimitSeconds: number | null
}

let questionId = 0
const generateQuestionId = () => `question-${++questionId}`

export default function CreateMeeting() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [showParticipantNames, setShowParticipantNames] = useState(true)
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { id: generateQuestionId(), text: '', allowMultipleAnswers: false, timeLimitSeconds: null }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: generateQuestionId(), text: '', allowMultipleAnswers: false, timeLimitSeconds: null }
    ])
  }

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id))
    }
  }

  const updateQuestion = (
    id: string,
    field: keyof QuestionForm,
    value: string | boolean | number | null
  ) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Please enter a meeting title')
      return
    }

    const validQuestions = questions.filter((q) => q.text.trim())
    if (validQuestions.length === 0) {
      setError('Please add at least one question')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          showParticipantNames,
          questions: validQuestions.map(({ text, allowMultipleAnswers, timeLimitSeconds }) => ({
            text,
            allowMultipleAnswers,
            timeLimitSeconds
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create meeting')
      }

      const data = await response.json()
      navigate(`/facilitate/${data.facilitatorCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
          &larr; Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create a Meeting</h1>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="e.g., Sprint Retrospective"
              />
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="showNames"
                checked={showParticipantNames}
                onChange={(e) => setShowParticipantNames(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="showNames" className="ml-2 text-sm text-gray-700">
                Show participant names with answers
              </label>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Questions</label>
              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div key={question.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex gap-2 mb-3">
                      <span className="text-sm font-medium text-gray-500 mt-2">{index + 1}.</span>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                        className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        placeholder="Enter your question"
                      />
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(question.id)}
                          className="text-red-500 hover:text-red-700 px-2"
                        >
                          Remove
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-4 ml-6">
                      <label className="flex items-center text-sm text-gray-600">
                        <input
                          type="checkbox"
                          checked={question.allowMultipleAnswers}
                          onChange={(e) =>
                            updateQuestion(question.id, 'allowMultipleAnswers', e.target.checked)
                          }
                          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded mr-2"
                        />
                        Allow multiple answers
                      </label>

                      <div className="flex items-center text-sm text-gray-600">
                        <label className="mr-2">Time limit:</label>
                        <select
                          value={question.timeLimitSeconds || ''}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            updateQuestion(
                              question.id,
                              'timeLimitSeconds',
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        >
                          <option value="">No limit</option>
                          <option value="30">30 seconds</option>
                          <option value="60">1 minute</option>
                          <option value="120">2 minutes</option>
                          <option value="300">5 minutes</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={addQuestion}
                className="mt-4 text-indigo-600 hover:text-indigo-800 font-medium"
              >
                + Add Question
              </button>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isSubmitting ? 'Creating...' : 'Create Meeting'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
