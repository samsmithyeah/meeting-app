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
      <div className="flex flex-col items-center gap-4 my-6">
        <div className="bg-white p-5 rounded-2xl border border-neutral-200 shadow-soft">
          <QRCodeSVG
            value={url}
            size={size}
            level="M"
            title={`Join meeting with code ${participantCode}`}
          />
        </div>
        <div className="text-center">
          <p className="font-mono text-3xl font-bold text-neutral-900 tracking-widest">
            {participantCode}
          </p>
          <p className="text-sm text-neutral-500 mt-1">Meeting Code</p>
        </div>
        <button onClick={() => setIsFullscreen(true)} className="btn-ghost text-sm">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
            />
          </svg>
          Enlarge for projection
        </button>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center animate-fade-in"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="text-center" onClick={(e) => e.stopPropagation()}>
            <div className="bg-white p-8 rounded-3xl shadow-soft-xl inline-block">
              <QRCodeSVG
                value={url}
                size={Math.min(window.innerWidth, window.innerHeight) * 0.45}
                level="H"
                title={`Join meeting with code ${participantCode}`}
              />
            </div>
            <p className="font-mono text-7xl font-bold gradient-text mt-10 tracking-widest">
              {participantCode}
            </p>
            <p className="text-neutral-500 mt-4 text-xl">
              Scan the QR code or visit{' '}
              <span className="text-coral-600 font-medium">{window.location.origin}</span>
            </p>
          </div>

          {/* Close button */}
          <button
            aria-label="Close fullscreen"
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 p-3 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors"
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

          {/* Instructions */}
          <p className="absolute bottom-8 text-neutral-400 text-sm">
            Press{' '}
            <kbd className="px-2 py-1 bg-neutral-100 rounded text-neutral-600 font-mono">Esc</kbd>{' '}
            or click anywhere to close
          </p>
        </div>
      )}
    </>
  )
}
