import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useSocket } from '../context/SocketContext'
import type {
  Meeting,
  Question,
  Answer,
  ParticipantSocketReturn,
  SessionState,
  GroupedAnswersData,
  MyAnswer
} from '../types'

export function useParticipantSocket(
  meeting: Meeting | null,
  participantName: string
): ParticipantSocketReturn {
  const navigate = useNavigate()
  const { socket, connect, isConnected } = useSocket()
  const hasJoined = useRef(false)

  const [sessionStatus, setSessionStatus] = useState<SessionState['status']>('waiting')
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null)
  const [myAnswers, setMyAnswers] = useState<MyAnswer[]>([])
  const [revealedAnswers, setRevealedAnswers] = useState<Answer[] | null>(null)
  const [summary, setSummary] = useState('')
  const [timerEnd, setTimerEnd] = useState<number | null>(null)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [error, setError] = useState('')
  const [meetingStatus, setMeetingStatus] = useState<Meeting['status']>('draft')
  const [groupedAnswers, setGroupedAnswers] = useState<GroupedAnswersData | null>(null)

  // Sync meetingStatus when meeting prop changes
  useEffect(() => {
    if (meeting?.status) {
      setMeetingStatus(meeting.status)
    }
  }, [meeting?.status])

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
      ({ questionId, question, allowMultipleAnswers, timerEnd: end }) => {
        setCurrentQuestion({
          id: questionId,
          text: question || '',
          allowMultipleAnswers
        })
        setSessionStatus('answering')
        setMyAnswers([]) // Clear answers for new question
        setRevealedAnswers(null)
        setSummary('')
        setTimerEnd(end)
      }
    )

    socket.on('answer-received', ({ answer }) => {
      setMyAnswers((prev) => [...prev, answer])
    })

    socket.on('answer-updated', ({ answer }) => {
      setMyAnswers((prev) => prev.map((a) => (a.id === answer.id ? answer : a)))
    })

    socket.on('answer-deleted', ({ answerId }) => {
      setMyAnswers((prev) => prev.filter((a) => a.id !== answerId))
    })

    socket.on('answer-submitted', ({ answeredCount: ac, totalCount: tc }) => {
      setAnsweredCount(ac)
      setTotalCount(tc)
    })

    socket.on('answers-revealed', ({ answers }) => {
      setRevealedAnswers(answers)
      setSummary('')
      setSessionStatus('revealed')
      setTimerEnd(null)
      setGroupedAnswers(null)
    })

    socket.on('answers-grouped', ({ groupedAnswers: ga }) => {
      setGroupedAnswers(ga)
    })

    socket.on('groups-updated', ({ groupedAnswers: ga }) => {
      setGroupedAnswers(ga)
    })

    socket.on('next-question', () => {
      setSessionStatus('waiting')
      setCurrentQuestion(null)
      setMyAnswers([])
      setRevealedAnswers(null)
      setSummary('')
      setTimerEnd(null)
      setGroupedAnswers(null)
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
      socket.off('answer-updated')
      socket.off('answer-deleted')
      socket.off('answer-submitted')
      socket.off('answers-revealed')
      socket.off('answers-grouped')
      socket.off('groups-updated')
      socket.off('next-question')
      socket.off('meeting-ended')
      socket.off('error')
    }
  }, [socket, meeting?.id, participantName, navigate])

  const submitAnswer = useCallback(
    (text: string) => {
      if (!socket || !currentQuestion || !meeting?.id) return

      socket.emit('submit-answer', {
        meetingId: meeting.id,
        questionId: currentQuestion.id,
        text
      })
    },
    [socket, meeting?.id, currentQuestion]
  )

  const editAnswer = useCallback(
    (answerId: string, text: string) => {
      if (!socket || !currentQuestion || !meeting?.id) return

      socket.emit('edit-answer', {
        meetingId: meeting.id,
        questionId: currentQuestion.id,
        answerId,
        text
      })
    },
    [socket, meeting?.id, currentQuestion]
  )

  const deleteAnswer = useCallback(
    (answerId: string) => {
      if (!socket || !currentQuestion || !meeting?.id) return

      socket.emit('delete-answer', {
        meetingId: meeting.id,
        questionId: currentQuestion.id,
        answerId
      })
    },
    [socket, meeting?.id, currentQuestion]
  )

  return {
    sessionStatus,
    currentQuestion,
    myAnswers,
    revealedAnswers,
    summary,
    timerEnd,
    answeredCount,
    totalCount,
    error,
    meetingStatus,
    submitAnswer,
    editAnswer,
    deleteAnswer,
    groupedAnswers
  }
}
