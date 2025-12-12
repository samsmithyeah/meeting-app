import type { AnswerRevealProps } from '../types'

export default function AnswerReveal({ answers, summary, showNames }: AnswerRevealProps) {
  return (
    <div className="space-y-4">
      {/* AI Summary */}
      {summary && (
        <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-xl p-6 border border-purple-100">
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
        </div>
      )}

      {/* Answers */}
      <div className="bg-white rounded-xl shadow-lg p-6">
        <h3 className="font-semibold text-gray-900 mb-4">All Responses ({answers.length})</h3>
        <div className="space-y-3">
          {answers.map((answer) => (
            <div
              key={answer.id}
              className="p-4 bg-gray-50 rounded-lg border border-gray-100"
            >
              <p className="text-gray-800">{answer.text}</p>
              {showNames && answer.participantName && (
                <p className="text-sm text-gray-500 mt-2">— {answer.participantName}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
