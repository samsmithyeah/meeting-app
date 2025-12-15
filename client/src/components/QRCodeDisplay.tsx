import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  url: string
  participantCode: string
  size?: number
}

export default function QRCodeDisplay({ url, participantCode, size = 200 }: QRCodeDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  useEffect(() => {
    if (!isFullscreen) return

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsFullscreen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [isFullscreen])

  return (
    <>
      {/* Inline QR Code */}
      <div className="flex flex-col items-center gap-3 my-6">
        <div className="rounded-3xl border border-stroke/70 bg-surface2/70 p-4 shadow-inset">
          <QRCodeSVG
            value={url}
            size={size}
            level="M"
            title={`Join meeting with code ${participantCode}`}
          />
        </div>
        <p className="font-mono text-2xl font-semibold tracking-[0.35em] text-ink">
          {participantCode}
        </p>
        <button onClick={() => setIsFullscreen(true)} className="btn-secondary px-4 py-2">
          Enlarge for projection
        </button>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-canvas flex flex-col items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="text-center animate-fade-up" onClick={(e) => e.stopPropagation()}>
            <QRCodeSVG
              value={url}
              size={Math.min(window.innerWidth, window.innerHeight) * 0.5}
              level="H"
              title={`Join meeting with code ${participantCode}`}
            />
            <p className="font-mono text-6xl font-semibold tracking-[0.25em] text-ink mt-8">
              {participantCode}
            </p>
            <p className="text-muted mt-4 text-xl">
              Scan to join or visit {window.location.origin}
            </p>
          </div>
          <button
            aria-label="Close fullscreen"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 btn-ghost px-3 py-2"
          >
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
