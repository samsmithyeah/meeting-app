import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Copy, 
  Users, 
  Play, 
  CheckCircle2, 
  ArrowRight, 
  XOctagon, 
  Share2, 
  QrCode, 
  Loader2,
  AlertCircle
} from 'lucide-react'
import { useFacilitatorSocket } from '../hooks/useFacilitatorSocket'
import { useMeeting } from '../hooks/useMeeting'
import QuestionCard from '../components/QuestionCard'
import AnswerReveal from '../components/AnswerReveal'
import QRCodeDisplay from '../components/QRCodeDisplay'
import { Button } from '../components/ui/Button'
import { Card, CardContent } from '../components/ui/Card'

export default function FacilitatorSession() {
  const { code } = useParams<{ code: string }>()
  const navigate = useNavigate()

  const {
    meeting,
    loading,
    error: fetchError,
    setMeeting,
    setError: setFetchError
  } = useMeeting(code, { expectedRole: 'facilitator' })

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [copied, setCopied] = useState(false)

  const {
    sessionStatus,
    participantCount,
    answeredCount,
    answerCount,
    revealedAnswers,
    summary,
    isLoadingSummary,
    timerEnd,
    error: socketError,
    setError: setSocketError,
    startQuestion,
    revealAnswers,
    nextQuestion,
    endMeeting,
    groupedAnswers,
    isGrouping,
    groupAnswers,
    updateGroup
  } = useFacilitatorSocket(meeting)

  // Sync currentQuestionIndex when meeting loads
  useEffect(() => {
    if (meeting?.currentQuestionIndex !== undefined) {
      setCurrentQuestionIndex(meeting.currentQuestionIndex || 0)
    }
  }, [meeting?.currentQuestionIndex])

  const currentQuestion = meeting?.questions?.[currentQuestionIndex]

  const startMeeting = async () => {
    if (!meeting?.facilitatorCode) return
    try {
      await fetch(`/api/meetings/${meeting.id}/start`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${meeting.facilitatorCode}`
        }
      })
      setMeeting((prev) => (prev ? { ...prev, status: 'active' } : null))
    } catch {
      setFetchError('Failed to start meeting')
    }
  }

  const handleStartQuestion = () => {
    if (!currentQuestion) return
    startQuestion(currentQuestion.id, currentQuestion.timeLimitSeconds)
  }

  const handleRevealAnswers = () => {
    if (!currentQuestion) return
    revealAnswers(currentQuestion.id)
  }

  const handleNextQuestion = () => {
    if (!meeting?.questions || currentQuestionIndex >= meeting.questions.length - 1) return
    const nextIndex = currentQuestionIndex + 1
    nextQuestion(nextIndex)
    setCurrentQuestionIndex(nextIndex)
  }

  const handleEndMeeting = () => {
    endMeeting()
    navigate('/')
  }

  const handleGroupAnswers = () => {
    if (!currentQuestion) return
    groupAnswers(currentQuestion.id)
  }

  const handleMoveAnswer = (answerId: string, targetGroupId: string | null) => {
    if (!currentQuestion) return
    updateGroup(currentQuestion.id, 'move-answer', { answerId, targetGroupId })
  }

  const handleCreateGroup = (name: string) => {
    if (!currentQuestion) return
    updateGroup(currentQuestion.id, 'create-group', { name })
  }

  const handleRenameGroup = (groupId: string, name: string) => {
    if (!currentQuestion) return
    updateGroup(currentQuestion.id, 'rename-group', { groupId, name })
  }

  const handleDeleteGroup = (groupId: string) => {
    if (!currentQuestion) return
    updateGroup(currentQuestion.id, 'delete-group', { groupId })
  }

  const copyJoinLink = () => {
    if (!meeting) return
    const link = `${window.location.origin}/join/${meeting.participantCode}`
    navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (fetchError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive font-medium">{fetchError}</p>
          </CardContent>
        </Card>
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

  const isLastQuestion = meeting.questions
    ? currentQuestionIndex >= meeting.questions.length - 1
    : true

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* Dismissible error notification */}
      <AnimatePresence>
        {socketError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 max-w-md bg-destructive text-destructive-foreground rounded-lg shadow-lg p-4 flex items-center gap-3"
          >
            <p className="text-sm flex-1">{socketError}</p>
            <button onClick={() => setSocketError('')} className="text-destructive-foreground/80 hover:text-destructive-foreground">
              <XOctagon className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-16 items-center justify-between px-4">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">{meeting.title}</h1>
            <p className="text-xs text-muted-foreground">Facilitator View</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center text-sm text-muted-foreground bg-secondary/50 px-3 py-1.5 rounded-full">
              <Users className="w-4 h-4 mr-2" />
              <span className="font-medium text-foreground mr-1">{participantCount}</span>
              <span className="hidden sm:inline">participants</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={copyJoinLink}
              className="hidden sm:flex"
            >
              {copied ? <CheckCircle2 className="w-4 h-4 mr-2" /> : <Share2 className="w-4 h-4 mr-2" />}
              {copied ? 'Copied!' : `Code: ${meeting.participantCode}`}
            </Button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl mx-auto px-4 py-8">
        {/* Meeting not started */}
        {meeting.status === 'draft' && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary to-secondary" />
              <CardContent className="p-12 text-center">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <QrCode className="w-10 h-10 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-4">Ready to Start?</h2>
                <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                  Share the code or QR code with your team. Once everyone has joined, start the meeting to begin the first question.
                </p>
                
                <div className="flex justify-center mb-8">
                  <QRCodeDisplay
                    url={`${window.location.origin}/join/${meeting.participantCode}`}
                    participantCode={meeting.participantCode}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Button
                    variant="secondary"
                    size="lg"
                    onClick={copyJoinLink}
                    className="w-full sm:w-auto"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Join Link
                  </Button>
                  <Button
                    size="lg"
                    onClick={startMeeting}
                    className="w-full sm:w-auto"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Meeting
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Active meeting */}
        {meeting.status === 'active' && currentQuestion && (
          <div className="space-y-8">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  Question <span className="text-foreground font-medium">{currentQuestionIndex + 1}</span> of {meeting.questions?.length || 0}
                </span>
                <span className="text-muted-foreground">
                  {Math.round(((currentQuestionIndex + 1) / (meeting.questions?.length || 1)) * 100)}% Complete
                </span>
              </div>
              <div className="h-2 w-full bg-secondary/30 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${((currentQuestionIndex + 1) / (meeting.questions?.length || 1)) * 100}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>

            {/* Question */}
            <QuestionCard
              question={currentQuestion}
              status={sessionStatus}
              answeredCount={answeredCount}
              totalCount={participantCount}
              timerEnd={timerEnd}
              isFacilitator={true}
            />

            {/* Placeholder cards while answering */}
            {sessionStatus === 'answering' && answerCount > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card/50 border border-border/50 rounded-xl p-6 backdrop-blur-sm"
              >
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin text-primary" />
                  Answers Received
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                  {Array.from({ length: answerCount }).map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                      className="h-20 bg-secondary/30 border border-secondary/50 rounded-lg flex items-center justify-center"
                    >
                      <CheckCircle2 className="w-8 h-8 text-primary/50" />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Revealed Answers */}
            {sessionStatus === 'revealed' && revealedAnswers && (
              <AnswerReveal
                answers={revealedAnswers}
                summary={summary}
                isLoadingSummary={isLoadingSummary}
                showNames={meeting.showParticipantNames ?? true}
                groupedAnswers={groupedAnswers}
                isGrouping={isGrouping}
                isFacilitator={true}
                onGroupAnswers={handleGroupAnswers}
                onMoveAnswer={handleMoveAnswer}
                onCreateGroup={handleCreateGroup}
                onRenameGroup={handleRenameGroup}
                onDeleteGroup={handleDeleteGroup}
              />
            )}

            {/* Controls */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background/80 backdrop-blur-md border-t border-border z-40">
              <div className="container max-w-5xl mx-auto flex justify-center gap-4">
                {sessionStatus === 'waiting' && (
                  <Button
                    size="lg"
                    onClick={handleStartQuestion}
                    disabled={participantCount === 0}
                    className="w-full sm:w-auto min-w-[200px]"
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Question
                  </Button>
                )}

                {sessionStatus === 'answering' && (
                  <Button
                    size="lg"
                    onClick={handleRevealAnswers}
                    className="w-full sm:w-auto min-w-[200px] bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Reveal Answers ({answeredCount}/{participantCount})
                  </Button>
                )}

                {sessionStatus === 'revealed' && (
                  <>
                    {!isLastQuestion ? (
                      <Button
                        size="lg"
                        onClick={handleNextQuestion}
                        className="w-full sm:w-auto min-w-[200px]"
                      >
                        Next Question
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : (
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={handleEndMeeting}
                        className="w-full sm:w-auto min-w-[200px]"
                      >
                        End Meeting
                        <XOctagon className="w-4 h-4 ml-2" />
                      </Button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
