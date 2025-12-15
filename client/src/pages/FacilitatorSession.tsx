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
      <div className="min-h-screen flex items-center justify-center">
        <div className="surface p-8 w-full max-w-lg mx-4">
          <div className="skeleton h-5 w-52" />
          <div className="mt-6 grid grid-cols-2 gap-3">
            <div className="skeleton h-20" />
            <div className="skeleton h-20" />
            <div className="skeleton h-20" />
            <div className="skeleton h-20" />
          </div>
          <p className="mt-6 text-sm text-muted">Loading facilitator view…</p>
        </div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="surface p-8 w-full max-w-md mx-4">
          <p className="text-sm font-semibold text-ink">Unable to load meeting</p>
          <p className="mt-1 text-sm text-muted">{fetchError}</p>
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

  const isLastQuestion = meeting.questions
    ? currentQuestionIndex >= meeting.questions.length - 1
    : true

  return (
    <div className="min-h-screen">
      {/* Dismissible error notification */}
      {socketError && (
        <div className="fixed top-4 right-4 z-50 max-w-md toast border-danger/20 bg-danger/5 text-danger">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{socketError}</p>
            </div>
            <button
              onClick={() => setSocketError('')}
              className="btn-ghost px-2 py-2 text-danger hover:bg-danger/10"
              aria-label="Dismiss error"
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
      <header className="sticky top-0 z-40 border-b border-stroke/60 bg-surface/70 backdrop-blur">
        <div className="container-app py-4">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h1 className="truncate text-base sm:text-lg font-semibold tracking-tight text-ink">
                {meeting.title}
              </h1>
              <p className="text-sm text-muted">Facilitator view</p>
            </div>

            <div className="flex items-center gap-3">
              <span className="badge">
                {participantCount} {participantCount === 1 ? 'participant' : 'participants'}
              </span>
              <button onClick={copyJoinLink} className="btn-secondary px-3 py-2">
                <span className="font-mono tracking-widest">{meeting.participantCode}</span>
                <span className="text-muted">{copied ? 'Copied' : 'Share'}</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="container-app py-6 sm:py-8">
        {/* Meeting not started */}
        {meeting.status === 'draft' && (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            <div className="lg:col-span-5">
              <div className="surface p-6 sm:p-8">
                <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
                  Ready to start?
                </h2>
                <p className="mt-2 text-sm text-muted">
                  Participants can scan the QR code or join with the code below.
                </p>

                <div className="mt-6 space-y-3">
                  <div className="rounded-2xl border border-stroke/70 bg-surface2/70 p-4 shadow-inset">
                    <p className="text-xs font-semibold text-muted">Join link</p>
                    <p className="mt-1 text-sm text-ink/90 break-all">
                      {window.location.origin}/join/{meeting.participantCode}
                    </p>
                    <button onClick={copyJoinLink} className="btn-secondary mt-3 w-full">
                      {copied ? 'Copied' : 'Copy join link'}
                    </button>
                  </div>

                  <div className="rounded-2xl border border-stroke/70 bg-gradient-to-br from-accent/10 via-surface2/70 to-accent2/10 p-4 shadow-inset">
                    <p className="text-xs font-semibold text-muted">Room code</p>
                    <p className="mt-1 font-mono text-3xl font-semibold tracking-[0.25em] text-ink">
                      {meeting.participantCode}
                    </p>
                  </div>
                </div>

                <button onClick={startMeeting} className="btn-primary mt-6 w-full py-3">
                  Start meeting
                </button>
              </div>
            </div>

            <div className="lg:col-span-7">
              <div className="surface p-6 sm:p-8">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold text-ink">Projectable QR</p>
                    <p className="mt-1 text-sm text-muted">Click to enlarge for screens.</p>
                  </div>
                  <span className="badge">Scan to join</span>
                </div>
                <QRCodeDisplay
                  url={`${window.location.origin}/join/${meeting.participantCode}`}
                  participantCode={meeting.participantCode}
                />
              </div>
            </div>
          </div>
        )}

        {/* Active meeting */}
        {meeting.status === 'active' && currentQuestion && (
          <div className="grid gap-6 lg:grid-cols-12 items-start">
            <aside className="lg:col-span-4 space-y-4 lg:sticky lg:top-24">
              <div className="surface p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-sm font-semibold text-ink">Run of show</p>
                  <span className="badge">
                    Q {currentQuestionIndex + 1}/{meeting.questions?.length || 0}
                  </span>
                </div>

                <div className="mt-4 flex gap-1.5">
                  {meeting.questions?.map((_, i) => (
                    <div
                      key={i}
                      className={`h-1.5 flex-1 rounded-full transition-colors ${
                        i < currentQuestionIndex
                          ? 'bg-success/70'
                          : i === currentQuestionIndex
                            ? 'bg-accent/80'
                            : 'bg-stroke/80'
                      }`}
                    />
                  ))}
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-stroke/70 bg-surface2/70 p-3 shadow-inset">
                    <p className="text-xs font-semibold text-muted">Participants</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                      {participantCount}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-stroke/70 bg-surface2/70 p-3 shadow-inset">
                    <p className="text-xs font-semibold text-muted">Answered</p>
                    <p className="mt-1 text-lg font-semibold tracking-tight text-ink">
                      {answeredCount}/{participantCount}
                    </p>
                  </div>
                </div>

                <div className="mt-5 space-y-2">
                  {sessionStatus === 'waiting' && (
                    <button
                      onClick={handleStartQuestion}
                      disabled={participantCount === 0}
                      className="btn-primary w-full py-3"
                    >
                      Start question
                    </button>
                  )}

                  {sessionStatus === 'answering' && (
                    <button
                      onClick={handleRevealAnswers}
                      className="btn w-full py-3 bg-success text-white hover:bg-success/90 shadow-card"
                    >
                      Reveal answers
                      <span className="font-mono text-white/90">
                        {answeredCount}/{participantCount}
                      </span>
                    </button>
                  )}

                  {sessionStatus === 'revealed' && (
                    <>
                      {!isLastQuestion ? (
                        <button onClick={handleNextQuestion} className="btn-primary w-full py-3">
                          Next question
                        </button>
                      ) : (
                        <button onClick={handleEndMeeting} className="btn-danger w-full py-3">
                          End meeting
                        </button>
                      )}
                    </>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-stroke/70 bg-surface2/70 p-4 shadow-inset">
                  <p className="text-xs font-semibold text-muted">Share</p>
                  <div className="mt-2 flex items-center gap-2">
                    <span className="pill font-mono tracking-widest">
                      {meeting.participantCode}
                    </span>
                    <button onClick={copyJoinLink} className="btn-secondary px-3 py-2">
                      {copied ? 'Copied' : 'Copy link'}
                    </button>
                  </div>
                </div>
              </div>
            </aside>

            <div className="lg:col-span-8 space-y-5">
              <QuestionCard
                question={currentQuestion}
                status={sessionStatus}
                answeredCount={answeredCount}
                totalCount={participantCount}
                timerEnd={timerEnd}
                isFacilitator={true}
              />

              {sessionStatus === 'answering' && answerCount > 0 && (
                <div className="surface p-6">
                  <div className="flex items-center justify-between gap-4">
                    <h3 className="text-sm font-semibold text-ink">Responses coming in</h3>
                    <span className="badge">{answerCount}</span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {Array.from({ length: answerCount }).map((_, i) => (
                      <div
                        key={i}
                        className="h-16 rounded-2xl border border-stroke/70 bg-gradient-to-br from-accent/10 via-surface2/70 to-accent2/10 flex items-center justify-center"
                      >
                        <svg
                          className="w-6 h-6 text-muted/60 animate-soft-pulse"
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
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
