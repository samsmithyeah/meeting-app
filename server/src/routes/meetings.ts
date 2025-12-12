import { Router, Request, Response } from 'express'
import { customAlphabet } from 'nanoid'
import { supabase } from '../config/supabase.js'
import { setSessionStatus, clearSession } from '../config/redis.js'
import type { TypedServer, CreateMeetingRequest } from '../types/index.js'

const router = Router()
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

// Helper to convert question to camelCase
function mapQuestionToCamelCase(q: {
  id: string
  meeting_id: string
  text: string
  order_index: number
  allow_multiple_answers: boolean
  time_limit_seconds: number | null
  status: string
  ai_summary: string | null
  created_at: string
}) {
  return {
    id: q.id,
    meetingId: q.meeting_id,
    text: q.text,
    orderIndex: q.order_index,
    allowMultipleAnswers: q.allow_multiple_answers,
    timeLimitSeconds: q.time_limit_seconds,
    status: q.status,
    aiSummary: q.ai_summary,
    createdAt: q.created_at
  }
}

// Helper to verify facilitator authorization
async function verifyFacilitator(meetingId: string, facilitatorCode: string): Promise<boolean> {
  const { data } = await supabase
    .from('meetings')
    .select('facilitator_code')
    .eq('id', meetingId)
    .single()
  return data?.facilitator_code === facilitatorCode
}

// Extend Express Request to include app with io
interface AppRequest extends Request {
  app: Request['app'] & {
    get(name: 'io'): TypedServer
  }
}

