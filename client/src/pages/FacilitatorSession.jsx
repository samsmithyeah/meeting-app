import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import QuestionCard from '../components/QuestionCard'
import AnswerReveal from '../components/AnswerReveal'

export default function FacilitatorSession() {
  const { code } = useParams()
  const navigate = useNavigate()
  const { socket, connect, isConnected } = useSocket()

  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [sessionStatus, setSessionStatus] = useState('waiting')
  const [participantCount, setParticipantCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [revealedAnswers, setRevealedAnswers] = useState(null)
  const [summary, setSummary] = useState('')
  const [copied, setCopied] = useState(false)
  const [timerEnd, setTimerEnd] = useState(null)
  const hasJoined = useRef(false)

  // Fetch meeting data
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/meetings/code/${code}`)
        if (!response.ok) {
          throw new Error('Meeting not found')
        }
        const data = await response.json()

        if (!data.isFacilitator) {
          navigate(`/join/${code}`)
          return
        }

        setMeeting(data)
        setCurrentQuestionIndex(data.currentQuestionIndex || 0)
        setLoading(false)
      } catch (err) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchMeeting()
  }, [code, navigate])

  // Connect to socket when meeting is loaded
  useEffect(() => {
    if (meeting && !isConnected) {
      connect()
    }
  }, [meeting, connect, isConnected])

  // Socket event handlers
  useEffect(() => {
    if (!socket || !meeting) return

    // Prevent double-joining in React Strict Mode
    if (!hasJoined.current) {
      hasJoined.current = true
      socket.emit('facilitator-join', { meetingId: meeting.id })
    }

    socket.on('session-state', (state) => {
      if (state) {
        setSessionStatus(state.status)
        setParticipantCount(state.participants?.length || 0)
        setAnsweredCount(state.answeredParticipants?.length || 0)
        if (state.timerEnd) setTimerEnd(state.timerEnd)
      }
    })

    socket.on('participant-joined', ({ count }) => {
      setParticipantCount(count)
    })

    socket.on('participant-left', ({ count }) => {
      setParticipantCount(count)
    })

    socket.on('answer-submitted', ({ answeredCount, totalCount }) => {
      setAnsweredCount(answeredCount)
      setParticipantCount(totalCount)
    })

    socket.on('answers-revealed', ({ answers, summary }) => {
      setRevealedAnswers(answers)
      setSummary(summary)
      setSessionStatus('revealed')
    })

    socket.on('error', ({ message }) => {
      setError(message)
    })

    return () => {
      socket.off('session-state')
      socket.off('participant-joined')
      socket.off('participant-left')
      socket.off('answer-submitted')
      socket.off('answers-revealed')
      socket.off('error')
    }
  }, [socket, meeting])

  const currentQuestion = meeting?.questions?.[currentQuestionIndex]

  const startMeeting = async () => {
    try {
      await fetch(`/api/meetings/${meeting.id}/start`, { method: 'POST' })
      setMeeting((prev) => ({ ...prev, status: 'active' }))
    } catch (err) {
      setError('Failed to start meeting')
    }
  }

  const startQuestion = useCallback(() => {
    if (!socket || !currentQuestion) return

    socket.emit('start-question', {
      meetingId: meeting.id,
      questionId: currentQuestion.id,
      timeLimitSeconds: currentQuestion.time_limit_seconds
    })

    setSessionStatus('answering')
    setAnsweredCount(0)
    setRevealedAnswers(null)
    setSummary('')

    if (currentQuestion.time_limit_seconds) {
      setTimerEnd(Date.now() + currentQuestion.time_limit_seconds * 1000)
    }
  }, [socket, meeting, currentQuestion])

  const revealAnswers = useCallback(() => {
    if (!socket || !currentQuestion) return

    socket.emit('reveal-answers', {
      meetingId: meeting.id,
      questionId: currentQuestion.id
    })
  }, [socket, meeting, currentQuestion])

  const nextQuestion = useCallback(() => {
    if (!socket || currentQuestionIndex >= meeting.questions.length - 1) return

    const nextIndex = currentQuestionIndex + 1
    socket.emit('next-question', {
      meetingId: meeting.id,
      nextQuestionIndex: nextIndex
    })

    setCurrentQuestionIndex(nextIndex)
    setSessionStatus('waiting')
    setAnsweredCount(0)
    setRevealedAnswers(null)
    setSummary('')
    setTimerEnd(null)
  }, [socket, meeting, currentQuestionIndex])

  const endMeeting = useCallback(() => {
    if (!socket) return
    socket.emit('end-meeting', { meetingId: meeting.id })
    navigate('/')
  }, [socket, meeting, navigate])

  const copyJoinLink = () => {
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

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  const isLastQuestion = currentQuestionIndex >= meeting.questions.length - 1

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
                Question {currentQuestionIndex + 1} of {meeting.questions.length}
              </span>
              <div className="flex gap-1">
                {meeting.questions.map((_, i) => (
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
                showNames={meeting.showParticipantNames}
              />
            )}

            {/* Controls */}
            <div className="flex justify-center gap-4">
              {sessionStatus === 'waiting' && (
                <button
                  onClick={startQuestion}
                  disabled={participantCount === 0}
                  className="bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Start Question
                </button>
              )}

              {sessionStatus === 'answering' && (
                <button
                  onClick={revealAnswers}
                  className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                >
                  Reveal Answers ({answeredCount}/{participantCount})
                </button>
              )}

              {sessionStatus === 'revealed' && (
                <>
                  {!isLastQuestion ? (
                    <button
                      onClick={nextQuestion}
                      className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-colors"
                    >
                      Next Question
                    </button>
                  ) : (
                    <button
                      onClick={endMeeting}
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
