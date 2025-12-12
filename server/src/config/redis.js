import Redis from 'ioredis'

let _redis = null

function getRedis() {
  if (!_redis) {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379'
    try {
      _redis = new Redis(redisUrl, {
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true
      })

      _redis.on('error', (err) => {
        console.warn('Redis connection error:', err.message)
      })

      _redis.on('connect', () => {
        console.log('Redis connected')
      })
    } catch (err) {
      console.warn('Redis initialization failed:', err.message)
    }
  }
  return _redis
}

// Session state helpers
const sessionKeys = {
  status: (meetingId) => `session:${meetingId}:status`,
  currentQuestion: (meetingId) => `session:${meetingId}:currentQuestion`,
  participants: (meetingId) => `session:${meetingId}:participants`,
  answered: (meetingId, questionId) => `session:${meetingId}:answered:${questionId}`,
  timerEnd: (meetingId) => `session:${meetingId}:timerEnd`
}

export async function getSessionState(meetingId) {
  const redis = getRedis()
  if (!redis) return null

  const [status, currentQuestion, timerEnd] = await Promise.all([
    redis.get(sessionKeys.status(meetingId)),
    redis.get(sessionKeys.currentQuestion(meetingId)),
    redis.get(sessionKeys.timerEnd(meetingId))
  ])

  const participants = await redis.smembers(sessionKeys.participants(meetingId))

  let answered = []
  if (currentQuestion) {
    answered = await redis.smembers(sessionKeys.answered(meetingId, currentQuestion))
  }

  return {
    status: status || 'waiting',
    currentQuestionId: currentQuestion,
    participants,
    answeredParticipants: answered,
    timerEnd: timerEnd ? parseInt(timerEnd) : null
  }
}

export async function setSessionStatus(meetingId, status) {
  const redis = getRedis()
  if (!redis) return
  await redis.set(sessionKeys.status(meetingId), status)
}

export async function setCurrentQuestion(meetingId, questionId) {
  const redis = getRedis()
  if (!redis) return
  await redis.set(sessionKeys.currentQuestion(meetingId), questionId)
}

export async function addParticipant(meetingId, participantId) {
  const redis = getRedis()
  if (!redis) return
  await redis.sadd(sessionKeys.participants(meetingId), participantId)
}

export async function removeParticipant(meetingId, participantId) {
  const redis = getRedis()
  if (!redis) return
  await redis.srem(sessionKeys.participants(meetingId), participantId)
}

export async function markAnswered(meetingId, questionId, participantId) {
  const redis = getRedis()
  if (!redis) return
  await redis.sadd(sessionKeys.answered(meetingId, questionId), participantId)
}

export async function clearAnswered(meetingId, questionId) {
  const redis = getRedis()
  if (!redis) return
  await redis.del(sessionKeys.answered(meetingId, questionId))
}

export async function setTimer(meetingId, endTime) {
  const redis = getRedis()
  if (!redis) return
  await redis.set(sessionKeys.timerEnd(meetingId), endTime.toString())
}

export async function clearTimer(meetingId) {
  const redis = getRedis()
  if (!redis) return
  await redis.del(sessionKeys.timerEnd(meetingId))
}

export async function clearSession(meetingId) {
  const redis = getRedis()
  if (!redis) return

  const stream = redis.scanStream({ match: `session:${meetingId}:*` })
  const keysToDelete = []
  for await (const keys of stream) {
    if (keys.length) {
      keysToDelete.push(...keys)
    }
  }
  if (keysToDelete.length > 0) {
    await redis.del(keysToDelete)
  }
}
