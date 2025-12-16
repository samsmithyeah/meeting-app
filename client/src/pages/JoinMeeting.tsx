import { useState, useEffect, useCallback, type FormEvent, type ChangeEvent } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Input } from '../components/ui/Input'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/Card'
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
    <div className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link 
          to="/" 
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Home
        </Link>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          <Card className="border-border/50 shadow-xl bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="text-2xl text-center">Join a Meeting</CardTitle>
              <CardDescription className="text-center">
                Enter the code shared by your facilitator
              </CardDescription>
            </CardHeader>
            <CardContent>
              {error && (
                <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md mb-6 text-center">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                  <label htmlFor="code" className="text-sm font-medium text-center block">
                    Meeting Code
                  </label>
                  <Input
                    type="text"
                    id="code"
                    value={code}
                    onChange={handleCodeChange}
                    maxLength={6}
                    className="text-3xl text-center tracking-[0.5em] font-mono h-16 uppercase"
                    placeholder="ABC123"
                    autoComplete="off"
                  />
                </div>

                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ 
                    opacity: meetingInfo && !meetingInfo.isFacilitator ? 1 : 0,
                    height: meetingInfo && !meetingInfo.isFacilitator ? 'auto' : 0
                  }}
                  className="overflow-hidden"
                >
                  {meetingInfo && !meetingInfo.isFacilitator && (
                    <div className="bg-primary/10 text-primary p-3 rounded-lg flex items-center justify-center text-sm font-medium">
                      <CheckCircle2 className="w-4 h-4 mr-2" />
                      Found: {meetingInfo.title}
                    </div>
                  )}
                </motion.div>

                <div className="space-y-2">
                  <label htmlFor="name" className="text-sm font-medium block">
                    Your Name
                  </label>
                  <Input
                    type="text"
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="h-11"
                    placeholder="Enter your name"
                  />
                </div>

                <Button
                  type="submit"
                  disabled={isJoining || code.length !== 6 || !name.trim()}
                  className="w-full h-11 text-base"
                >
                  {isJoining ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Meeting'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  )
}
