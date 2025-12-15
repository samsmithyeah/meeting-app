import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFacilitatorSocket } from '../hooks/useFacilitatorSocket'
import { useMeeting } from '../hooks/useMeeting'
import QuestionCard from '../components/QuestionCard'
import AnswerReveal from '../components/AnswerReveal'
import QRCodeDisplay from '../components/QRCodeDisplay'

export default function FacilitatorSession() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const {
    meeting,
    loading,
    error: fetchError,
    setMeeting,
    setError: setFetchError
  } = useMeeting(code, { expectedRole: 'facilitator' })

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const {
    sessionStatus,
    participantCount,
    answeredCount,
    answerCount,
    revealedAnswers,
    summary,
    isLoadingSummary,
    timerEnd,
    error: socketError,
    setError: setSocketError,
    startQuestion,
    revealAnswers,
    nextQuestion,
    endMeeting,
    groupedAnswers,
    isGrouping,
    groupAnswers,
    updateGroup
  } = useFacilitatorSocket(meeting)

  // Sync currentQuestionIndex when meeting loads
  useEffect(() => {
    if (meeting?.currentQuestionIndex !== undefined) {
      setCurrentQuestionIndex(meeting.currentQuestionIndex || 0)
    }
  }, [meeting?.currentQuestionIndex])

  const currentQuestion = meeting?.questions?.[currentQuestionIndex]

  const startMeeting = async () => {
    if (!meeting?.facilitatorCode) return
    try {
      await fetch(`/api/meetings/${meeting.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${meeting.facilitatorCode}`
        }
      })
      setMeeting((prev) => (prev ? { ...prev, status: 'active' } : null))
    } catch {
      setFetchError('Failed to start meeting')
    }
  }

  const handleStartQuestion = () => {
    if (!currentQuestion) return
    startQuestion(currentQuestion.id, currentQuestion.timeLimitSeconds)
  }

  const handleRevealAnswers = () => {
    if (!currentQuestion) return
    revealAnswers(currentQuestion.id)
  }

  const handleNextQuestion = () => {
    if (!meeting?.questions || currentQuestionIndex >= meeting.questions.length - 1) return
    const nextIndex = currentQuestionIndex + 1
    nextQuestion(nextIndex)
    setCurrentQuestionIndex(nextIndex)
  }

  const handleEndMeeting = () => {
    endMeeting()
    navigate('/')
  }

  const handleGroupAnswers = () => {
    if (!currentQuestion) return
    groupAnswers(currentQuestion.id)
  }

  const handleMoveAnswer = (answerId: string, targetGroupId: string | null) => {
    if (!currentQuestion) return
    updateGroup(currentQuestion.id, 'move-answer', { answerId, targetGroupId })
  }

  const handleCreateGroup = (name: string) => {
    if (!currentQuestion) return
    updateGroup(currentQuestion.id, 'create-group', { name })
  }

  const handleRenameGroup = (groupId: string, name: string) => {
    if (!currentQuestion) return
    updateGroup(currentQuestion.id, 'rename-group', { groupId, name })
  }

  const handleDeleteGroup = (groupId: string) => {
    if (!currentQuestion) return
    updateGroup(currentQuestion.id, 'delete-group', { groupId })
  }

  const copyJoinLink = () => {
    if (!meeting) return
    const link = `${window.location.origin}/join/${meeting.participantCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-coral-200 border-t-coral-500 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-neutral-500 font-medium">Loading meeting...</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
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
          <h2 className="text-xl font-bold text-neutral-900 mb-2">Something went wrong</h2>
          <p className="text-neutral-500">{fetchError}</p>
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
          <p className="text-neutral-500">
            This meeting may have been deleted or the link is invalid.
          </p>
        </div>
      </div>
    )
  }

  const isLastQuestion = meeting.questions
    ? currentQuestionIndex >= meeting.questions.length - 1
    : true

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Dismissible error notification */}
      {socketError && (
        <div className="fixed top-4 right-4 z-50 max-w-md card p-4 border-red-200 bg-red-50 animate-fade-in-down">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center flex-shrink-0">
              <svg
                className="w-4 h-4 text-red-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800">{socketError}</p>
            </div>
            <button
              onClick={() => setSocketError('')}
              className="text-red-400 hover:text-red-600 transition-colors"
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
          </div>
        </div>
      )}

      {/* Header */}
      <header className="bg-white border-b border-neutral-100 sticky top-0 z-40">
        <div className="max-w-5xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-gradient-to-br from-coral-500 to-amber-500 rounded-xl flex items-center justify-center shadow-sm">
                <svg
                  className="w-5 h-5 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-bold text-neutral-900">{meeting.title}</h1>
                <p className="text-sm text-neutral-500">Facilitator View</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Participant count */}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-full">
                <div className="relative">
                  <div className="w-2 h-2 bg-green-500 rounded-full" />
                  <div className="absolute inset-0 w-2 h-2 bg-green-500 rounded-full animate-ping" />
                </div>
                <span className="text-sm font-medium text-neutral-700">
                  {participantCount} participant{participantCount !== 1 ? 's' : ''}
                </span>
              </div>

              {/* Share button */}
              <button
                onClick={copyJoinLink}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl font-medium text-sm transition-all ${
                  copied
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-700'
                }`}
              >
                {copied ? (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    Copied!
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
                      />
                    </svg>
                    Share: {meeting.participantCode}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Meeting not started */}
        {meeting.status === 'draft' && (
          <div className="card p-8 text-center max-w-2xl mx-auto animate-fade-in-up">
            <div className="mb-6">
              <div className="w-20 h-20 bg-gradient-to-br from-coral-100 to-amber-100 rounded-3xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-10 h-10 text-coral-600"
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
              </div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Ready to Start?</h2>
              <p className="text-neutral-500">Share the code below for participants to join</p>
            </div>

            <QRCodeDisplay
              url={`${window.location.origin}/join/${meeting.participantCode}`}
              participantCode={meeting.participantCode}
            />

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={copyJoinLink} className="btn-secondary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copy Join Link
              </button>
              <button onClick={startMeeting} className="btn-primary">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Start Meeting
              </button>
            </div>
          </div>
        )}

        {/* Active meeting */}
        {meeting.status === 'active' && currentQuestion && (
          <div className="space-y-6 animate-fade-in">
            {/* Progress bar */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-neutral-600">
                Question {currentQuestionIndex + 1} of {meeting.questions?.length || 0}
              </span>
              <div className="flex gap-1.5">
                {meeting.questions?.map((_, i) => (
                  <div
                    key={i}
                    className={`h-2 rounded-full transition-all duration-300 ${
                      i < currentQuestionIndex
                        ? 'w-8 bg-green-500'
                        : i === currentQuestionIndex
                          ? 'w-8 bg-gradient-to-r from-coral-500 to-amber-500'
                          : 'w-8 bg-neutral-200'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question card */}
            <QuestionCard
              question={currentQuestion}
              status={sessionStatus}
              answeredCount={answeredCount}
              totalCount={participantCount}
              timerEnd={timerEnd}
              isFacilitator={true}
            />

            {/* Placeholder cards while answering */}
            {sessionStatus === 'answering' && answerCount > 0 && (
              <div className="card p-6 animate-fade-in-up">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-neutral-900">Answers Received</h3>
                  <span className="badge badge-live">
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                    </span>
                    Live
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                  {Array.from({ length: answerCount }).map((_, i) => (
                    <div
                      key={i}
                      className="h-20 bg-gradient-to-br from-coral-50 to-amber-50 border border-coral-100 rounded-xl flex items-center justify-center shimmer"
                      style={{ animationDelay: `${i * 100}ms` }}
                    >
                      <svg
                        className="w-6 h-6 text-coral-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Revealed Answers */}
            {sessionStatus === 'revealed' && revealedAnswers && (
              <AnswerReveal
                answers={revealedAnswers}
                summary={summary}
                isLoadingSummary={isLoadingSummary}
                showNames={meeting.showParticipantNames ?? true}
                groupedAnswers={groupedAnswers}
                isGrouping={isGrouping}
                isFacilitator={true}
                onGroupAnswers={handleGroupAnswers}
                onMoveAnswer={handleMoveAnswer}
                onCreateGroup={handleCreateGroup}
                onRenameGroup={handleRenameGroup}
                onDeleteGroup={handleDeleteGroup}
              />
            )}

            {/* Controls */}
            <div className="flex justify-center gap-4 pt-4">
              {sessionStatus === 'waiting' && (
                <button
                  onClick={handleStartQuestion}
                  disabled={participantCount === 0}
                  className="btn-primary px-8"
                >
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                  </svg>
                  Start Question
                </button>
              )}

              {sessionStatus === 'answering' && (
                <button
                  onClick={handleRevealAnswers}
                  className="btn-primary px-8 bg-gradient-to-r from-green-500 to-emerald-500 shadow-green-500/25 hover:shadow-green-500/30"
                >
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
                  Reveal Answers ({answeredCount}/{participantCount})
                </button>
              )}

              {sessionStatus === 'revealed' && (
                <>
                  {!isLastQuestion ? (
                    <button onClick={handleNextQuestion} className="btn-primary px-8">
                      Next Question
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
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </button>
                  ) : (
                    <button onClick={handleEndMeeting} className="btn-secondary px-8">
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      End Meeting
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
