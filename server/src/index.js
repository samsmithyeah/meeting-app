import 'dotenv/config'

import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import cors from 'cors'

import meetingsRouter from './routes/meetings.js'
import questionsRouter from './routes/questions.js'
import { setupSocketHandlers } from './socket/handlers.js'

const app = express()
const httpServer = createServer(app)
const io = new Server(httpServer, {
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
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' })
})

// Socket.io
setupSocketHandlers(io)

const PORT = process.env.PORT || 3001
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
