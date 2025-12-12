import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useFacilitatorSocket } from '../hooks/useFacilitatorSocket'
import QuestionCard from '../components/QuestionCard'
import AnswerReveal from '../components/AnswerReveal'
import type { Meeting } from '../types'

export default function FacilitatorSession() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const {
    sessionStatus,
    participantCount,
    answeredCount,
    revealedAnswers,
    summary,
    timerEnd,
    error: socketError,
    startQuestion,
    revealAnswers,
    nextQuestion,
    endMeeting
  } = useFacilitatorSocket(meeting)

  // Fetch meeting data
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/meetings/code/${code}`)
        if (!response.ok) {
          throw new Error('Meeting not found')
        }
        const data: Meeting = await response.json()

        if (!data.isFacilitator) {
          navigate(`/join/${code}`)
          return
        }

        setMeeting(data)
        setCurrentQuestionIndex(data.currentQuestionIndex || 0)
        setLoading(false)
      } catch (err) {
        setFetchError(err instanceof Error ? err.message : 'Failed to load meeting')
        setLoading(false)
      }
    }

    fetchMeeting()
  }, [code, navigate])

  const currentQuestion = meeting?.questions?.[currentQuestionIndex]

  const startMeeting = async () => {
    if (!meeting) return
    try {
      await fetch(`/api/meetings/${meeting.id}/start`, { method: 'POST' })
      setMeeting((prev) => (prev ? { ...prev, status: 'active' } : null))
    } catch {
      setFetchError('Failed to start meeting')
    }
  }

  const handleStartQuestion = () => {
    if (!currentQuestion) return
    startQuestion(currentQuestion.id, currentQuestion.time_limit_seconds)
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

  const copyJoinLink = () => {
    if (!meeting) return
    const link = `${window.location.origin}/join/${meeting.participantCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const error = fetchError || socketError

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
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
            <p className="text-gray-600 mb-6">
              Share the code <strong className="font-mono">{meeting.participantCode}</strong> with
              participants
            </p>
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

            {/* Revealed Answers */}
            {sessionStatus === 'revealed' && revealedAnswers && (
              <AnswerReveal
                answers={revealedAnswers}
                summary={summary}
                showNames={meeting.showParticipantNames ?? true}
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