// Create a new meeting
router.post('/', async (req: Request<object, object, CreateMeetingRequest>, res: Response) => {
  try {
    const { title, showParticipantNames = true, questions = [] } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const facilitatorCode = generateCode()
    const participantCode = generateCode()

    // Use RPC for atomic creation of meeting with questions
    const { data, error } = await supabase.rpc('create_meeting_with_questions', {
      p_title: title,
      p_facilitator_code: facilitatorCode,
      p_participant_code: participantCode,
      p_show_participant_names: showParticipantNames,
      p_questions: questions
    })

    if (error) {
      console.error('Meeting creation error:', error)
      return res.status(500).json({ error: 'Failed to create meeting' })
    }

    res.status(201).json(data)
  } catch (error) {
    console.error('Create meeting error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get meeting by code (works for both facilitator and participant codes)
router.get('/code/:code', async (req: Request<{ code: string }>, res: Response) => {
  try {
    const { code } = req.params
    const upperCode = code.toUpperCase()

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select('*')
      .or(`facilitator_code.eq.${upperCode},participant_code.eq.${upperCode}`)
      .single()

    if (error || !meeting) {
      return res.status(404).json({ error: 'Meeting not found' })
    }

    const isFacilitator = meeting.facilitator_code === upperCode

    // Get questions
    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('meeting_id', meeting.id)
      .order('order_index')

    res.json({
      id: meeting.id,
      title: meeting.title,
      status: meeting.status,
      currentQuestionIndex: meeting.current_question_index,
      showParticipantNames: meeting.show_participant_names,
      isFacilitator,
      facilitatorCode: isFacilitator ? meeting.facilitator_code : undefined,
      participantCode: meeting.participant_code,
      questions: (questions || []).map(mapQuestionToCamelCase)
    })
  } catch (error) {
    console.error('Get meeting error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get meeting by ID
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params

    const { data: meeting, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !meeting) {
      return res.status(404).json({ error: 'Meeting not found' })
    }

    const { data: questions } = await supabase
      .from('questions')
      .select('*')
      .eq('meeting_id', id)
      .order('order_index')

    res.json({
      ...meeting,
      questions: questions || []
    })
  } catch (error) {
    console.error('Get meeting error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

interface UpdateMeetingBody {
  title?: string
  showParticipantNames?: boolean
  status?: string
  currentQuestionIndex?: number
}

// Update meeting
router.put(
  '/:id',
  async (req: Request<{ id: string }, object, UpdateMeetingBody>, res: Response) => {
    try {
      const { id } = req.params
      const { title, showParticipantNames, status, currentQuestionIndex } = req.body

      const updates: Record<string, unknown> = {}
      if (title !== undefined) updates.title = title
      if (showParticipantNames !== undefined) updates.show_participant_names = showParticipantNames
      if (status !== undefined) updates.status = status
      if (currentQuestionIndex !== undefined) updates.current_question_index = currentQuestionIndex
      updates.updated_at = new Date().toISOString()

      const { data: meeting, error } = await supabase
        .from('meetings')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: 'Failed to update meeting' })
      }

      res.json(meeting)
    } catch (error) {
      console.error('Update meeting error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Start meeting session
router.post('/:id/start', async (req: AppRequest, res: Response) => {
  try {
    const { id } = req.params
    const { facilitatorCode } = req.body as { facilitatorCode?: string }

    // Verify facilitator authorization
    if (!facilitatorCode || !(await verifyFacilitator(id, facilitatorCode))) {
      return res.status(403).json({ error: 'Unauthorized: Invalid facilitator code' })
    }

    // Update meeting status
    const { error } = await supabase
      .from('meetings')
      .update({ status: 'active', current_question_index: 0 })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return res.status(500).json({ error: 'Failed to start meeting' })
    }

    // Initialize Redis session
    await setSessionStatus(id, 'waiting')

    // Notify via Socket.io
    const io = req.app.get('io')
    io.to(`meeting:${id}`).emit('meeting-started', { meetingId: id })

    res.json({ status: 'active', meetingId: id })
  } catch (error) {
    console.error('Start meeting error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// End meeting session
router.post('/:id/end', async (req: AppRequest, res: Response) => {
  try {
    const { id } = req.params
    const { facilitatorCode } = req.body as { facilitatorCode?: string }

    // Verify facilitator authorization
    if (!facilitatorCode || !(await verifyFacilitator(id, facilitatorCode))) {
      return res.status(403).json({ error: 'Unauthorized: Invalid facilitator code' })
    }

    const { error } = await supabase.from('meetings').update({ status: 'completed' }).eq('id', id)

    if (error) {
      return res.status(500).json({ error: 'Failed to end meeting' })
    }

    // Clear Redis session
    await clearSession(id)

    // Notify via Socket.io
    const io = req.app.get('io')
    io.to(`meeting:${id}`).emit('meeting-ended', { meetingId: id })

    res.json({ status: 'completed' })
  } catch (error) {
    console.error('End meeting error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

interface AddQuestionsBody {
  questions?: {
    text: string
    allowMultipleAnswers?: boolean
    timeLimitSeconds?: number | null
  }[]
}

// Add questions to meeting
router.post(
  '/:id/questions',
  async (req: Request<{ id: string }, object, AddQuestionsBody>, res: Response) => {
    try {
      const { id } = req.params
      const { questions } = req.body

      if (!questions || !Array.isArray(questions)) {
        return res.status(400).json({ error: 'Questions array is required' })
      }

      // Get current max order_index
      const { data: existingQuestions } = await supabase
        .from('questions')
        .select('order_index')
        .eq('meeting_id', id)
        .order('order_index', { ascending: false })
        .limit(1)

      const startIndex = existingQuestions?.length ? existingQuestions[0].order_index + 1 : 0

      const questionsToInsert = questions.map((q, index) => ({
        meeting_id: id,
        text: q.text,
        order_index: startIndex + index,
        allow_multiple_answers: q.allowMultipleAnswers || false,
        time_limit_seconds: q.timeLimitSeconds || null,
        status: 'pending'
      }))

      const { data, error } = await supabase.from('questions').insert(questionsToInsert).select()

      if (error) {
        return res.status(500).json({ error: 'Failed to add questions' })
      }

      res.status(201).json(data)
    } catch (error) {
      console.error('Add questions error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Get participants for meeting
router.get('/:id/participants', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params

    const { data: participants, error } = await supabase
      .from('participants')
      .select('*')
      .eq('meeting_id', id)
      .eq('is_active', true)

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch participants' })
    }

    res.json(participants || [])
  } catch (error) {
    console.error('Get participants error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
