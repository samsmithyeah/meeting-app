import { useState, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Trash2, ArrowLeft, Clock, Users, Loader2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'

interface QuestionForm {
  id: string
  text: string
  allowMultipleAnswers: boolean
  timeLimitSeconds: number | null
}

const generateQuestionId = () => crypto.randomUUID()

export default function CreateMeeting() {
  const navigate = useNavigate()
  const [title, setTitle] = useState('')
  const [showParticipantNames, setShowParticipantNames] = useState(true)
  const [questions, setQuestions] = useState<QuestionForm[]>([
    { id: generateQuestionId(), text: '', allowMultipleAnswers: false, timeLimitSeconds: null }
  ])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState('')

  const addQuestion = () => {
    setQuestions([
      ...questions,
      { id: generateQuestionId(), text: '', allowMultipleAnswers: false, timeLimitSeconds: null }
    ])
  }

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter((q) => q.id !== id))
    }
  }

  const updateQuestion = (
    id: string,
    field: keyof QuestionForm,
    value: string | boolean | number | null
  ) => {
    setQuestions(questions.map((q) => (q.id === id ? { ...q, [field]: value } : q)))
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (!title.trim()) {
      setError('Please enter a meeting title')
      return
    }

    const validQuestions = questions.filter((q) => q.text.trim())
    if (validQuestions.length === 0) {
      setError('Please add at least one question')
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch('/api/meetings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          showParticipantNames,
          questions: validQuestions.map(({ text, allowMultipleAnswers, timeLimitSeconds }) => ({
            text,
            allowMultipleAnswers,
            timeLimitSeconds
          }))
        })
      })

      if (!response.ok) {
        throw new Error('Failed to create meeting')
      }

      const data = await response.json()
      navigate(`/facilitate/${data.facilitatorCode}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create meeting')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-3xl">Create a Meeting</CardTitle>
              <CardDescription>
                Set up your session details and questions.
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-6">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-8">
                <div className="space-y-4">
                  <div>
                    <label htmlFor="title" className="block text-sm font-medium mb-2">
                      Meeting Title
                    </label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="e.g., Sprint Retrospective"
                      className="text-lg py-6"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center space-x-3 p-4 rounded-lg border border-border bg-muted/30">
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        id="showNames"
                        checked={showParticipantNames}
                        onChange={(e) => setShowParticipantNames(e.target.checked)}
                        className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring"
                      />
                    </div>
                    <div className="flex-1">
                      <label htmlFor="showNames" className="text-sm font-medium cursor-pointer flex items-center">
                        <Users className="w-4 h-4 mr-2 text-muted-foreground" />
                        Show participant names
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">
                        If unchecked, answers will be anonymous.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">Questions</label>
                    <span className="text-xs text-muted-foreground">
                      {questions.length} question{questions.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                  
                  <div className="space-y-4">
                    <AnimatePresence initial={false}>
                      {questions.map((question, index) => (
                        <motion.div
                          key={question.id}
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <div className="p-6 rounded-xl border border-border bg-card hover:border-primary/50 transition-colors group relative">
                            <div className="absolute top-4 left-4 text-xs font-medium text-muted-foreground/50">
                              Q{index + 1}
                            </div>
                            
                            <div className="mt-4 space-y-4">
                              <Input
                                value={question.text}
                                onChange={(e) => updateQuestion(question.id, 'text', e.target.value)}
                                placeholder="Enter your question"
                                className="bg-background"
                              />
                              
                              <div className="flex flex-wrap gap-4 pt-2">
                                <label className="flex items-center text-sm text-muted-foreground cursor-pointer hover:text-foreground transition-colors">
                                  <input
                                    type="checkbox"
                                    checked={question.allowMultipleAnswers}
                                    onChange={(e) =>
                                      updateQuestion(question.id, 'allowMultipleAnswers', e.target.checked)
                                    }
                                    className="h-4 w-4 rounded border-input bg-background text-primary focus:ring-ring mr-2"
                                  />
                                  Allow multiple answers
                                </label>

                                <div className="flex items-center text-sm text-muted-foreground">
                                  <Clock className="w-4 h-4 mr-2" />
                                  <select
                                    value={question.timeLimitSeconds || ''}
                                    onChange={(e: ChangeEvent<HTMLSelectElement>) =>
                                      updateQuestion(
                                        question.id,
                                        'timeLimitSeconds',
                                        e.target.value ? parseInt(e.target.value) : null
                                      )
                                    }
                                    className="bg-transparent border-none text-sm focus:ring-0 cursor-pointer hover:text-foreground transition-colors pr-8"
                                  >
                                    <option value="">No time limit</option>
                                    <option value="30">30 seconds</option>
                                    <option value="60">1 minute</option>
                                    <option value="120">2 minutes</option>
                                    <option value="300">5 minutes</option>
                                  </select>
                                </div>
                              </div>
                            </div>

                            {questions.length > 1 && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={() => removeQuestion(question.id)}
                                className="absolute top-2 right-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>

                  <Button
                    type="button"
                    variant="outline"
                    onClick={addQuestion}
                    className="w-full border-dashed"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Another Question
                  </Button>
                </div>

                <div className="pt-6 border-t border-border">
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full text-lg py-6"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      'Create Meeting'
                    )}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
