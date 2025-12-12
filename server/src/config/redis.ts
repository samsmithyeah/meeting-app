import { Redis } from 'ioredis'
import type { SessionState } from '../types/index.js'

let _redis: Redis | null = null

function getRedis(): Redis | null {
  if (!_redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    try {
      const redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        lazyConnect: true
      })

      redis.on('error', (err: Error) => {
        console.warn('Redis connection error:', err.message)
      })

      redis.on('connect', () => {
        console.log('Redis connected')
      })

      _redis = redis
    } catch (err) {
      console.error('Fatal: Redis initialization failed:', (err as Error).message)
      process.exit(1)
    }
  }
  return _redis
}

// Session state helpers
const sessionKeys = {
  status: (meetingId: string) => `session:${meetingId}:status`,
  currentQuestion: (meetingId: string) => `session:${meetingId}:currentQuestion`,
  participants: (meetingId: string) => `session:${meetingId}:participants`,
  answered: (meetingId: string, questionId: string) =>
    `session:${meetingId}:answered:${questionId}`,
  timerEnd: (meetingId: string) => `session:${meetingId}:timerEnd`
}

export async function getSessionState(meetingId: string): Promise<SessionState> {
  const redis = getRedis()
  if (!redis) {
    console.error('Redis client is not available for getSessionState')
    throw new Error('Cache service is unavailable')
  }

  const [status, currentQuestion, timerEnd] = await Promise.all([
    redis.get(sessionKeys.status(meetingId)),
    redis.get(sessionKeys.currentQuestion(meetingId)),
    redis.get(sessionKeys.timerEnd(meetingId))
  ])

  const participants = await redis.smembers(sessionKeys.participants(meetingId))

  let answered: string[] = []
  if (currentQuestion) {
    answered = await redis.smembers(sessionKeys.answered(meetingId, currentQuestion))
  }

  return {
    status: (status as SessionState['status']) || 'waiting',
    currentQuestionId: currentQuestion,
    participants,
    answeredParticipants: answered,
    timerEnd: timerEnd ? parseInt(timerEnd, 10) : null
  }
}

export async function setSessionStatus(
  meetingId: string,
  status: SessionState['status']
): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.error('Redis client is not available for setSessionStatus')
    throw new Error('Cache service is unavailable')
  }
  await redis.set(sessionKeys.status(meetingId), status)
}

export async function setCurrentQuestion(meetingId: string, questionId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.error('Redis client is not available for setCurrentQuestion')
    throw new Error('Cache service is unavailable')
  }
  await redis.set(sessionKeys.currentQuestion(meetingId), questionId)
}

export async function addParticipant(meetingId: string, participantId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.error('Redis client is not available for addParticipant')
    throw new Error('Cache service is unavailable')
  }
  await redis.sadd(sessionKeys.participants(meetingId), participantId)
}

export async function removeParticipant(meetingId: string, participantId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.error('Redis client is not available for removeParticipant')
    throw new Error('Cache service is unavailable')
  }
  await redis.srem(sessionKeys.participants(meetingId), participantId)
}

export async function markAnswered(
  meetingId: string,
  questionId: string,
  participantId: string
): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.error('Redis client is not available for markAnswered')
    throw new Error('Cache service is unavailable')
  }
  await redis.sadd(sessionKeys.answered(meetingId, questionId), participantId)
}

export async function clearAnswered(meetingId: string, questionId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.error('Redis client is not available for clearAnswered')
    throw new Error('Cache service is unavailable')
  }
  await redis.del(sessionKeys.answered(meetingId, questionId))
}

export async function setTimer(meetingId: string, endTime: number): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.error('Redis client is not available for setTimer')
    throw new Error('Cache service is unavailable')
  }
  await redis.set(sessionKeys.timerEnd(meetingId), endTime.toString())
}

export async function clearTimer(meetingId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.error('Redis client is not available for clearTimer')
    throw new Error('Cache service is unavailable')
  }
  await redis.del(sessionKeys.timerEnd(meetingId))
}

export async function clearSession(meetingId: string): Promise<void> {
  const redis = getRedis()
  if (!redis) {
    console.error('Redis client is not available for clearSession')
    throw new Error('Cache service is unavailable')
  }

  const stream = redis.scanStream({ match: `session:${meetingId}:*` })
  const keysToDelete: string[] = []
  for await (const keys of stream) {
    if (keys.length) {
      keysToDelete.push(...keys)
    }
  }
  if (keysToDelete.length > 0) {
    await redis.del(...keysToDelete)
  }
}
