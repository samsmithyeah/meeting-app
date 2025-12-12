import { supabase } from '../config/supabase.js'
import {
  getSessionState,
  setSessionStatus,
  setCurrentQuestion,
  addParticipant,
  removeParticipant,
  markAnswered,
  clearAnswered,
  setTimer,
  clearTimer,
  clearSession
} from '../config/redis.js'
import { summarizeAnswers } from '../services/ai.js'
import type { TypedServer, TypedSocket } from '../types/index.js'

export function setupSocketHandlers(io: TypedServer): void {
  io.on('connection', (socket: TypedSocket) => {
    console.log('Client connected:', socket.id)

    // Facilitator joins meeting
    socket.on('facilitator-join', async ({ meetingId }) => {
      try {
        await socket.join(`meeting:${meetingId}`)
        await socket.join(`facilitator:${meetingId}`)
        socket.data.meetingId = meetingId
        socket.data.isFacilitator = true

        const sessionState = await getSessionState(meetingId)
        socket.emit('session-state', sessionState)

        console.log(`Facilitator joined meeting ${meetingId}`)
      } catch (error) {
        console.error('Facilitator join error:', error)
        socket.emit('error', { message: 'Failed to join meeting' })
      }
    })

    // Participant joins meeting
    socket.on('join-meeting', async ({ meetingId, participantName }) => {
      try {
        // Create participant record
        const { data: participant, error } = await supabase
          .from('participants')
          .insert({
            meeting_id: meetingId,
            name: participantName,
            socket_id: socket.id,
            is_active: true
          })
          .select()
          .single()

        if (error) {
          // Check for unique constraint violation (duplicate name)
          if (error.code === '23505') {
            socket.emit('error', {
              message: 'This name is already taken. Please choose a different name.'
            })
            return
          }
          socket.emit('error', { message: 'Failed to join meeting' })
          return
        }

        await socket.join(`meeting:${meetingId}`)
        socket.data.meetingId = meetingId
        socket.data.participantId = participant.id
        socket.data.participantName = participantName

        // Add to Redis session
        await addParticipant(meetingId, participant.id)

        // Get current session state
        const sessionState = await getSessionState(meetingId)
        socket.emit('session-state', sessionState)
        socket.emit('joined', { participantId: participant.id })

        // Notify others
        io.to(`meeting:${meetingId}`).emit('participant-joined', {
          participantId: participant.id,
          name: participantName,
          count: sessionState?.participants?.length || 0
        })

        console.log(`${participantName} joined meeting ${meetingId}`)
      } catch (error) {
        console.error('Join meeting error:', error)
        socket.emit('error', { message: 'Failed to join meeting' })
      }
    })

    // Facilitator starts a question
    socket.on('start-question', async ({ meetingId, questionId, timeLimitSeconds }) => {
      try {
        if (!socket.data.isFacilitator) {
          socket.emit('error', { message: 'Not authorized' })
          return
        }

        // Update question status
        await supabase.from('questions').update({ status: 'active' }).eq('id', questionId)

        // Update Redis session
        await setSessionStatus(meetingId, 'answering')
        await setCurrentQuestion(meetingId, questionId)
        await clearAnswered(meetingId, questionId)

        // Set timer if provided
        let timerEnd: number | null = null
        if (timeLimitSeconds) {
          timerEnd = Date.now() + timeLimitSeconds * 1000
          await setTimer(meetingId, timerEnd)
        } else {
          await clearTimer(meetingId)
        }

        // Get question details
        const { data: question } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single()

        // Broadcast to all in meeting
        io.to(`meeting:${meetingId}`).emit('question-started', {
          questionId,
          question: question?.text,
          allow_multiple_answers: question?.allow_multiple_answers,
          timerEnd
        })

        console.log(`Question started in meeting ${meetingId}`)
      } catch (error) {
        console.error('Start question error:', error)
        socket.emit('error', { message: 'Failed to start question' })
      }
    })

    // Participant submits answer
    socket.on('submit-answer', async ({ meetingId, questionId, answers }) => {
      try {
        if (!socket.data.participantId) {
          socket.emit('error', { message: 'Not a participant' })
          return
        }

        const answersArray = Array.isArray(answers) ? answers : [answers]

        // Save answers to database
        const answersToInsert = answersArray.map((text) => ({
          question_id: questionId,
          participant_id: socket.data.participantId,
          text
        }))

        await supabase.from('answers').insert(answersToInsert)

        // Mark as answered in Redis
        await markAnswered(meetingId, questionId, socket.data.participantId)

        // Get updated session state
        const sessionState = await getSessionState(meetingId)
        const answeredCount = sessionState.answeredParticipants.length
        const totalCount = sessionState.participants.length

        // Notify submission received
        socket.emit('answer-received')

        // Broadcast count update
        io.to(`meeting:${meetingId}`).emit('answer-submitted', {
          answeredCount,
          totalCount,
          allAnswered: answeredCount >= totalCount
        })

        console.log(`Answer submitted by ${socket.data.participantName}`)
      } catch (error) {
        console.error('Submit answer error:', error)
        socket.emit('error', { message: 'Failed to submit answer' })
      }
    })

    // Facilitator reveals answers
    socket.on('reveal-answers', async ({ meetingId, questionId }) => {
      try {
        if (!socket.data.isFacilitator) {
          socket.emit('error', { message: 'Not authorized' })
          return
        }

        // Update question status
        await supabase.from('questions').update({ status: 'revealed' }).eq('id', questionId)

        // Update Redis session
        await setSessionStatus(meetingId, 'revealed')
        await clearTimer(meetingId)

        // Get question and answers
        const { data: question } = await supabase
          .from('questions')
          .select('*')
          .eq('id', questionId)
          .single()

        const { data: meeting } = await supabase
          .from('meetings')
          .select('show_participant_names')
          .eq('id', meetingId)
          .single()

        const { data: answers } = await supabase
          .from('answers')
          .select(
            `
            id,
            text,
            created_at,
            participants (
              id,
              name
            )
          `
          )
          .eq('question_id', questionId)
          .order('created_at')

        // Generate AI summary
        let summary: string | null = null
        try {
          const answerTexts = (answers || []).map((a: { text: string }) => a.text)
          summary = await summarizeAnswers(question?.text || '', answerTexts)
        } catch (e) {
          const errorMessage = (e as Error).message
          console.error(`AI summarization failed for question ${questionId}:`, errorMessage)
          // Notify the facilitator about the failure
          io.to(`facilitator:${meetingId}`).emit('error', {
            message: `AI summary could not be generated: ${errorMessage}`
          })
        }

        // Store summary only if it was successfully generated
        if (summary) {
          await supabase.from('questions').update({ ai_summary: summary }).eq('id', questionId)
        }

        // Format answers based on anonymity setting
        const formattedAnswers = (answers || []).map((a) => {
          const participant = Array.isArray(a.participants) ? a.participants[0] : a.participants
          const participantName = participant?.name ?? null
          return {
            id: a.id,
            text: a.text,
            participantName: meeting?.show_participant_names ? participantName : null
          }
        })

        // Broadcast reveal
        io.to(`meeting:${meetingId}`).emit('answers-revealed', {
          questionId,
          answers: formattedAnswers,
          summary
        })

        console.log(`Answers revealed for question ${questionId}`)
      } catch (error) {
        console.error('Reveal answers error:', error)
        socket.emit('error', { message: 'Failed to reveal answers' })
      }
    })

    // Facilitator moves to next question
    socket.on('next-question', async ({ meetingId, nextQuestionIndex }) => {
      try {
        if (!socket.data.isFacilitator) {
          socket.emit('error', { message: 'Not authorized' })
          return
        }

        // Update meeting
        await supabase
          .from('meetings')
          .update({ current_question_index: nextQuestionIndex })
          .eq('id', meetingId)

        // Reset Redis session state
        await setSessionStatus(meetingId, 'waiting')

        // Broadcast
        io.to(`meeting:${meetingId}`).emit('next-question', {
          questionIndex: nextQuestionIndex
        })

        console.log(`Moving to question ${nextQuestionIndex}`)
      } catch (error) {
        console.error('Next question error:', error)
        socket.emit('error', { message: 'Failed to advance question' })
      }
    })

    // End meeting
    socket.on('end-meeting', async ({ meetingId }) => {
      try {
        if (!socket.data.isFacilitator) {
          socket.emit('error', { message: 'Not authorized' })
          return
        }

        await supabase.from('meetings').update({ status: 'completed' }).eq('id', meetingId)

        await clearSession(meetingId)

        io.to(`meeting:${meetingId}`).emit('meeting-ended')

        console.log(`Meeting ${meetingId} ended`)
      } catch (error) {
        console.error('End meeting error:', error)
      }
    })

    // Handle disconnection
    socket.on('disconnect', async () => {
      try {
        if (socket.data.participantId && socket.data.meetingId) {
          // Mark participant as inactive
          await supabase
            .from('participants')
            .update({ is_active: false, socket_id: null })
            .eq('id', socket.data.participantId)

          // Remove from Redis
          await removeParticipant(socket.data.meetingId, socket.data.participantId)

          // Notify others
          const sessionState = await getSessionState(socket.data.meetingId)
          io.to(`meeting:${socket.data.meetingId}`).emit('participant-left', {
            participantId: socket.data.participantId,
            name: socket.data.participantName || '',
            count: sessionState?.participants?.length || 0
          })
        }

        console.log('Client disconnected:', socket.id)
      } catch (error) {
        console.error('Disconnect error:', error)
      }
    })
  })
}
