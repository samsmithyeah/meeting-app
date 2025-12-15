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
    <div className="min-h-screen">
      <div className="container-app py-8 sm:py-10">
        <div className="flex items-center justify-between gap-4">
          <Link to="/" className="btn-ghost px-3">
            <span aria-hidden>&larr;</span> Home
          </Link>
          <span className="badge">Setup</span>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <div className="surface p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
                    Create a meeting
                  </h1>
                  <p className="mt-1 text-sm text-muted">
                    Build your prompt list, then share a join code with the room.
                  </p>
                </div>
              </div>

              {error && (
                <div className="mt-6 toast border-danger/20 bg-danger/5 text-danger">
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-6 space-y-6">
                <section className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-semibold text-ink">
                      Meeting title
                    </label>
                    <p className="mt-1 text-sm text-muted">
                      Shown to participants at the top of the session.
                    </p>
                    <input
                      type="text"
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="input mt-2"
                      placeholder="e.g., Sprint Retrospective"
                      autoComplete="off"
                    />
                  </div>

                  <label className="flex items-center gap-3 rounded-2xl border border-stroke/70 bg-surface2/70 px-4 py-3 shadow-inset">
                    <input
                      type="checkbox"
                      id="showNames"
                      checked={showParticipantNames}
                      onChange={(e) => setShowParticipantNames(e.target.checked)}
                      className="h-4 w-4 accent-accent"
                    />
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink">Show participant names</p>
                      <p className="text-xs text-muted">
                        Toggle whether names appear under responses.
                      </p>
                    </div>
                  </label>
                </section>

                <div className="divider" />

                <section className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-sm font-semibold text-ink">Questions</h2>
                      <p className="mt-1 text-sm text-muted">
                        Participants respond one question at a time.
                      </p>
                    </div>
                    <button type="button" onClick={addQuestion} className="btn-secondary px-3 py-2">
                      <svg
                        className="h-4 w-4"
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
                      Add
                    </button>
                  </div>

                  <div className="space-y-4">
                    {questions.map((question, index) => (
                      <div
                        key={question.id}
                        className="rounded-3xl border border-stroke/70 bg-surface2/70 p-4 sm:p-5 shadow-inset"
                      >
                        <div className="flex items-start gap-3">
                          <span className="badge mt-1">{index + 1}</span>
                          <div className="flex-1">
                            <input
                              type="text"
                              value={question.text}
                              onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                              className="input"
                              placeholder="Write the question you’ll ask the group…"
                              autoComplete="off"
                            />

                            <div className="mt-3 flex flex-wrap items-center gap-4">
                              <label className="flex items-center gap-2 text-sm text-muted">
                                <input
                                  type="checkbox"
                                  checked={question.allowMultipleAnswers}
                                  onChange={(e) =>
                                    updateQuestion(
                                      question.id,
                                      'allowMultipleAnswers',
                                      e.target.checked
                                    )
                                  }
                                  className="h-4 w-4 accent-accent"
                                />
                                Allow multiple answers
                              </label>

                              <div className="flex items-center gap-2 text-sm text-muted">
                                <span className="whitespace-nowrap">Time limit</span>
                                <select
                                  value={question.timeLimitSeconds || ''}
                                  onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                    updateQuestion(
                                      question.id,
                                      'timeLimitSeconds',
                                      e.target.value ? parseInt(e.target.value) : null
                                    )
                                  }
                                  className="select"
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

                          {questions.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeQuestion(question.id)}
                              className="btn-ghost px-2 py-2 text-danger hover:bg-danger/10"
                              aria-label="Remove question"
                              title="Remove"
                            >
                              <svg
                                className="h-5 w-5"
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
                      </div>
                    ))}
                  </div>
                </section>

                <button type="submit" disabled={isSubmitting} className="btn-primary w-full py-3">
                  {isSubmitting ? 'Creating…' : 'Create meeting'}
                </button>
              </form>
            </div>
          </div>

          <aside className="lg:col-span-5">
            <div className="surface p-6 sm:p-8 lg:sticky lg:top-6">
              <h2 className="text-sm font-semibold text-ink">Meeting outline</h2>
              <p className="mt-1 text-sm text-muted">
                A quick preview of what the room will experience.
              </p>

              <div className="mt-5 space-y-3">
                <div className="rounded-2xl border border-stroke/70 bg-surface2/70 p-4 shadow-inset">
                  <p className="text-xs font-semibold text-muted">Title</p>
                  <p className="mt-1 text-sm font-semibold text-ink">
                    {title.trim() ? title.trim() : 'Untitled meeting'}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-2xl border border-stroke/70 bg-surface2/70 p-4 shadow-inset">
                  <div>
                    <p className="text-xs font-semibold text-muted">Participant names</p>
                    <p className="mt-1 text-sm font-semibold text-ink">
                      {showParticipantNames ? 'Shown' : 'Hidden'}
                    </p>
                  </div>
                  <span className={`badge ${showParticipantNames ? 'text-success' : ''}`}>
                    {showParticipantNames ? 'On' : 'Off'}
                  </span>
                </div>

                <div className="rounded-2xl border border-stroke/70 bg-surface2/70 p-4 shadow-inset">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-muted">Questions</p>
                    <span className="badge">{questions.length}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {questions.slice(0, 6).map((q, i) => (
                      <div key={q.id} className="flex items-start gap-2">
                        <span className="badge mt-0.5">{i + 1}</span>
                        <p className="text-sm text-ink/90">
                          {q.text.trim() ? q.text.trim() : 'Untitled question'}
                        </p>
                      </div>
                    ))}
                    {questions.length > 6 && (
                      <p className="text-xs text-muted">+{questions.length - 6} more</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border border-stroke/70 bg-gradient-to-br from-accent/10 via-surface2/70 to-accent2/10 p-4 shadow-inset">
                  <p className="text-sm font-semibold text-ink">Tip</p>
                  <p className="mt-1 text-sm text-muted">
                    Keep questions short and specific; participants reply faster and with more
                    confidence.
                  </p>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}
