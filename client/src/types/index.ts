import type { Socket } from 'socket.io-client'

// Database entities (matches server types)
export interface Meeting {
  id: string
  title: string
  facilitatorCode?: string
  participantCode: string
  showParticipantNames: boolean
  status: 'draft' | 'active' | 'completed'
  currentQuestionIndex: number | null
  isFacilitator?: boolean
  questions?: Question[]
}

export interface Question {
  id: string
  meeting_id?: string
  text: string
  order_index?: number
  allow_multiple_answers?: boolean
  time_limit_seconds?: number | null
  status?: 'pending' | 'active' | 'revealed'
  ai_summary?: string | null
}

export interface Answer {
  id: string
  text: string
  participantName?: string | null
}

// Session state (from Redis via Socket)
export interface SessionState {
  status: 'waiting' | 'answering' | 'revealed'
  currentQuestionId?: string | null
  participants?: string[]
  answeredParticipants?: string[]
  timerEnd?: number | null
}

// Socket.io event types for client
export interface ServerToClientEvents {
  'session-state': (state: SessionState) => void
  joined: (data: { participantId: string }) => void
  'participant-joined': (data: { participantId: string; name: string; count: number }) => void
  'participant-left': (data: { participantId: string; name: string; count: number }) => void
  'question-started': (data: {
    questionId: string
    question?: string
    allowMultipleAnswers?: boolean
    timerEnd: number | null
  }) => void
  'answer-received': () => void
  'answer-submitted': (data: {
    answeredCount: number
    totalCount: number
    allAnswered: boolean
  }) => void
  'answers-revealed': (data: {
    questionId: string
    answers: Answer[]
    summary: string | null
  }) => void
  'next-question': (data: { questionIndex: number }) => void
  'meeting-started': (data: { meetingId: string }) => void
  'meeting-ended': () => void
  error: (data: { message: string }) => void
}

export interface ClientToServerEvents {
  'facilitator-join': (data: { meetingId: string }) => void
  'join-meeting': (data: { meetingId: string; participantName: string }) => void
  'start-question': (data: {
    meetingId: string
    questionId: string
    timeLimitSeconds?: number | null
  }) => void
  'submit-answer': (data: {
    meetingId: string
    questionId: string
    answers: string | string[]
  }) => void
  'reveal-answers': (data: { meetingId: string; questionId: string }) => void
  'next-question': (data: { meetingId: string; nextQuestionIndex: number }) => void
  'end-meeting': (data: { meetingId: string }) => void
}

export type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>

// Component props
export interface QuestionCardProps {
  question: Question
  status: SessionState['status']
  answeredCount?: number
  totalCount?: number
  timerEnd?: number | null
  isFacilitator: boolean
}

export interface AnswerInputProps {
  allowMultiple: boolean
  onSubmit: (answers: string | string[]) => void
}

export interface AnswerRevealProps {
  answers: Answer[]
  summary?: string | null
  showNames: boolean
}

// Socket context
export interface SocketContextValue {
  socket: TypedSocket | null
  isConnected: boolean
  connect: () => void
  disconnect: () => void
}

// Hook return types
export interface FacilitatorSocketReturn {
  sessionStatus: SessionState['status']
  participantCount: number
  answeredCount: number
  revealedAnswers: Answer[] | null
  summary: string
  timerEnd: number | null
  error: string
  setError: (error: string) => void
  startQuestion: (questionId: string, timeLimitSeconds?: number | null) => void
  revealAnswers: (questionId: string) => void
  nextQuestion: (nextQuestionIndex: number) => void
  endMeeting: () => void
}

export interface ParticipantSocketReturn {
  sessionStatus: SessionState['status']
  currentQuestion: Question | null
  hasAnswered: boolean
  revealedAnswers: Answer[] | null
  summary: string
  timerEnd: number | null
  answeredCount: number
  totalCount: number
  error: string
  meetingStatus: Meeting['status']
  submitAnswer: (answers: string | string[]) => void
}
