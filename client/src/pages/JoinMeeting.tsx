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

          // If this is a facilitator code, redirect to facilitator view
          if (data.isFacilitator) {
            navigate(`/facilitate/${meetingCode}`)
          }
        }
      } catch {
        // Silently fail - will show error on join attempt
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
        sessionStorage.setItem('meetingId', data.id)
        navigate(`/session/${code}`)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join meeting')
    } finally {
      setIsJoining(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-md w-full mx-4">
        <Link to="/" className="text-indigo-600 hover:text-indigo-800 mb-6 inline-block">
          &larr; Back to Home
        </Link>

        <div className="bg-white rounded-xl shadow-lg p-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Join a Meeting</h1>
          <p className="text-gray-600 mb-6">Enter the code shared by your facilitator</p>

          {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">{error}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
                Meeting Code
              </label>
              <input
                type="text"
                id="code"
                value={code}
                onChange={handleCodeChange}
                maxLength={6}
                className="w-full px-4 py-3 text-2xl text-center tracking-widest font-mono border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 uppercase"
                placeholder="ABC123"
              />
            </div>

            {meetingInfo && !meetingInfo.isFacilitator && (
              <div className="bg-green-50 text-green-700 p-3 rounded-lg">
                Found: <strong>{meetingInfo.title}</strong>
              </div>
            )}

            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name
              </label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your name"
              />
            </div>

            <button
              type="submit"
              disabled={isJoining || code.length !== 6 || !name.trim()}
              className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
            >
              {isJoining ? 'Joining...' : 'Join Meeting'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
