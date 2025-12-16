import GroupedAnswers from './GroupedAnswers'
import AnswerCard from './AnswerCard'
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
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-600 animate-spin" fill="none" viewBox="0 0 24 24">
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
            <span className="text-purple-700">Generating AI summary...</span>
          </div>
        </div>
      ) : summary ? (
        <section
          aria-label="AI Summary"
          className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100"
        >
          <div className="flex items-center gap-2 mb-3">
            <svg
              className="w-5 h-5 text-purple-600"
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
            <h3 className="font-semibold text-purple-900">AI Summary</h3>
          </div>
          <p className="text-purple-800">{summary}</p>
        </section>
      ) : null}

      {/* Group Answers Button (only for facilitator, only when not yet grouped) */}
      {isFacilitator && !groupedAnswers && onGroupAnswers && (
        <div className="flex justify-center">
          <button
            onClick={onGroupAnswers}
            disabled={isGrouping}
            className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white rounded-lg font-medium transition-colors"
          >
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
                Group Answers
              </>
            )}
          </button>
        </div>
      )}

      {/* Answers - either grouped or flat */}
      <div className="bg-white rounded-xl shadow-lg p-6">
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
            <h3 className="font-semibold text-gray-900 mb-4">All Responses ({answers.length})</h3>
            <div className="space-y-3">
              {answers.map((answer) => (
                <AnswerCard key={answer.id} answer={answer} showName={showNames} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
