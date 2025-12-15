import GroupedAnswers from './GroupedAnswers'
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
    <div className="space-y-4">
      {/* AI Summary */}
      {isLoadingSummary ? (
        <div className="card p-6 bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
              <svg className="w-5 h-5 text-violet-600 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            </div>
            <span className="text-violet-700 font-medium">Generating AI summary...</span>
          </div>
        </div>
      ) : summary ? (
        <div className="card p-6 bg-gradient-to-r from-violet-50 to-indigo-50 border-violet-100 animate-fade-in">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <svg
                className="w-5 h-5 text-violet-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-violet-900 mb-1">AI Summary</h3>
              <p className="text-violet-800 leading-relaxed">{summary}</p>
            </div>
          </div>
        </div>
      ) : null}

      {/* Group Answers Button (only for facilitator, only when not yet grouped) */}
      {isFacilitator && !groupedAnswers && onGroupAnswers && (
        <div className="flex justify-center">
          <button onClick={onGroupAnswers} disabled={isGrouping} className="btn-secondary">
            {isGrouping ? (
              <>
                <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Grouping...
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                Group Answers with AI
              </>
            )}
          </button>
        </div>
      )}

      {/* Answers - either grouped or flat */}
      <div className="card p-6">
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
          <>
            <h3 className="font-semibold text-neutral-900 mb-4 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-neutral-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              All Responses
              <span className="text-sm font-normal text-neutral-500">({answers.length})</span>
            </h3>
            <div className="space-y-3">
              {answers.map((answer, index) => (
                <div
                  key={answer.id}
                  className="p-4 bg-neutral-50 rounded-xl border border-neutral-100 animate-fade-in-up"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <p className="text-neutral-800 leading-relaxed">{answer.text}</p>
                  {showNames && answer.participantName && (
                    <p className="text-sm text-neutral-500 mt-2 flex items-center gap-1.5">
                      <span className="w-5 h-5 bg-gradient-to-br from-coral-400 to-amber-400 rounded-full flex items-center justify-center text-white text-xs font-bold">
                        {answer.participantName.charAt(0).toUpperCase()}
                      </span>
                      {answer.participantName}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
