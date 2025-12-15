import 'dotenv/config'

// Validate required environment variables in production
if (process.env.NODE_ENV === 'production') {
  const required = ['CLIENT_URL', 'PORT']
  const missing = required.filter((key) => !process.env[key])
  if (missing.length > 0) {
    console.error(`Fatal: Missing required environment variables: ${missing.join(', ')}`)
    process.exit(1)
  }
}

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

import meetingsRouter from './routes/meetings.js'
import questionsRouter from './routes/questions.js'
import { setupSocketHandlers } from './socket/handlers.js'
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  InterServerEvents,
  SocketData,
  TypedServer
} from './types/index.js'

const app = express()
const httpServer = createServer(app)
const io: TypedServer = new Server<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
>(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL || 'http://localhost:5173'
  })
)
app.use(express.json())

// Make io available to routes
app.set('io', io)

// Routes
app.use('/api/meetings', meetingsRouter)
app.use('/api/questions', questionsRouter)

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

// Socket.io
setupSocketHandlers(io)

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
