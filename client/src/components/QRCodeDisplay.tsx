import { useState, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, X } from 'lucide-react'
import { Button } from './ui/Button'
import { Card } from './ui/Card'

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
        <motion.div
          whileHover={{ scale: 1.02 }}
          transition={{ type: "spring", stiffness: 300 }}
        >
          <Card className="p-4 bg-white border-border/50 shadow-sm">
            <QRCodeSVG
              value={url}
              size={size}
              level="M"
              title={`Join meeting with code ${participantCode}`}
            />
          </Card>
        </motion.div>
        
        <div className="text-center space-y-2">
          <p className="font-mono text-3xl font-bold tracking-wider text-primary">{participantCode}</p>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(true)}
            className="text-muted-foreground hover:text-primary"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Enlarge for projection
          </Button>
        </div>
      </div>

      {/* Fullscreen Modal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col items-center justify-center p-4"
            onClick={() => setIsFullscreen(false)}
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="text-center space-y-8"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white p-8 rounded-3xl shadow-2xl mx-auto inline-block">
                <QRCodeSVG
                  value={url}
                  size={Math.min(window.innerWidth, window.innerHeight) * 0.5}
                  level="H"
                  title={`Join meeting with code ${participantCode}`}
                />
              </div>
              
              <div className="space-y-4">
                <p className="font-mono text-8xl font-bold text-primary tracking-wider">{participantCode}</p>
                <p className="text-2xl text-muted-foreground">
                  Scan to join or visit <span className="text-foreground font-medium">{window.location.host}</span>
                </p>
              </div>
            </motion.div>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFullscreen(false)}
              className="absolute top-6 right-6 h-12 w-12 rounded-full bg-secondary/50 hover:bg-secondary"
            >
              <X className="w-6 h-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
