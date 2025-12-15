import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import type { Meeting } from '../types'

interface UseMeetingOptions {
  expectedRole: 'facilitator' | 'participant'
  /** For participant, only fetch after this is set */
  waitFor?: boolean
}

interface UseMeetingReturn {
  meeting: Meeting | null
  loading: boolean
  error: string
  setMeeting: React.Dispatch<React.SetStateAction<Meeting | null>>
  setError: React.Dispatch<React.SetStateAction<string>>
}

export function useMeeting(code: string | undefined, options: UseMeetingOptions): UseMeetingReturn {
  const navigate = useNavigate()
  const { expectedRole, waitFor = true } = options

  const [meeting, setMeeting] = useState<Meeting | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!code || !waitFor) return

    const fetchMeeting = async () => {
      try {
        const response = await fetch(`/api/meetings/code/${code}`)
        if (!response.ok) {
          throw new Error('Meeting not found')
        }
        const data: Meeting = await response.json()

        // Role-based redirect
        if (expectedRole === 'facilitator' && !data.isFacilitator) {
          navigate(`/join/${code}`)
          return
        }
        if (expectedRole === 'participant' && data.isFacilitator) {
          navigate(`/facilitate/${code}`)
          return
        }

        setMeeting(data)
        setLoading(false)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load meeting')
        setLoading(false)
      }
    }

    fetchMeeting()
  }, [code, navigate, expectedRole, waitFor])

  return { meeting, loading, error, setMeeting, setError }
}
