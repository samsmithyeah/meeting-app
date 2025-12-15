import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="blob blob-coral w-96 h-96 -top-48 -left-48 animate-float" />
      <div className="blob blob-amber w-80 h-80 top-1/3 -right-40 animate-float animation-delay-300" />
      <div className="blob blob-violet w-72 h-72 bottom-20 left-1/4 animate-float animation-delay-600" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-lg w-full">
          {/* Hero text */}
          <div className="text-center mb-10 animate-fade-in-up">
            <h1 className="text-5xl sm:text-6xl font-black text-neutral-900 tracking-tight mb-4">
              Meeting
              <span className="gradient-text block">Facilitator</span>
            </h1>
            <p className="text-lg text-neutral-600 max-w-md mx-auto">
              Gather answers from your team and reveal them together. Perfect for retrospectives,
              brainstorming, and feedback.
            </p>
          </div>

          {/* Action card */}
          <div className="card p-8 animate-fade-in-up animation-delay-150">
            <div className="space-y-4">
              <Link to="/create" className="btn-primary w-full text-lg py-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Create a Meeting
              </Link>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-neutral-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-neutral-400 font-medium">or</span>
                </div>
              </div>

              <Link to="/join" className="btn-secondary w-full text-lg py-4">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                  />
                </svg>
                Join a Meeting
              </Link>
            </div>
          </div>

          {/* Footer text */}
          <p className="text-center text-neutral-500 text-sm mt-8 animate-fade-in animation-delay-300">
            No sign-up required. Start collaborating in seconds.
          </p>
        </div>
      </div>
    </div>
  )
}
