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
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-coral-200 border-t-coral-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 font-medium">Joining meeting...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="card p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-500"
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
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Connection Error</h2>
          <p className="text-neutral-500">{error}</p>
        </div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="card p-8 max-w-md text-center">
          <div className="w-16 h-16 bg-neutral-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-neutral-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Meeting not found</h2>
          <p className="text-neutral-500">This meeting may have ended or the link is invalid.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-lg mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-gradient-to-br from-coral-500 to-amber-500 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {participantName.charAt(0).toUpperCase()}
                </span>
              </div>
              <div>
                <h1 className="font-bold text-neutral-900">{meeting.title}</h1>
                <p className="text-sm text-neutral-500">Joined as {participantName}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Waiting for meeting to start */}
        {meetingStatus === 'draft' && (
          <div className="card p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-gradient-to-br from-coral-100 to-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-coral-500 animate-pulse"
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
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">
              Waiting for meeting to start
            </h2>
            <p className="text-neutral-500">The facilitator will begin shortly</p>

            {/* Subtle loading indicator */}
            <div className="mt-8 flex justify-center gap-1">
              <div className="w-2 h-2 bg-coral-400 rounded-full animate-bounce-subtle" />
              <div className="w-2 h-2 bg-coral-400 rounded-full animate-bounce-subtle animation-delay-150" />
              <div className="w-2 h-2 bg-coral-400 rounded-full animate-bounce-subtle animation-delay-300" />
            </div>
          </div>
        )}

        {/* Meeting active - waiting for question */}
        {meetingStatus === 'active' && sessionStatus === 'waiting' && !currentQuestion && (
          <div className="card p-8 text-center animate-fade-in-up">
            <div className="w-20 h-20 bg-gradient-to-br from-green-100 to-emerald-100 rounded-3xl flex items-center justify-center mx-auto mb-6">
              <svg
                className="w-10 h-10 text-green-500"
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
            </div>
            <h2 className="text-xl font-bold text-neutral-900 mb-2">You're in!</h2>
            <p className="text-neutral-500">Waiting for the next question...</p>

            {/* Subtle loading indicator */}
            <div className="mt-8 flex justify-center gap-1">
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce-subtle" />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce-subtle animation-delay-150" />
              <div className="w-2 h-2 bg-green-400 rounded-full animate-bounce-subtle animation-delay-300" />
            </div>
          </div>
        )}

        {/* Answering question */}
        {sessionStatus === 'answering' && currentQuestion && (
          <div className="space-y-4 animate-fade-in">
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
              <div className="text-center">
                <span className="badge badge-waiting">
                  <svg
                    className="w-3.5 h-3.5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                  {answeredCount}/{totalCount} answered
                </span>
              </div>
            )}
          </div>
        )}

        {/* Answers revealed */}
        {sessionStatus === 'revealed' && revealedAnswers && (
          <div className="space-y-4 animate-fade-in">
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
            <div className="card p-4 bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-100 text-center">
              <p className="text-violet-700 font-medium flex items-center justify-center gap-2">
                <svg
                  className="w-5 h-5 animate-pulse"
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
                Waiting for facilitator to continue...
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
