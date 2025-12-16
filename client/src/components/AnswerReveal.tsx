import { motion } from 'framer-motion'
import { Sparkles, Layers, Loader2 } from 'lucide-react'
import GroupedAnswers from './GroupedAnswers'
import { Button } from './ui/Button'
import { Card, CardContent } from './ui/Card'
import type { AnswerRevealProps } from '../types'

export default function AnswerReveal({
  answers,
  summary,
  isLoadingSummary,
  showNames,
  groupedAnswers,
  isGrouping,
  isFacilitator,
  onGroupAnswers,
  onMoveAnswer,
  onCreateGroup,
  onRenameGroup,
  onDeleteGroup
}: AnswerRevealProps) {
  return (
    <div className="space-y-6">
      {/* AI Summary */}
      {(isLoadingSummary || summary) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <Card className="border-purple-200 bg-gradient-to-r from-purple-50/50 to-indigo-50/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-3">
                {isLoadingSummary ? (
                  <Loader2 className="w-5 h-5 text-purple-600 animate-spin" />
                ) : (
                  <Sparkles className="w-5 h-5 text-purple-600" />
                )}
                <h3 className="font-semibold text-purple-900">
                  {isLoadingSummary ? 'Generating AI summary...' : 'AI Summary'}
                </h3>
              </div>
              {summary && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-purple-800 leading-relaxed"
                >
                  {summary}
                </motion.p>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Group Answers Button (only for facilitator, only when not yet grouped) */}
      {isFacilitator && !groupedAnswers && onGroupAnswers && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center"
        >
          <Button
            onClick={onGroupAnswers}
            disabled={isGrouping}
            size="lg"
            className="bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200"
          >
            {isGrouping ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Grouping...
              </>
            ) : (
              <>
                <Layers className="w-5 h-5 mr-2" />
                Group Answers with AI
              </>
            )}
          </Button>
        </motion.div>
      )}

      {/* Answers - either grouped or flat */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        {groupedAnswers ? (
          <GroupedAnswers
            data={groupedAnswers}
            showNames={showNames}
            isFacilitator={isFacilitator ?? false}
            onMoveAnswer={onMoveAnswer}
            onCreateGroup={onCreateGroup}
            onRenameGroup={onRenameGroup}
            onDeleteGroup={onDeleteGroup}
          />
        ) : (
          <Card className="border-border/50 shadow-lg bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <h3 className="font-semibold text-foreground mb-4 flex items-center">
                All Responses 
                <span className="ml-2 text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">
                  {answers.length}
                </span>
              </h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {answers.map((answer, index) => (
                  <motion.div
                    key={answer.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 bg-background/50 rounded-lg border border-border/50 hover:border-primary/30 transition-colors"
                  >
                    <p className="text-foreground">{answer.text}</p>
                    {showNames && answer.participantName && (
                      <p className="text-xs text-muted-foreground mt-2 font-medium">— {answer.participantName}</p>
                    )}
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </motion.div>
    </div>
  )
}
