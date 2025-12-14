import { Router, Request, Response } from 'express'
import { supabase } from '../config/supabase.js'
import { summarizeAnswers } from '../services/ai.js'

const router = Router()

// Helper to verify facilitator authorization for a question
async function verifyQuestionFacilitator(
  questionId: string,
  facilitatorCode: string
): Promise<boolean> {
  const { data } = await supabase.rpc('verify_question_facilitator', {
    p_question_id: questionId,
    p_facilitator_code: facilitatorCode
  })
  return data === true
}

// Get question by ID with answers
router.get('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params

    const { data: question, error } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    res.json(question)
  } catch (error) {
    console.error('Get question error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Get answers for a question
router.get('/:id/answers', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params

    const { data: answers, error } = await supabase
      .from('answers')
      .select(
        `
        *,
        participants (
          id,
          name
        )
      `
      )
      .eq('question_id', id)
      .order('created_at')

    if (error) {
      return res.status(500).json({ error: 'Failed to fetch answers' })
    }

    res.json(answers || [])
  } catch (error) {
    console.error('Get answers error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

interface UpdateQuestionBody {
  facilitatorCode?: string
  text?: string
  allowMultipleAnswers?: boolean
  timeLimitSeconds?: number | null
  status?: string
}

// Update question
router.put(
  '/:id',
  async (req: Request<{ id: string }, object, UpdateQuestionBody>, res: Response) => {
    try {
      const { id } = req.params
      const { facilitatorCode, text, allowMultipleAnswers, timeLimitSeconds, status } = req.body

      // Verify facilitator authorization
      if (!facilitatorCode || !(await verifyQuestionFacilitator(id, facilitatorCode))) {
        return res.status(403).json({ error: 'Unauthorized: Invalid facilitator code' })
      }

      const updates: Record<string, unknown> = {}
      if (text !== undefined) updates.text = text
      if (allowMultipleAnswers !== undefined) updates.allow_multiple_answers = allowMultipleAnswers
      if (timeLimitSeconds !== undefined) updates.time_limit_seconds = timeLimitSeconds
      if (status !== undefined) updates.status = status

      const { data: question, error } = await supabase
        .from('questions')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        return res.status(500).json({ error: 'Failed to update question' })
      }

      res.json(question)
    } catch (error) {
      console.error('Update question error:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

// Delete question
router.delete('/:id', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const { facilitatorCode } = req.body as { facilitatorCode?: string }

    // Verify facilitator authorization
    if (!facilitatorCode || !(await verifyQuestionFacilitator(id, facilitatorCode))) {
      return res.status(403).json({ error: 'Unauthorized: Invalid facilitator code' })
    }

    const { error } = await supabase.from('questions').delete().eq('id', id)

    if (error) {
      return res.status(500).json({ error: 'Failed to delete question' })
    }

    res.json({ success: true })
  } catch (error) {
    console.error('Delete question error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

// Generate AI summary for question
router.post('/:id/summarize', async (req: Request<{ id: string }>, res: Response) => {
  try {
    const { id } = req.params
    const { facilitatorCode } = req.body as { facilitatorCode?: string }

    // Verify facilitator authorization
    if (!facilitatorCode || !(await verifyQuestionFacilitator(id, facilitatorCode))) {
      return res.status(403).json({ error: 'Unauthorized: Invalid facilitator code' })
    }

    // Get question
    const { data: question, error: questionError } = await supabase
      .from('questions')
      .select('*')
      .eq('id', id)
      .single()

    if (questionError || !question) {
      return res.status(404).json({ error: 'Question not found' })
    }

    // Get answers
    const { data: answers, error: answersError } = await supabase
      .from('answers')
      .select('text')
      .eq('question_id', id)

    if (answersError) {
      return res.status(500).json({ error: 'Failed to fetch answers' })
    }

    const answerTexts = (answers || []).map((a: { text: string }) => a.text)
    const summary = await summarizeAnswers(question.text, answerTexts)

    // Store summary
    await supabase.from('questions').update({ ai_summary: summary }).eq('id', id)

    res.json({ summary })
  } catch (error) {
    console.error('Summarize error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

export default router
