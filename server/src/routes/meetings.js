import { Router } from 'express'
import { customAlphabet } from 'nanoid'
import { supabase } from '../config/supabase.js'
import { setSessionStatus, clearSession } from '../config/redis.js'

const router = Router()
const generateCode = customAlphabet('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 6)

// Create a new meeting
router.post('/', async (req, res) => {
  try {
    const { title, showParticipantNames = true, questions = [] } = req.body

    if (!title) {
      return res.status(400).json({ error: 'Title is required' })
    }

    const facilitatorCode = generateCode()
    const participantCode = generateCode()

    // Create meeting
    const { data: meeting, error: meetingError } = await supabase
      .from('meetings')
      .insert({
        title,
        facilitator_code: facilitatorCode,
        participant_code: participantCode,
        show_participant_names: showParticipantNames,
        status: 'draft'
      })
      .select()
      .single()

    if (meetingError) {
      console.error('Meeting creation error:', meetingError)
      return res.status(500).json({ error: 'Failed to create meeting' })
    }

    // Create questions if provided
    if (questions.length > 0) {
      const questionsToInsert = questions.map((q, index) => ({
        meeting_id: meeting.id,
        text: q.text,
        order_index: index,
        allow_multiple_answers: q.allowMultipleAnswers || false,
        time_limit_seconds: q.timeLimitSeconds || null,
        status: 'pending'
      }))

      const { error: questionsError } = await supabase.from('questions').insert(questionsToInsert)

      if (questionsError) {
        console.error('Questions creation error:', questionsError)
        // Meeting was created but questions failed - still return meeting
      }
    }

    res.status(201).json({
      id: meeting.id,
      title: meeting.title,
      facilitatorCode,
      participantCode,
      showParticipantNames: meeting.show_participant_names
    })
  } catch (error) {
    console.error('Create meeting error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get meeting by code (works for both facilitator and participant codes)
router.get('/code/:code', async (req, res) => {
  try {
    const { code } = req.params
    const upperCode = code.toUpperCase()

    // Try facilitator code first
    let { data: meeting, error } = await supabase
      .from('meetings')
      .select('*')
      .eq('facilitator_code', upperCode)
      .single()

    let isFacilitator = true

    if (!meeting) {
      // Try participant code
      const result = await supabase
        .from('meetings')
        .select('*')
        .eq('participant_code', upperCode)
        .single()

      meeting = result.data
      error = result.error
      isFacilitator = false
    }

    if (error || !meeting) {
      return res.status(404).json({ error: 'Meeting not found' })
    }

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
      questions: questions || []
    })
  } catch (error) {
    console.error('Get meeting error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get meeting by ID
router.get('/:id', async (req, res) => {
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

// Update meeting
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params
    const { title, showParticipantNames, status, currentQuestionIndex } = req.body

    const updates = {}
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
})

// Start meeting session
router.post('/:id/start', async (req, res) => {
  try {
    const { id } = req.params

    // Update meeting status
    const { data: meeting, error } = await supabase
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
router.post('/:id/end', async (req, res) => {
  try {
    const { id } = req.params

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

// Add questions to meeting
router.post('/:id/questions', async (req, res) => {
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

    const startIndex = existingQuestions?.length > 0 ? existingQuestions[0].order_index + 1 : 0

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
})

// Get participants for meeting
router.get('/:id/participants', async (req, res) => {
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
