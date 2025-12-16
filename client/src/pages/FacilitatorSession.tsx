import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFacilitatorSocket } from '../hooks/useFacilitatorSocket'
import { useMeeting } from '../hooks/useMeeting'
import QuestionCard from '../components/QuestionCard'
import AnswerReveal from '../components/AnswerReveal'
import AnswerCard from '../components/AnswerCard'
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
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{fetchError}</div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Meeting not found</div>
      </div>
    )
  }

  const isLastQuestion = meeting.questions
    ? currentQuestionIndex >= meeting.questions.length - 1
    : true

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Dismissible error notification */}
      {socketError && (
        <div className="fixed top-4 right-4 z-50 max-w-md bg-red-50 border border-red-200 rounded-lg shadow-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-1">
              <p className="text-sm text-red-800">{socketError}</p>
            </div>
            <button onClick={() => setSocketError('')} className="text-red-500 hover:text-red-700">
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
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold text-gray-900">{meeting.title}</h1>
            <p className="text-sm text-gray-500">Facilitator View</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm">
              <span className="font-medium">{participantCount}</span>
              <span className="text-gray-500"> participants</span>
            </div>
            <button
              onClick={copyJoinLink}
              className="bg-gray-100 hover:bg-gray-200 px-3 py-1.5 rounded text-sm font-medium transition-colors"
            >
              {copied ? 'Copied!' : `Share: ${meeting.participantCode}`}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Meeting not started */}
        {meeting.status === 'draft' && (
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Start?</h2>
            <p className="text-gray-600">Scan the QR code or enter the code to join</p>
            <QRCodeDisplay
              url={`${window.location.origin}/join/${meeting.participantCode}`}
              participantCode={meeting.participantCode}
            />
            <div className="flex justify-center gap-4">
              <button
                onClick={copyJoinLink}
                className="bg-gray-100 hover:bg-gray-200 px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Copy Join Link
              </button>
              <button
                onClick={startMeeting}
                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                Start Meeting
              </button>
            </div>
          </div>
        )}

        {/* Active meeting */}
        {meeting.status === 'active' && currentQuestion && (
          <div className="space-y-6">
            {/* Progress */}
            <div className="flex items-center justify-between text-sm text-gray-500">
              <span>
                Question {currentQuestionIndex + 1} of {meeting.questions?.length || 0}
              </span>
              <div className="flex gap-1">
                {meeting.questions?.map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-1 rounded ${
                      i < currentQuestionIndex
                        ? 'bg-green-500'
                        : i === currentQuestionIndex
                          ? 'bg-indigo-500'
                          : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Question */}
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
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Answers Received ({answerCount})
                </h3>
                <div className="space-y-3">
                  {Array.from({ length: answerCount }).map((_, i) => (
                    <AnswerCard key={i} revealed={false} />
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
            <div className="flex justify-center gap-4">
              {sessionStatus === 'waiting' && (
                <button
                  onClick={handleStartQuestion}
                  disabled={participantCount === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Start Question
                </button>
              )}

              {sessionStatus === 'answering' && (
                <button
                  onClick={handleRevealAnswers}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Reveal Answers ({answeredCount}/{participantCount})
                </button>
              )}

              {sessionStatus === 'revealed' && (
                <>
                  {!isLastQuestion ? (
                    <button
                      onClick={handleNextQuestion}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={handleEndMeeting}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
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
