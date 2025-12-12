import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import type { Meeting, Question, Answer, ParticipantSocketReturn, SessionState } from '../types'

export function useParticipantSocket(
  meeting: Meeting | null,
  participantName: string
): ParticipantSocketReturn {
  const navigate = useNavigate()
  const { socket, connect, isConnected } = useSocket()
  const hasJoined = useRef(false)

  const [sessionStatus, setSessionStatus] = useState<SessionState['status']>('waiting')
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [revealedAnswers, setRevealedAnswers] = useState<Answer[] | null>(null)
  const [summary, setSummary] = useState('')
  const [timerEnd, setTimerEnd] = useState<number | null>(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState('')
  const [meetingStatus, setMeetingStatus] = useState<Meeting['status']>(meeting?.status || 'draft')

  // Connect to socket when meeting is loaded
  useEffect(() => {
    if (meeting && participantName && !isConnected) {
      connect()
    }
  }, [meeting, participantName, connect, isConnected])

  // Socket event handlers
  useEffect(() => {
    if (!socket || !meeting?.id || !participantName) return

    // Prevent double-joining in React Strict Mode
    if (!hasJoined.current) {
      hasJoined.current = true
      socket.emit('join-meeting', {
        meetingId: meeting.id,
        participantName
      })
    }

    socket.on('joined', () => {
      // Participant joined successfully
    })

    socket.on('session-state', (state) => {
      if (state) {
        setSessionStatus(state.status)
        setTotalCount(state.participants?.length || 0)
        setAnsweredCount(state.answeredParticipants?.length || 0)
        if (state.timerEnd) setTimerEnd(state.timerEnd)
      }
    })

    socket.on('meeting-started', () => {
      setMeetingStatus('active')
    })

    socket.on(
      'question-started',
      ({ questionId, question, allow_multiple_answers, timerEnd: end }) => {
        setCurrentQuestion({
          id: questionId,
          text: question || '',
          allow_multiple_answers
        })
        setSessionStatus('answering')
        setHasAnswered(false)
        setRevealedAnswers(null)
        setSummary('')
        setTimerEnd(end)
      }
    )

    socket.on('answer-received', () => {
      setHasAnswered(true)
    })

    socket.on('answer-submitted', ({ answeredCount: ac, totalCount: tc }) => {
      setAnsweredCount(ac)
      setTotalCount(tc)
    })

    socket.on('answers-revealed', ({ answers, summary: s }) => {
      setRevealedAnswers(answers)
      setSummary(s || '')
      setSessionStatus('revealed')
      setTimerEnd(null)
    })

    socket.on('next-question', () => {
      setSessionStatus('waiting')
      setCurrentQuestion(null)
      setHasAnswered(false)
      setRevealedAnswers(null)
      setSummary('')
      setTimerEnd(null)
    })

    socket.on('meeting-ended', () => {
      navigate('/')
    })

    socket.on('error', ({ message }) => {
      setError(message)
    })

    return () => {
      socket.off('joined')
      socket.off('session-state')
      socket.off('meeting-started')
      socket.off('question-started')
      socket.off('answer-received')
      socket.off('answer-submitted')
      socket.off('answers-revealed')
      socket.off('next-question')
      socket.off('meeting-ended')
      socket.off('error')
    }
  }, [socket, meeting?.id, participantName, navigate])

  const submitAnswer = useCallback(
    (answers: string | string[]) => {
      if (!socket || !currentQuestion || !meeting?.id) return

      socket.emit('submit-answer', {
        meetingId: meeting.id,
        questionId: currentQuestion.id,
        answers
      })
    },
    [socket, meeting?.id, currentQuestion]
  )

  return {
    sessionStatus,
    currentQuestion,
    hasAnswered,
    revealedAnswers,
    summary,
    timerEnd,
    answeredCount,
    totalCount,
    error,
    meetingStatus,
    submitAnswer
  }
}
