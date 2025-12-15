import { useState, useEffect, useCallback, useRef } from 'react'
import { useSocket } from '../context/SocketContext'
import type {
  Meeting,
  Answer,
  FacilitatorSocketReturn,
  SessionState,
  GroupedAnswersData,
  UpdateGroupAction
} from '../types'

export function useFacilitatorSocket(meeting: Meeting | null): FacilitatorSocketReturn {
  const { socket, connect, isConnected } = useSocket()
  const hasJoined = useRef(false)

  const [sessionStatus, setSessionStatus] = useState<SessionState['status']>('waiting')
  const [participantCount, setParticipantCount] = useState(0)
  const [answeredCount, setAnsweredCount] = useState(0)
  const [answerCount, setAnswerCount] = useState(0)
  const [revealedAnswers, setRevealedAnswers] = useState<Answer[] | null>(null)
  const [summary, setSummary] = useState('')
  const [isLoadingSummary, setIsLoadingSummary] = useState(false)
  const [timerEnd, setTimerEnd] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [groupedAnswers, setGroupedAnswers] = useState<GroupedAnswersData | null>(null)
  const [isGrouping, setIsGrouping] = useState(false)

  // Connect to socket when meeting is loaded
  useEffect(() => {
    if (meeting && !isConnected) {
      connect()
    }
  }, [meeting, connect, isConnected])

  // Socket event handlers
  useEffect(() => {
    if (!socket || !meeting?.id) return

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

    socket.on('answer-submitted', ({ answeredCount: ac, totalCount, answerCount: ac2 }) => {
      setAnsweredCount(ac)
      setParticipantCount(totalCount)
      setAnswerCount(ac2)
    })

    socket.on('answers-revealed', ({ answers }) => {
      setRevealedAnswers(answers)
      setSummary('')
      setIsLoadingSummary(true)
      setSessionStatus('revealed')
      setGroupedAnswers(null) // Reset grouped answers on new reveal
    })

    socket.on('summary-ready', ({ summary: s }) => {
      setSummary(s)
      setIsLoadingSummary(false)
    })

    socket.on('grouping-started', () => {
      setIsGrouping(true)
    })

    socket.on('answers-grouped', ({ groupedAnswers: ga }) => {
      setGroupedAnswers(ga)
      setIsGrouping(false)
    })

    socket.on('groups-updated', ({ groupedAnswers: ga }) => {
      setGroupedAnswers(ga)
    })

    socket.on('error', ({ message }) => {
      setError(message)
      setIsGrouping(false) // Stop loading on error
    })

    return () => {
      socket.off('session-state')
      socket.off('participant-joined')
      socket.off('participant-left')
      socket.off('answer-submitted')
      socket.off('answers-revealed')
      socket.off('summary-ready')
      socket.off('grouping-started')
      socket.off('answers-grouped')
      socket.off('groups-updated')
      socket.off('error')
    }
  }, [socket, meeting?.id])

  const startQuestion = useCallback(
    (questionId: string, timeLimitSeconds?: number | null) => {
      if (!socket || !meeting?.id) return

      socket.emit('start-question', {
        meetingId: meeting.id,
        questionId,
        timeLimitSeconds
      })

      setSessionStatus('answering')
      setAnsweredCount(0)
      setAnswerCount(0)
      setRevealedAnswers(null)
      setSummary('')
      setIsLoadingSummary(false)

      if (timeLimitSeconds) {
        setTimerEnd(Date.now() + timeLimitSeconds * 1000)
      }
    },
    [socket, meeting?.id]
  )

  const revealAnswers = useCallback(
    (questionId: string) => {
      if (!socket || !meeting?.id) return

      socket.emit('reveal-answers', {
        meetingId: meeting.id,
        questionId
      })
    },
    [socket, meeting?.id]
  )

  const nextQuestion = useCallback(
    (nextQuestionIndex: number) => {
      if (!socket || !meeting?.id) return

      socket.emit('next-question', {
        meetingId: meeting.id,
        nextQuestionIndex
      })

      setSessionStatus('waiting')
      setAnsweredCount(0)
      setAnswerCount(0)
      setRevealedAnswers(null)
      setSummary('')
      setIsLoadingSummary(false)
      setTimerEnd(null)
      setGroupedAnswers(null)
    },
    [socket, meeting?.id]
  )

  const endMeeting = useCallback(() => {
    if (!socket || !meeting?.id) return
    socket.emit('end-meeting', { meetingId: meeting.id })
  }, [socket, meeting?.id])

  const groupAnswersAction = useCallback(
    (questionId: string) => {
      if (!socket || !meeting?.id) return
      socket.emit('group-answers', {
        meetingId: meeting.id,
        questionId
      })
    },
    [socket, meeting?.id]
  )

  const updateGroup = useCallback(
    (
      questionId: string,
      action: UpdateGroupAction,
      payload: {
        answerId?: string
        targetGroupId?: string | null
        groupId?: string
        name?: string
        answerIds?: string[]
      }
    ) => {
      if (!socket || !meeting?.id) return
      socket.emit('update-group', {
        meetingId: meeting.id,
        questionId,
        action,
        payload
      })
    },
    [socket, meeting?.id]
  )

  return {
    sessionStatus,
    participantCount,
    answeredCount,
    answerCount,
    revealedAnswers,
    summary,
    isLoadingSummary,
    timerEnd,
    error,
    setError,
    startQuestion,
    revealAnswers,
    nextQuestion,
    endMeeting,
    groupedAnswers,
    isGrouping,
    groupAnswers: groupAnswersAction,
    updateGroup
  }
}
