import { Link } from 'react-router-dom'

export default function Home() {
  return (
    <div className="min-h-screen">
      <div className="container-app py-10 sm:py-14">
        <header className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-accent to-accent2 text-white shadow-glow flex items-center justify-center">
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 10h8M8 14h5m-7 7h12a2 2 0 002-2V7a2 2 0 00-2-2H8l-4 4v10a2 2 0 002 2z"
                />
              </svg>
            </div>
            <div className="leading-tight">
              <p className="text-sm font-semibold tracking-tight text-ink">Meeting Facilitator</p>
              <p className="text-xs text-muted">Gather answers, reveal together.</p>
            </div>
          </div>
          <span className="badge">Realtime • No sign-in</span>
        </header>

        <div className="mt-10 grid gap-8 lg:grid-cols-2 lg:items-center">
          <div className="space-y-6 animate-fade-up">
            <h1 className="text-balance text-5xl sm:text-6xl font-semibold tracking-tight text-ink">
              Facilitate meetings with clarity and momentum.
            </h1>
            <p className="text-balance text-lg text-muted">
              Ask a question, collect responses in real time, then reveal them together for better,
              calmer conversations.
            </p>

            <div className="flex flex-col sm:flex-row gap-3">
              <Link to="/create" className="btn-primary w-full sm:w-auto">
                Create a Meeting
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </Link>
              <Link to="/join" className="btn-secondary w-full sm:w-auto">
                Join with a Code
              </Link>
            </div>

            <div className="flex flex-wrap gap-2">
              <span className="pill">
                <span className="h-2 w-2 rounded-full bg-success" />
                Anonymous-friendly
              </span>
              <span className="pill">
                <span className="h-2 w-2 rounded-full bg-accent2" />
                Timed questions
              </span>
              <span className="pill">
                <span className="h-2 w-2 rounded-full bg-accent" />
                Drag-and-drop grouping
              </span>
            </div>
          </div>

          <div className="surface p-6 sm:p-8">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-sm font-semibold tracking-tight text-ink">How it works</h2>
              <span className="badge">Designed for facilitation</span>
            </div>
            <div className="divider my-5" />
            <ol className="space-y-5">
              <li className="flex gap-4">
                <span className="badge mt-0.5">1</span>
                <div>
                  <p className="font-semibold text-ink">Create a meeting</p>
                  <p className="text-sm text-muted">
                    Add questions, optional timers, and name display.
                  </p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="badge mt-0.5">2</span>
                <div>
                  <p className="font-semibold text-ink">Share the join code</p>
                  <p className="text-sm text-muted">Participants join instantly from any device.</p>
                </div>
              </li>
              <li className="flex gap-4">
                <span className="badge mt-0.5">3</span>
                <div>
                  <p className="font-semibold text-ink">Reveal and synthesize</p>
                  <p className="text-sm text-muted">
                    Reveal responses, group themes, and keep the room moving.
                  </p>
                </div>
              </li>
            </ol>
          </div>
        </div>

        <footer className="mt-12 text-sm text-muted">
          Perfect for retrospectives, brainstorming, and team feedback sessions.
        </footer>
      </div>
    </div>
  )
}
