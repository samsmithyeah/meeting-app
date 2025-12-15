import { supabase } from '../config/supabase.js'
import {
  getSessionState,
  setSessionStatus,
  setCurrentQuestion,
  addParticipant,
  removeParticipant,
  markAnswered,
  removeAnswered,
  clearAnswered,
  setTimer,
  clearTimer,
  clearSession
} from '../config/redis.js'
import { summarizeAnswers, groupAnswers } from '../services/ai.js'
import {
  saveGroupsToDatabase,
  moveAnswerToGroup,
  createGroup,
  renameGroup,
  deleteGroup
} from '../services/groups.js'
import type { TypedServer, TypedSocket } from '../types/index.js'

// PostgreSQL error codes
const PG_UNIQUE_VIOLATION = '23505'

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
          if (error.code === PG_UNIQUE_VIOLATION) {
            socket.emit('error', {
              message: `The name "${participantName}" is already taken. Please choose a different name.`
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
          allowMultipleAnswers: question?.allow_multiple_answers,
          timerEnd
        })

        console.log(`Question started in meeting ${meetingId}`)
      } catch (error) {
        console.error('Start question error:', error)
        socket.emit('error', { message: 'Failed to start question' })
      }
    })

    // Participant submits a single answer
    socket.on('submit-answer', async ({ meetingId, questionId, text }) => {
      try {
        if (!socket.data.participantId) {
          socket.emit('error', { message: 'Not a participant' })
          return
        }

        // Save answer to database
        const { data: answer, error } = await supabase
          .from('answers')
          .insert({
            question_id: questionId,
            participant_id: socket.data.participantId,
            text
          })
          .select('id, text')
          .single()

        if (error || !answer) {
          socket.emit('error', { message: 'Failed to save answer' })
          return
        }

        // Mark as answered in Redis (on first answer)
        await markAnswered(meetingId, questionId, socket.data.participantId)

        // Get updated session state
        const sessionState = await getSessionState(meetingId)
        const answeredCount = sessionState.answeredParticipants.length
        const totalCount = sessionState.participants.length

        // Get total answer count for this question
        const { count: answerCount } = await supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .eq('question_id', questionId)

        // Send the created answer back to the participant
        socket.emit('answer-received', { answer: { id: answer.id, text: answer.text } })

        // Broadcast count update
        io.to(`meeting:${meetingId}`).emit('answer-submitted', {
          answeredCount,
          totalCount,
          answerCount: answerCount || 0,
          allAnswered: answeredCount >= totalCount
        })

        console.log(`Answer submitted by ${socket.data.participantName}`)
      } catch (error) {
        console.error('Submit answer error:', error)
        socket.emit('error', { message: 'Failed to submit answer' })
      }
    })

    // Participant edits their answer
    socket.on('edit-answer', async ({ answerId, text }) => {
      try {
        if (!socket.data.participantId) {
          socket.emit('error', { message: 'Not a participant' })
          return
        }

        // Verify the answer belongs to this participant and question is still active
        const { data: existingAnswer } = await supabase
          .from('answers')
          .select('participant_id, questions!inner(status)')
          .eq('id', answerId)
          .single()

        if (!existingAnswer) {
          socket.emit('error', { message: 'Answer not found' })
          return
        }

        if (existingAnswer.participant_id !== socket.data.participantId) {
          socket.emit('error', { message: 'Not authorized to edit this answer' })
          return
        }

        const questions = existingAnswer.questions as unknown as { status: string }
        if (questions?.status !== 'active') {
          socket.emit('error', { message: 'Cannot edit answer after question is closed' })
          return
        }

        // Update the answer
        const { data: updatedAnswer, error } = await supabase
          .from('answers')
          .update({ text })
          .eq('id', answerId)
          .select('id, text')
          .single()

        if (error || !updatedAnswer) {
          socket.emit('error', { message: 'Failed to update answer' })
          return
        }

        // Send updated answer back to participant
        socket.emit('answer-updated', {
          answer: { id: updatedAnswer.id, text: updatedAnswer.text }
        })

        console.log(`Answer edited by ${socket.data.participantName}`)
      } catch (error) {
        console.error('Edit answer error:', error)
        socket.emit('error', { message: 'Failed to edit answer' })
      }
    })

    // Participant deletes their answer
    socket.on('delete-answer', async ({ meetingId, answerId }) => {
      try {
        if (!socket.data.participantId) {
          socket.emit('error', { message: 'Not a participant' })
          return
        }

        // Verify the answer belongs to this participant and question is still active
        const { data: existingAnswer } = await supabase
          .from('answers')
          .select('participant_id, question_id, questions!inner(status)')
          .eq('id', answerId)
          .single()

        if (!existingAnswer) {
          socket.emit('error', { message: 'Answer not found' })
          return
        }

        if (existingAnswer.participant_id !== socket.data.participantId) {
          socket.emit('error', { message: 'Not authorized to delete this answer' })
          return
        }

        const questions = existingAnswer.questions as unknown as { status: string }
        if (questions?.status !== 'active') {
          socket.emit('error', { message: 'Cannot delete answer after question is closed' })
          return
        }

        const questionId = existingAnswer.question_id

        // Delete the answer
        await supabase.from('answers').delete().eq('id', answerId)

        // Check if participant has any remaining answers
        const { data: remainingAnswers } = await supabase
          .from('answers')
          .select('id')
          .eq('question_id', questionId)
          .eq('participant_id', socket.data.participantId)

        // If no answers left from this participant, remove them from answered set
        if (!remainingAnswers || remainingAnswers.length === 0) {
          await removeAnswered(meetingId, questionId, socket.data.participantId)
        }

        // Get updated session state
        const sessionState = await getSessionState(meetingId)
        const answeredCount = sessionState.answeredParticipants.length
        const totalCount = sessionState.participants.length

        // Get total answer count for this question
        const { count: answerCount } = await supabase
          .from('answers')
          .select('*', { count: 'exact', head: true })
          .eq('question_id', questionId)

        // Notify participant
        socket.emit('answer-deleted', { answerId })

        // Broadcast updated count
        io.to(`meeting:${meetingId}`).emit('answer-submitted', {
          answeredCount,
          totalCount,
          answerCount: answerCount || 0,
          allAnswered: answeredCount >= totalCount
        })

        console.log(`Answer deleted by ${socket.data.participantName}`)
      } catch (error) {
        console.error('Delete answer error:', error)
        socket.emit('error', { message: 'Failed to delete answer' })
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

        // Format answers based on anonymity setting
        // Note: Array.isArray check is required because Supabase TypeScript types
        // infer joined relations as arrays, even for many-to-one relationships
        const formattedAnswers = (answers || []).map((a) => {
          const participant = Array.isArray(a.participants) ? a.participants[0] : a.participants
          const participantName = participant?.name ?? null
          return {
            id: a.id,
            text: a.text,
            participantName: meeting?.show_participant_names ? participantName : null
          }
        })

        // Broadcast answers immediately (don't wait for AI summary)
        io.to(`meeting:${meetingId}`).emit('answers-revealed', {
          questionId,
          answers: formattedAnswers
        })

        console.log(`Answers revealed for question ${questionId}`)

        // Generate AI summary asynchronously (only for facilitator)
        const answerTexts = (answers || []).map((a: { text: string }) => a.text)
        summarizeAnswers(question?.text || '', answerTexts)
          .then(async (summary) => {
            if (summary) {
              // Store summary in database
              await supabase.from('questions').update({ ai_summary: summary }).eq('id', questionId)
              // Send summary to facilitator
              io.to(`facilitator:${meetingId}`).emit('summary-ready', {
                questionId,
                summary
              })
              console.log(`AI summary generated for question ${questionId}`)
            }
          })
          .catch((e) => {
            const errorMessage = e instanceof Error ? e.message : 'An unknown error occurred'
            console.error(`AI summarization failed for question ${questionId}:`, errorMessage)
            io.to(`facilitator:${meetingId}`).emit('error', {
              message: `AI summary could not be generated: ${errorMessage}`
            })
          })
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

    // Facilitator groups answers using AI
    socket.on('group-answers', async ({ meetingId, questionId }) => {
      try {
        if (!socket.data.isFacilitator) {
          socket.emit('error', { message: 'Not authorized' })
          return
        }

        // Emit loading state to facilitator
        socket.emit('grouping-started', { questionId })

        // Fetch the question
        const { data: question } = await supabase
          .from('questions')
          .select('text')
          .eq('id', questionId)
          .single()

        // Get meeting settings
        const { data: meeting } = await supabase
          .from('meetings')
          .select('show_participant_names')
          .eq('id', meetingId)
          .single()

        // Fetch answers for the question with participant info
        const { data: answers } = await supabase
          .from('answers')
          .select(
            `
            id,
            text,
            participants (id, name)
          `
          )
          .eq('question_id', questionId)

        if (!answers || answers.length === 0) {
          socket.emit('error', { message: 'No answers to group' })
          return
        }

        // Build answers map with participant info
        const answersMap = new Map<
          string,
          { id: string; text: string; participantName: string | null }
        >()
        const answersForAI: { id: string; text: string }[] = []

        for (const answer of answers) {
          const participant = Array.isArray(answer.participants)
            ? answer.participants[0]
            : answer.participants
          const participantName = meeting?.show_participant_names
            ? (participant?.name ?? null)
            : null

          answersMap.set(answer.id, {
            id: answer.id,
            text: answer.text,
            participantName
          })
          answersForAI.push({ id: answer.id, text: answer.text })
        }

        // Call AI to generate groups
        const groupingResult = await groupAnswers(question?.text || '', answersForAI)

        // Save groups to database
        const savedGroups = await saveGroupsToDatabase(questionId, groupingResult, answersMap)

        // Broadcast to all in meeting
        io.to(`meeting:${meetingId}`).emit('answers-grouped', {
          questionId,
          groupedAnswers: savedGroups
        })

        console.log(`Answers grouped for question ${questionId}`)
      } catch (error) {
        console.error('Group answers error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to group answers'
        socket.emit('error', { message: errorMessage })
      }
    })

    // Facilitator updates groups
    socket.on('update-group', async ({ meetingId, questionId, action, payload }) => {
      try {
        if (!socket.data.isFacilitator) {
          socket.emit('error', { message: 'Not authorized' })
          return
        }

        // Get meeting settings
        const { data: meeting } = await supabase
          .from('meetings')
          .select('show_participant_names')
          .eq('id', meetingId)
          .single()

        const showNames = meeting?.show_participant_names ?? true
        let updatedGroups

        switch (action) {
          case 'move-answer':
            if (!payload.answerId) {
              socket.emit('error', { message: 'Missing answerId' })
              return
            }
            updatedGroups = await moveAnswerToGroup(
              questionId,
              payload.answerId,
              payload.targetGroupId ?? null,
              showNames
            )
            break

          case 'create-group':
            if (!payload.name) {
              socket.emit('error', { message: 'Missing group name' })
              return
            }
            updatedGroups = await createGroup(
              questionId,
              payload.name,
              payload.answerIds,
              showNames
            )
            break

          case 'rename-group':
            if (!payload.groupId || !payload.name) {
              socket.emit('error', { message: 'Missing groupId or name' })
              return
            }
            updatedGroups = await renameGroup(questionId, payload.groupId, payload.name, showNames)
            break

          case 'delete-group':
            if (!payload.groupId) {
              socket.emit('error', { message: 'Missing groupId' })
              return
            }
            updatedGroups = await deleteGroup(questionId, payload.groupId, showNames)
            break

          default:
            socket.emit('error', { message: 'Unknown action' })
            return
        }

        // Broadcast updated groups to all in meeting
        io.to(`meeting:${meetingId}`).emit('groups-updated', {
          questionId,
          groupedAnswers: updatedGroups
        })

        console.log(`Groups updated for question ${questionId}: ${action}`)
      } catch (error) {
        console.error('Update group error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to update group'
        socket.emit('error', { message: errorMessage })
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
