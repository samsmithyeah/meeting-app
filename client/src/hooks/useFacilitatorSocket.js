import { useState, useEffect, useCallback, useRef } from 'react'
import { useSocket } from '../context/SocketContext'

export function useFacilitatorSocket(meeting) {
  const { socket, connect, isConnected } = useSocket()
  const hasJoined = useRef(false)

  const [sessionStatus, setSessionStatus] = useState('waiting')
  const [participantCount, setParticipantCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [revealedAnswers, setRevealedAnswers] = useState(null)
  const [summary, setSummary] = useState('')
  const [timerEnd, setTimerEnd] = useState(null)
  const [error, setError] = useState('')

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

    socket.on('answer-submitted', ({ answeredCount: ac, totalCount }) => {
      setAnsweredCount(ac)
      setParticipantCount(totalCount)
    })

    socket.on('answers-revealed', ({ answers, summary: s }) => {
      setRevealedAnswers(answers)
      setSummary(s)
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

  const startQuestion = useCallback(
    (questionId, timeLimitSeconds) => {
      if (!socket) return

      socket.emit('start-question', {
        meetingId: meeting.id,
        questionId,
        timeLimitSeconds
      })

      setSessionStatus('answering')
      setAnsweredCount(0)
      setRevealedAnswers(null)
      setSummary('')

      if (timeLimitSeconds) {
        setTimerEnd(Date.now() + timeLimitSeconds * 1000)
      }
    },
    [socket, meeting]
  )

  const revealAnswers = useCallback(
    (questionId) => {
      if (!socket) return

      socket.emit('reveal-answers', {
        meetingId: meeting.id,
        questionId
      })
    },
    [socket, meeting]
  )

  const nextQuestion = useCallback(
    (nextQuestionIndex) => {
      if (!socket) return

      socket.emit('next-question', {
        meetingId: meeting.id,
        nextQuestionIndex
      })

      setSessionStatus('waiting')
      setAnsweredCount(0)
      setRevealedAnswers(null)
      setSummary('')
      setTimerEnd(null)
    },
    [socket, meeting]
  )

  const endMeeting = useCallback(() => {
    if (!socket) return
    socket.emit('end-meeting', { meetingId: meeting.id })
  }, [socket, meeting])

  return {
    sessionStatus,
    participantCount,
    answeredCount,
    revealedAnswers,
    summary,
    timerEnd,
    error,
    setError,
    startQuestion,
    revealAnswers,
    nextQuestion,
    endMeeting
  }
}
