import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Clock, Users, Eye, Layers } from 'lucide-react'
import { Card, CardContent } from './ui/Card'
import { cn } from '../lib/utils'
import type { QuestionCardProps } from '../types'

export default function QuestionCard({
  question,
  status,
  answeredCount = 0,
  totalCount = 0,
  timerEnd,
  isFacilitator
}: QuestionCardProps) {
  const [timeLeft, setTimeLeft] = useState<number | null>(null)

  useEffect(() => {
    if (!timerEnd) {
      setTimeLeft(null)
      return
    }

    const updateTimer = () => {
      const remaining = Math.max(0, Math.ceil((timerEnd - Date.now()) / 1000))
      setTimeLeft(remaining)
    }

    updateTimer()
    const interval = setInterval(updateTimer, 1000)

    return () => clearInterval(interval)
  }, [timerEnd])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm overflow-hidden relative">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary/50 to-secondary/50" />
      <CardContent className="p-8">
        <div className="flex flex-col items-center space-y-6">
          {/* Timer */}
          {timeLeft !== null && status === 'answering' && (
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-full font-mono text-xl font-bold border",
                timeLeft <= 10 
                  ? "bg-destructive/10 text-destructive border-destructive/20 animate-pulse" 
                  : "bg-secondary/20 text-secondary-foreground border-secondary/30"
              )}
            >
              <Clock className="w-5 h-5" />
              {formatTime(timeLeft)}
            </motion.div>
          )}

          {/* Question Text */}
          <div className="text-center space-y-2">
            <h2 className="text-2xl md:text-3xl font-serif font-medium leading-tight">
              {question.text}
            </h2>
            {question.allowMultipleAnswers && status !== 'revealed' && (
              <div className="inline-flex items-center text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                <Layers className="w-3 h-3 mr-1" />
                Multiple answers allowed
              </div>
            )}
          </div>

          {/* Status Indicators */}
          <div className="flex items-center gap-4">
            {isFacilitator && status === 'answering' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-medium"
              >
                <span className="relative flex h-2.5 w-2.5 mr-1">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
                </span>
                <Users className="w-4 h-4" />
                {answeredCount} of {totalCount} answered
              </motion.div>
            )}

            {status === 'revealed' && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 text-emerald-600 rounded-full text-sm font-medium"
              >
                <Eye className="w-4 h-4" />
                Answers Revealed
              </motion.div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
