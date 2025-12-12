import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useParticipantSocket } from '../hooks/useParticipantSocket'
import QuestionCard from '../components/QuestionCard'
import AnswerInput from '../components/AnswerInput'
import AnswerReveal from '../components/AnswerReveal'

export default function ParticipantSession() {
  const { code } = useParams()
  const navigate = useNavigate()

  const [meeting, setMeeting] = useState(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState('')
  const [participantName, setParticipantName] = useState('')

  const {
    sessionStatus,
    currentQuestion,
    hasAnswered,
    revealedAnswers,
    summary,
    timerEnd,
    answeredCount,
    totalCount,
    error: socketError,
    meetingStatus,
    submitAnswer
  } = useParticipantSocket(meeting, participantName)

  // Get participant name from session storage
  useEffect(() => {
    const name = sessionStorage.getItem('participantName')
    if (!name) {
      navigate(`/join/${code}`)
      return
    }
    setParticipantName(name)
  }, [code, navigate])

  // Fetch meeting data
  useEffect(() => {
    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/meetings/code/${code}`)
        if (!response.ok) {
          throw new Error('Meeting not found')
        }
        const data = await response.json()

        if (data.isFacilitator) {
          navigate(`/facilitate/${code}`)
          return
        }

        setMeeting(data)
        setLoading(false)
      } catch (err) {
        setFetchError(err.message)
        setLoading(false)
      }
    }

    if (participantName) {
      fetchMeeting()
    }
  }, [code, navigate, participantName])

  const error = fetchError || socketError
  const currentMeetingStatus = meetingStatus || meeting?.status

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{error}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-lg mx-auto px-4 py-4">
          <h1 className="text-lg font-bold text-gray-900">{meeting.title}</h1>
          <p className="text-sm text-gray-500">Joined as {participantName}</p>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Waiting for meeting to start */}
        {currentMeetingStatus === 'draft' && (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 bg-indigo-100 rounded-full mx-auto flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-indigo-600"
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
            </div>
            <h2 className="text-xl font-semibold mb-2">Waiting for meeting to start...</h2>
            <p className="text-gray-500">The facilitator will begin shortly</p>
          </div>
        )}

        {/* Meeting active - waiting for question */}
        {currentMeetingStatus === 'active' && sessionStatus === 'waiting' && !currentQuestion && (
          <div className="bg-white rounded-xl shadow p-8 text-center">
            <div className="animate-pulse mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full mx-auto flex items-center justify-center">
                <svg
                  className="w-8 h-8 text-green-600"
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
            </div>
            <h2 className="text-xl font-semibold mb-2">You're in!</h2>
            <p className="text-gray-500">Waiting for the next question...</p>
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

            {!hasAnswered ? (
              <AnswerInput
                allowMultiple={currentQuestion.allow_multiple_answers}
                onSubmit={submitAnswer}
                timerEnd={timerEnd}
              />
            ) : (
              <div className="bg-green-50 rounded-xl p-6 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full mx-auto flex items-center justify-center mb-3">
                  <svg
                    className="w-6 h-6 text-green-600"
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
                <p className="font-medium text-green-800">Answer submitted!</p>
                <p className="text-sm text-green-600 mt-1">
                  Waiting for everyone to finish ({answeredCount}/{totalCount})
                </p>
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
              summary={summary}
              showNames={meeting.showParticipantNames}
            />
            <div className="bg-blue-50 rounded-xl p-4 text-center">
              <p className="text-blue-800">Waiting for facilitator to continue...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
