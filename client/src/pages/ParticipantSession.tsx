import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useParticipantSocket } from '../hooks/useParticipantSocket'
import { useMeeting } from '../hooks/useMeeting'
import QuestionCard from '../components/QuestionCard'
import AnswerInput from '../components/AnswerInput'
import AnswerReveal from '../components/AnswerReveal'

export default function ParticipantSession() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [participantName, setParticipantName] = useState('')

  // Get participant name from session storage
  useEffect(() => {
    const name = sessionStorage.getItem('participantName')
    if (!name) {
      navigate(`/join/${code}`)
      return
    }
    setParticipantName(name)
  }, [code, navigate])

  const {
    meeting,
    loading,
    error: fetchError
  } = useMeeting(code, { expectedRole: 'participant', waitFor: !!participantName })

  const {
    sessionStatus,
    currentQuestion,
    myAnswers,
    revealedAnswers,
    timerEnd,
    answeredCount,
    totalCount,
    error: socketError,
    meetingStatus,
    submitAnswer,
    editAnswer,
    deleteAnswer
  } = useParticipantSocket(meeting, participantName)

  const error = fetchError || socketError

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="surface p-8 w-full max-w-md mx-4">
          <div className="skeleton h-5 w-40" />
          <div className="mt-6 space-y-3">
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
            <div className="skeleton h-14 w-full" />
          </div>
          <p className="mt-6 text-sm text-muted">Loading session…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="surface p-8 w-full max-w-md mx-4">
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-2xl bg-danger/10 text-danger flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v4m0 4h.01M10.29 3.86l-7.2 12.47A1.5 1.5 0 004.39 18h15.22a1.5 1.5 0 001.3-2.25l-7.2-12.47a1.5 1.5 0 00-2.6 0z"
                />
              </svg>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-ink">Something went wrong</p>
              <p className="mt-1 text-sm text-muted">{error}</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="surface p-8 w-full max-w-md mx-4">
          <p className="text-sm font-semibold text-ink">Meeting not found</p>
          <p className="mt-1 text-sm text-muted">Double-check the code, then try again.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-stroke/60 bg-surface/70 backdrop-blur">
        <div className="container-app py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-base font-semibold tracking-tight text-ink">
                {meeting.title}
              </h1>
              <p className="truncate text-sm text-muted">Joined as {participantName}</p>
            </div>
            <span className="badge">
              {meetingStatus === 'draft'
                ? 'Waiting'
                : sessionStatus === 'answering'
                  ? 'Answering'
                  : sessionStatus === 'revealed'
                    ? 'Revealed'
                    : 'Ready'}
            </span>
          </div>
        </div>
      </header>

      <main className="container-app max-w-2xl py-6 sm:py-8">
        {/* Waiting for meeting to start */}
        {meetingStatus === 'draft' && (
          <div className="surface p-8 text-center animate-fade-up">
            <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-accent/10 text-accent flex items-center justify-center">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">
              Waiting for the facilitator…
            </h2>
            <p className="mt-2 text-sm text-muted">
              You’re connected. The meeting will begin shortly.
            </p>
          </div>
        )}

        {/* Meeting active - waiting for question */}
        {meetingStatus === 'active' && sessionStatus === 'waiting' && !currentQuestion && (
          <div className="surface p-8 text-center animate-fade-up">
            <div className="mx-auto mb-5 h-14 w-14 rounded-2xl bg-success/10 text-success flex items-center justify-center">
              <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-xl font-semibold tracking-tight text-ink">You’re in.</h2>
            <p className="mt-2 text-sm text-muted">Waiting for the next question.</p>
          </div>
        )}

        {/* Answering question */}
        {sessionStatus === 'answering' && currentQuestion && (
          <div className="space-y-4">
            <QuestionCard
              question={currentQuestion}
              status={sessionStatus}
              timerEnd={timerEnd}
              isFacilitator={false}
            />

            <AnswerInput
              allowMultiple={currentQuestion.allowMultipleAnswers ?? false}
              myAnswers={myAnswers}
              onSubmit={submitAnswer}
              onEdit={editAnswer}
              onDelete={deleteAnswer}
            />

            {myAnswers.length > 0 && (
              <div className="text-center text-sm text-muted">
                {answeredCount}/{totalCount} participants have answered
              </div>
            )}
          </div>
        )}

        {/* Answers revealed */}
        {sessionStatus === 'revealed' && revealedAnswers && (
          <div className="space-y-4">
            {currentQuestion && (
              <QuestionCard
                question={currentQuestion}
                status={sessionStatus}
                isFacilitator={false}
              />
            )}
            <AnswerReveal
              answers={revealedAnswers}
              showNames={meeting.showParticipantNames ?? true}
              isFacilitator={false}
            />
            <div className="rounded-3xl border border-stroke/70 bg-surface2/70 p-5 text-center shadow-inset">
              <p className="text-sm font-semibold text-ink">Waiting for the facilitator…</p>
              <p className="mt-1 text-sm text-muted">Next question will appear automatically.</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
