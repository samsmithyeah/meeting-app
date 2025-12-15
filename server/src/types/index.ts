import type { Server, Socket } from 'socket.io'

// Database entities
export interface Meeting {
  id: string
  title: string
  facilitator_code: string
  participant_code: string
  show_participant_names: boolean
  status: 'draft' | 'active' | 'completed'
  current_question_index: number | null
  created_at: string
  updated_at: string
}

export interface Question {
  id: string
  meeting_id: string
  text: string
  order_index: number
  allow_multiple_answers: boolean
  time_limit_seconds: number | null
  status: 'pending' | 'active' | 'revealed'
  ai_summary: string | null
  created_at: string
}

export interface Participant {
  id: string
  meeting_id: string
  name: string
  socket_id: string | null
  is_active: boolean
  created_at: string
}

export interface Answer {
  id: string
  question_id: string
  participant_id: string
  text: string
  created_at: string
  participants?: Pick<Participant, 'id' | 'name'>
}

export interface AnswerGroup {
  id: string
  question_id: string
  name: string
  display_order: number
  created_at: string
}

export interface AnswerGroupMapping {
  id: string
  answer_id: string
  group_id: string
  created_at: string
}

// Grouped answers types for socket/API communication
export interface GroupWithAnswers {
  id: string
  name: string
  displayOrder: number
  answers: { id: string; text: string; participantName: string | null }[]
}

export interface GroupedAnswersData {
  groups: GroupWithAnswers[]
  ungrouped: { id: string; text: string; participantName: string | null }[]
}

// AI grouping result types
export interface AnswerGroupingResult {
  groupName: string
  answerIds: string[]
}

export interface GroupAnswersAIResult {
  groups: AnswerGroupingResult[]
  ungroupedIds: string[]
}

// Session state (Redis)
export interface SessionState {
  status: 'waiting' | 'answering' | 'revealed'
  currentQuestionId: string | null
  participants: string[]
  answeredParticipants: string[]
  timerEnd: number | null
}

// Socket.io types
export interface ServerToClientEvents {
  'session-state': (state: SessionState) => void
  joined: (data: { participantId: string }) => void
  'participant-joined': (data: { participantId: string; name: string; count: number }) => void
  'participant-left': (data: { participantId: string; name: string; count: number }) => void
  'question-started': (data: {
    questionId: string
    question: string | undefined
    allowMultipleAnswers: boolean | undefined
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
  'answers-revealed': (data: {
    questionId: string
    answers: { id: string; text: string; participantName: string | null }[]
  }) => void
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

export type UpdateGroupAction = 'move-answer' | 'create-group' | 'rename-group' | 'delete-group'

export interface ClientToServerEvents {
  'facilitator-join': (data: { meetingId: string }) => void
  'join-meeting': (data: { meetingId: string; participantName: string }) => void
  'start-question': (data: {
    meetingId: string
    questionId: string
    timeLimitSeconds?: number
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

export interface InterServerEvents {
  ping: () => void
}

export interface SocketData {
  meetingId?: string
  participantId?: string
  participantName?: string
  isFacilitator?: boolean
}

export type TypedServer = Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>
export type TypedSocket = Socket<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>

// API types
export interface CreateMeetingRequest {
  title: string
  showParticipantNames?: boolean
  questions?: {
    text: string
    allowMultipleAnswers?: boolean
    timeLimitSeconds?: number | null
  }[]
}

export interface CreateMeetingResponse {
  id: string
  title: string
  facilitatorCode: string
  participantCode: string
  showParticipantNames: boolean
}

export interface MeetingByCodeResponse {
  id: string
  title: string
  status: string
  currentQuestionIndex: number | null
  showParticipantNames: boolean
  isFacilitator: boolean
  facilitatorCode?: string
  participantCode: string
  questions: Question[]
}
