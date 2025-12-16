import { useState, useRef, useEffect, type FormEvent } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Edit2, Trash2, X, Check, Plus } from 'lucide-react'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import { cn } from '../lib/utils'
import type { AnswerInputProps } from '../types'

export default function AnswerInput({
  allowMultiple,
  myAnswers,
  onSubmit,
  onEdit,
  onDelete
}: AnswerInputProps) {
  const [newAnswer, setNewAnswer] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editText, setEditText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const submitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Clean up timer on unmount
  useEffect(() => {
    return () => {
      if (submitTimerRef.current) {
        clearTimeout(submitTimerRef.current)
      }
    }
  }, [])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!newAnswer.trim()) return

    setIsSubmitting(true)
    onSubmit(newAnswer.trim())
    setNewAnswer('')
    // Reset submitting state after a brief delay
    submitTimerRef.current = setTimeout(() => setIsSubmitting(false), 300)
  }

  const startEditing = (answerId: string, text: string) => {
    setEditingId(answerId)
    setEditText(text)
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditText('')
  }

  const saveEdit = () => {
    if (!editingId || !editText.trim()) return
    const originalAnswer = myAnswers.find((a) => a.id === editingId)
    // Skip if text hasn't changed
    if (originalAnswer && editText.trim() === originalAnswer.text) {
      setEditingId(null)
      setEditText('')
      return
    }
    onEdit(editingId, editText.trim())
    setEditingId(null)
    setEditText('')
  }

  const handleDelete = (answerId: string) => {
    onDelete(answerId)
  }

  const canAddMore = allowMultiple || myAnswers.length === 0

  return (
    <div className="space-y-6">
      {/* Submitted Answers */}
      <AnimatePresence mode="popLayout">
        {myAnswers.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-3"
          >
            <h4 className="text-sm font-medium text-muted-foreground ml-1">
              Your {myAnswers.length === 1 ? 'Answer' : 'Answers'}
            </h4>
            <div className="space-y-3">
              {myAnswers.map((answer) => (
                <motion.div
                  key={answer.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Card className={cn(
                    "border-l-4 transition-colors",
                    editingId === answer.id ? "border-l-primary border-primary/20" : "border-l-green-500 border-green-500/20"
                  )}>
                    <CardContent className="p-4">
                      {editingId === answer.id ? (
                        <div className="space-y-3">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            className="w-full min-h-[80px] px-3 py-2 bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring focus:border-input resize-none text-sm"
                            autoFocus
                          />
                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={cancelEditing}
                            >
                              <X className="w-4 h-4 mr-1" />
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              disabled={!editText.trim()}
                            >
                              <Check className="w-4 h-4 mr-1" />
                              Save
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-start gap-3">
                          <p className="flex-1 text-foreground whitespace-pre-wrap">{answer.text}</p>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => startEditing(answer.id, answer.text)}
                              className="h-8 w-8 text-muted-foreground hover:text-primary"
                            >
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(answer.id)}
                              className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add New Answer Form */}
      {canAddMore ? (
        <Card className="border-border/50 shadow-lg">
          <CardContent className="p-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <textarea
                value={newAnswer}
                onChange={(e) => setNewAnswer(e.target.value)}
                placeholder={myAnswers.length > 0 ? 'Add another answer...' : 'Type your answer here...'}
                className="w-full min-h-[120px] px-4 py-3 bg-background border border-input rounded-lg focus:outline-none focus:ring-2 focus:ring-ring focus:border-input resize-none text-base transition-shadow"
                disabled={isSubmitting}
              />
              <Button
                type="submit"
                className="w-full"
                size="lg"
                disabled={!newAnswer.trim() || isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center">
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                    Sending...
                  </span>
                ) : (
                  <span className="flex items-center">
                    {myAnswers.length > 0 ? <Plus className="w-4 h-4 mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                    {myAnswers.length > 0 ? 'Add Answer' : 'Submit Answer'}
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-muted-foreground text-center py-2 bg-secondary/30 rounded-lg"
        >
          Only one answer allowed for this question
        </motion.p>
      )}
    </div>
  )
}
