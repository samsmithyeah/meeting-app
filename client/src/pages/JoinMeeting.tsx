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
    <div className="min-h-screen bg-gradient-hero relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="blob blob-coral w-80 h-80 -top-40 right-0 animate-float" />
      <div className="blob blob-amber w-64 h-64 bottom-20 -left-32 animate-float animation-delay-300" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full">
          {/* Back link */}
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-neutral-600 hover:text-coral-600 font-medium mb-6 transition-colors animate-fade-in"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            Back to Home
          </Link>

          {/* Main card */}
          <div className="card p-8 animate-fade-in-up">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-gradient-to-br from-coral-100 to-amber-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-coral-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
              <h1 className="text-2xl font-bold text-neutral-900 mb-2">Join a Meeting</h1>
              <p className="text-neutral-500">Enter the code shared by your facilitator</p>
            </div>

            {/* Error message */}
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex items-center gap-3 animate-fade-in-down">
                <svg
                  className="w-5 h-5 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-sm">{error}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Meeting code input */}
              <div>
                <label htmlFor="code" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Meeting Code
                </label>
                <input
                  type="text"
                  id="code"
                  value={code}
                  onChange={handleCodeChange}
                  maxLength={6}
                  className="input-field text-2xl text-center tracking-[0.3em] font-mono font-bold uppercase placeholder:tracking-normal placeholder:text-base"
                  placeholder="ABC123"
                  autoComplete="off"
                />
              </div>

              {/* Meeting found indicator */}
              {meetingInfo && !meetingInfo.isFacilitator && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-xl flex items-center gap-3 animate-scale-in">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Meeting found</p>
                    <p className="text-sm text-green-600">{meetingInfo.title}</p>
                  </div>
                </div>
              )}

              {/* Name input */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-neutral-700 mb-2">
                  Your Name
                </label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Enter your name"
                  autoComplete="name"
                />
              </div>

              {/* Submit button */}
              <button
                type="submit"
                disabled={isJoining || code.length !== 6 || !name.trim()}
                className="btn-primary w-full py-4 text-lg"
              >
                {isJoining ? (
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
                    Joining...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                      />
                    </svg>
                    Join Meeting
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
