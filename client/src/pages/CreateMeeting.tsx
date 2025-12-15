import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'

interface QuestionForm {
  id: string
  text: string
  allowMultipleAnswers: boolean
  timeLimitSeconds: number | null
}

const generateQuestionId = () => crypto.randomUUID()

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
    <div className="min-h-screen bg-gradient-subtle py-8 px-4">
      <div className="max-w-2xl mx-auto">
        {/* Back link */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-neutral-600 hover:text-coral-600 font-medium mb-6 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
          Back to Home
        </Link>

        {/* Main card */}
        <div className="card p-8 animate-fade-in-up">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-gradient-to-br from-coral-500 to-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-coral-500/30">
              <svg
                className="w-7 h-7 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">Create a Meeting</h1>
              <p className="text-neutral-500">Set up your questions and start collaborating</p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 animate-fade-in-down">
              <svg
                className="w-5 h-5 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Meeting title */}
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-neutral-700 mb-2">
                Meeting Title
              </label>
              <input
                type="text"
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="input-field"
                placeholder="e.g., Sprint Retrospective"
              />
            </div>

            {/* Show names toggle */}
            <div className="flex items-center justify-between p-4 bg-neutral-50 rounded-xl border border-neutral-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                  <svg
                    className="w-5 h-5 text-neutral-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-neutral-900">Show participant names</p>
                  <p className="text-sm text-neutral-500">Names will appear with their answers</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowParticipantNames(!showParticipantNames)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  showParticipantNames ? 'bg-coral-500' : 'bg-neutral-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform ${
                    showParticipantNames ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Questions section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <label className="block text-sm font-semibold text-neutral-700">Questions</label>
                <span className="text-sm text-neutral-500">
                  {questions.length} question{questions.length !== 1 ? 's' : ''}
                </span>
              </div>

              <div className="space-y-4">
                {questions.map((question, index) => (
                  <div
                    key={question.id}
                    className="p-5 bg-neutral-50 rounded-xl border border-neutral-100 transition-all hover:border-neutral-200"
                  >
                    {/* Question header */}
                    <div className="flex items-start gap-3 mb-4">
                      <span className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-coral-500 to-amber-500 rounded-lg flex items-center justify-center text-white text-sm font-bold">
                        {index + 1}
                      </span>
                      <input
                        type="text"
                        value={question.text}
                        onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                        className="flex-1 input-field py-2"
                        placeholder="Enter your question"
                      />
                      {questions.length > 1 && (
                        <button
                          type="button"
                          onClick={() => removeQuestion(question.id)}
                          className="flex-shrink-0 p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                          title="Remove question"
                        >
                          <svg
                            className="w-5 h-5"
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
                      )}
                    </div>

                    {/* Question options */}
                    <div className="flex flex-wrap gap-4 ml-11">
                      <label className="flex items-center gap-2 text-sm text-neutral-600 cursor-pointer group">
                        <input
                          type="checkbox"
                          checked={question.allowMultipleAnswers}
                          onChange={(e) =>
                            updateQuestion(question.id, 'allowMultipleAnswers', e.target.checked)
                          }
                          className="w-4 h-4 rounded border-neutral-300 text-coral-500 focus:ring-coral-500 focus:ring-offset-0"
                        />
                        <span className="group-hover:text-neutral-900 transition-colors">
                          Allow multiple answers
                        </span>
                      </label>

                      <div className="flex items-center gap-2 text-sm text-neutral-600">
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
                            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                        <select
                          value={question.timeLimitSeconds || ''}
                          onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                            updateQuestion(
                              question.id,
                              'timeLimitSeconds',
                              e.target.value ? parseInt(e.target.value) : null
                            )
                          }
                          className="px-3 py-1.5 bg-white border border-neutral-200 rounded-lg text-sm focus:border-coral-400 focus:ring-2 focus:ring-coral-500/10 transition-all"
                        >
                          <option value="">No time limit</option>
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

              {/* Add question button */}
              <button
                type="button"
                onClick={addQuestion}
                className="mt-4 w-full py-3 border-2 border-dashed border-neutral-200 rounded-xl text-neutral-500 hover:border-coral-300 hover:text-coral-600 hover:bg-coral-50 transition-all flex items-center justify-center gap-2 font-medium"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Add Question
              </button>
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full py-4 text-lg"
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
                  Creating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Create Meeting
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
