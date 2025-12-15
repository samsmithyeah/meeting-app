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
  meetingId?: string
  text: string
  orderIndex?: number
  allowMultipleAnswers?: boolean
  timeLimitSeconds?: number | null
  status?: 'pending' | 'active' | 'revealed'
  aiSummary?: string | null
}

export interface Answer {
  id: string
  text: string
  participantName?: string | null
}

// Grouped answers types
export interface GroupWithAnswers {
  id: string
  name: string
  displayOrder: number
  answers: Answer[]
}

export interface GroupedAnswersData {
  groups: GroupWithAnswers[]
  ungrouped: Answer[]
}

export type UpdateGroupAction = 'move-answer' | 'create-group' | 'rename-group' | 'delete-group'

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
  'answer-received': (data: { answer: { id: string; text: string } }) => void
  'answer-updated': (data: { answer: { id: string; text: string } }) => void
  'answer-deleted': (data: { answerId: string }) => void
  'answer-submitted': (data: {
    answeredCount: number
    totalCount: number
    answerCount: number
    allAnswered: boolean
  }) => void
  'answers-revealed': (data: { questionId: string; answers: Answer[] }) => void
  'summary-ready': (data: { questionId: string; summary: string }) => void
  'next-question': (data: { questionIndex: number }) => void
  'meeting-started': (data: { meetingId: string }) => void
  'meeting-ended': () => void
  error: (data: { message: string }) => void
  // Grouping events
  'grouping-started': (data: { questionId: string }) => void
  'answers-grouped': (data: { questionId: string; groupedAnswers: GroupedAnswersData }) => void
  'groups-updated': (data: { questionId: string; groupedAnswers: GroupedAnswersData }) => void
}

export interface ClientToServerEvents {
  'facilitator-join': (data: { meetingId: string }) => void
  'join-meeting': (data: { meetingId: string; participantName: string }) => void
  'start-question': (data: {
    meetingId: string
    questionId: string
    timeLimitSeconds?: number | null
  }) => void
  'submit-answer': (data: { meetingId: string; questionId: string; text: string }) => void
  'edit-answer': (data: {
    meetingId: string
    questionId: string
    answerId: string
    text: string
  }) => void
  'delete-answer': (data: { meetingId: string; questionId: string; answerId: string }) => void
  'reveal-answers': (data: { meetingId: string; questionId: string }) => void
  'next-question': (data: { meetingId: string; nextQuestionIndex: number }) => void
  'end-meeting': (data: { meetingId: string }) => void
  // Grouping events
  'group-answers': (data: { meetingId: string; questionId: string }) => void
  'update-group': (data: {
    meetingId: string
    questionId: string
    action: UpdateGroupAction
    payload: {
      answerId?: string
      targetGroupId?: string | null
      groupId?: string
      name?: string
      answerIds?: string[]
    }
  }) => void
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
  myAnswers: MyAnswer[]
  onSubmit: (text: string) => void
  onEdit: (answerId: string, text: string) => void
  onDelete: (answerId: string) => void
}

export interface AnswerRevealProps {
  answers: Answer[]
  summary?: string | null
  isLoadingSummary?: boolean
  showNames: boolean
  // Grouping props
  groupedAnswers?: GroupedAnswersData | null
  isGrouping?: boolean
  isFacilitator?: boolean
  onGroupAnswers?: () => void
  onMoveAnswer?: (answerId: string, targetGroupId: string | null) => void
  onCreateGroup?: (name: string, answerIds?: string[]) => void
  onRenameGroup?: (groupId: string, name: string) => void
  onDeleteGroup?: (groupId: string) => void
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
  answerCount: number
  revealedAnswers: Answer[] | null
  summary: string
  isLoadingSummary: boolean
  timerEnd: number | null
  error: string
  setError: (error: string) => void
  startQuestion: (questionId: string, timeLimitSeconds?: number | null) => void
  revealAnswers: (questionId: string) => void
  nextQuestion: (nextQuestionIndex: number) => void
  endMeeting: () => void
  // Grouping
  groupedAnswers: GroupedAnswersData | null
  isGrouping: boolean
  groupAnswers: (questionId: string) => void
  updateGroup: (
    questionId: string,
    action: UpdateGroupAction,
    payload: {
      answerId?: string
      targetGroupId?: string | null
      groupId?: string
      name?: string
      answerIds?: string[]
    }
  ) => void
}

export interface MyAnswer {
  id: string
  text: string
}

export interface ParticipantSocketReturn {
  sessionStatus: SessionState['status']
  currentQuestion: Question | null
  myAnswers: MyAnswer[]
  revealedAnswers: Answer[] | null
  timerEnd: number | null
  answeredCount: number
  totalCount: number
  error: string
  meetingStatus: Meeting['status']
  submitAnswer: (text: string) => void
  editAnswer: (answerId: string, text: string) => void
  deleteAnswer: (answerId: string) => void
  // Grouping (view-only for participants)
  groupedAnswers: GroupedAnswersData | null
}
