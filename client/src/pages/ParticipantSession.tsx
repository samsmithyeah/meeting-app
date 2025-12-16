import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, CheckCircle2, Hourglass } from 'lucide-react'
import { useParticipantSocket } from '../hooks/useParticipantSocket'
import { useMeeting } from '../hooks/useMeeting'
import QuestionCard from '../components/QuestionCard'
import AnswerInput from '../components/AnswerInput'
import AnswerReveal from '../components/AnswerReveal'
import { Card, CardContent } from '../components/ui/Card'

export default function ParticipantSession() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const [participantName, setParticipantName] = useState('')

  // Get participant name from session storage
  useEffect(() => {
    const name = sessionStorage.getItem('participantName')
    if (!name) {
      navigate(`/join/${code}`)
      return
    }
    setParticipantName(name)
  }, [code, navigate])

  const {
    meeting,
    loading,
    error: fetchError
  } = useMeeting(code, { expectedRole: 'participant', waitFor: !!participantName })

  const {
    sessionStatus,
    currentQuestion,
    myAnswers,
    revealedAnswers,
    timerEnd,
    answeredCount,
    totalCount,
    error: socketError,
    meetingStatus,
    submitAnswer,
    editAnswer,
    deleteAnswer
  } = useParticipantSocket(meeting, participantName)

  const error = fetchError || socketError

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-destructive font-medium">{error}</div>
      </div>
    )
  }

  if (!meeting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-muted-foreground">Meeting not found</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container max-w-lg mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="text-sm font-semibold truncate max-w-[200px]">{meeting.title}</h1>
          <div className="flex items-center text-xs text-muted-foreground bg-secondary/50 px-2 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
            {participantName}
          </div>
        </div>
      </header>

      <main className="container max-w-lg mx-auto px-4 py-6">
        <AnimatePresence mode="wait">
          {/* Waiting for meeting to start */}
          {meetingStatus === 'draft' && (
            <motion.div
              key="draft"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-primary/10 rounded-full mx-auto flex items-center justify-center mb-6">
                    <Hourglass className="w-8 h-8 text-primary animate-pulse" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">Waiting to Start</h2>
                  <p className="text-muted-foreground">The facilitator will begin the meeting shortly.</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Meeting active - waiting for question */}
          {meetingStatus === 'active' && sessionStatus === 'waiting' && !currentQuestion && (
            <motion.div
              key="waiting"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-500/10 rounded-full mx-auto flex items-center justify-center mb-6">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h2 className="text-xl font-semibold mb-2">You're In!</h2>
                  <p className="text-muted-foreground">Waiting for the next question...</p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Answering question */}
          {sessionStatus === 'answering' && currentQuestion && (
            <motion.div
              key="answering"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <QuestionCard
                question={currentQuestion}
                status={sessionStatus}
                timerEnd={timerEnd}
                isFacilitator={false}
              />

              <AnswerInput
                allowMultiple={currentQuestion.allowMultipleAnswers ?? false}
                myAnswers={myAnswers}
                onSubmit={submitAnswer}
                onEdit={editAnswer}
                onDelete={deleteAnswer}
              />

              {myAnswers.length > 0 && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-sm text-muted-foreground bg-secondary/30 py-2 rounded-lg"
                >
                  {answeredCount}/{totalCount} participants have answered
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Answers revealed */}
          {sessionStatus === 'revealed' && revealedAnswers && (
            <motion.div
              key="revealed"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {currentQuestion && (
                <QuestionCard
                  question={currentQuestion}
                  status={sessionStatus}
                  isFacilitator={false}
                />
              )}
              
              <AnswerReveal
                answers={revealedAnswers}
                showNames={meeting.showParticipantNames ?? true}
                isFacilitator={false}
              />
              
              <div className="bg-primary/10 rounded-xl p-4 text-center">
                <p className="text-primary font-medium flex items-center justify-center">
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Waiting for facilitator to continue...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  )
}
