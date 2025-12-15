import { useState } from 'react'
import { QRCodeSVG } from 'qrcode.react'

interface QRCodeDisplayProps {
  url: string
  participantCode: string
  size?: number
}

export default function QRCodeDisplay({ url, participantCode, size = 200 }: QRCodeDisplayProps) {
  const [isFullscreen, setIsFullscreen] = useState(false)

  return (
    <>
      {/* Inline QR Code */}
      <div className="flex flex-col items-center gap-3 my-6">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <QRCodeSVG
            value={url}
            size={size}
            level="M"
            title={`Join meeting with code ${participantCode}`}
          />
        </div>
        <p className="font-mono text-2xl font-bold text-gray-900">{participantCode}</p>
        <button
          onClick={() => setIsFullscreen(true)}
          className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
        >
          Enlarge for projection
        </button>
      </div>

      {/* Fullscreen Modal */}
      {isFullscreen && (
        <div
          className="fixed inset-0 z-50 bg-white flex flex-col items-center justify-center"
          onClick={() => setIsFullscreen(false)}
        >
          <div className="text-center">
            <QRCodeSVG
              value={url}
              size={Math.min(window.innerWidth, window.innerHeight) * 0.5}
              level="H"
              title={`Join meeting with code ${participantCode}`}
            />
            <p className="font-mono text-6xl font-bold text-gray-900 mt-8">{participantCode}</p>
            <p className="text-gray-500 mt-4 text-xl">
              Scan to join or visit {window.location.origin}
            </p>
          </div>
          <button
            onClick={() => setIsFullscreen(false)}
            className="absolute top-6 right-6 text-gray-500 hover:text-gray-700"
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
