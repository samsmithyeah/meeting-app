import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import type { Meeting } from '../types'

export default function JoinMeeting() {
  const navigate = useNavigate()
  const { code: urlCode } = useParams<{ code?: string }>()
  const [code, setCode] = useState(urlCode || '')
  const [name, setName] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState('')
  const [meetingInfo, setMeetingInfo] = useState<Meeting | null>(null)

  const fetchMeetingInfo = useCallback(
    async (meetingCode: string) => {
      try {
        const response = await fetch(`/api/meetings/code/${meetingCode}`)
        if (response.ok) {
          const data: Meeting = await response.json()
          setMeetingInfo(data)
          setError('')

          // If this is a facilitator code, redirect to facilitator view
          if (data.isFacilitator) {
            navigate(`/facilitate/${meetingCode}`)
          }
        } else {
          setMeetingInfo(null)
        }
      } catch {
        setMeetingInfo(null)
        setError('Unable to connect. Please check your internet connection.')
      }
    },
    [navigate]
  )

  useEffect(() => {
    if (urlCode) {
      fetchMeetingInfo(urlCode)
    }
  }, [urlCode, fetchMeetingInfo])

  const handleCodeChange = (e: ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '')
    setCode(value)
    setError('')

    if (value.length === 6) {
      fetchMeetingInfo(value)
    } else {
      setMeetingInfo(null)
    }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError('')

    if (code.length !== 6) {
      setError('Please enter a valid 6-character code')
      return
    }

    if (!name.trim()) {
      setError('Please enter your name')
      return
    }

    setIsJoining(true)

    try {
      // Verify meeting exists
      const response = await fetch(`/api/meetings/code/${code}`)

      if (!response.ok) {
        throw new Error('Meeting not found')
      }

      const data: Meeting = await response.json()

      if (data.isFacilitator) {
        navigate(`/facilitate/${code}`)
      } else {
        // Store participant name and navigate to session
        sessionStorage.setItem('participantName', name.trim())
        navigate(`/session/${code}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join meeting')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen">
      <div className="container-app py-8 sm:py-10">
        <Link to="/" className="btn-ghost px-3">
          <span aria-hidden>&larr;</span> Home
        </Link>

        <div className="mt-6 mx-auto w-full max-w-lg">
          <div className="surface p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-ink">
                  Join a meeting
                </h1>
                <p className="mt-1 text-sm text-muted">
                  Enter the code shared by your facilitator to hop in instantly.
                </p>
              </div>
              <span className="badge">Participant</span>
            </div>

            {error && (
              <div className="mt-6 toast border-danger/20 bg-danger/5 text-danger">
                <p className="text-sm font-medium">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-ink">
                  Meeting code
                </label>
                <p className="mt-1 text-sm text-muted">6 characters (letters + numbers).</p>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={handleCodeChange}
                  maxLength={6}
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  className="input mt-2 text-center text-2xl tracking-[0.35em] font-mono uppercase"
                  placeholder="ABC123"
                />
              </div>

              {meetingInfo && !meetingInfo.isFacilitator && (
                <div className="rounded-2xl border border-success/25 bg-success/10 p-4 text-success">
                  <p className="text-sm">
                    Found <span className="font-semibold">{meetingInfo.title}</span>
                  </p>
                </div>
              )}

              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-ink">
                  Your name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input mt-2"
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>

              <button
                type="submit"
                disabled={isJoining || code.length !== 6 || !name.trim()}
                className="btn-primary w-full py-3"
              >
                {isJoining ? 'Joining…' : 'Join meeting'}
              </button>
            </form>
          </div>

          <p className="mt-5 text-center text-sm text-muted">
            Tip: If you were given a facilitator code, you’ll be redirected automatically.
          </p>
        </div>
      </div>
    </div>
  )
}
