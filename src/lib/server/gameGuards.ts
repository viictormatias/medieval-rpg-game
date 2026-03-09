import 'server-only'

const bucketMap = new Map<string, { count: number; resetAt: number }>()
const arenaTicketMap = new Map<string, { userId: string; enemyId: string; expiresAt: number }>()

function now() {
  return Date.now()
}

export function enforceRateLimit(key: string, max: number, windowMs: number) {
  const currentTs = now()
  const bucket = bucketMap.get(key)

  if (!bucket || currentTs >= bucket.resetAt) {
    bucketMap.set(key, { count: 1, resetAt: currentTs + windowMs })
    return { allowed: true }
  }

  if (bucket.count >= max) {
    return { allowed: false, retryAfterMs: bucket.resetAt - currentTs }
  }

  bucket.count += 1
  return { allowed: true }
}

export function createArenaTicket(userId: string, enemyId: string, ttlMs: number) {
  const ticket = `${userId}:${enemyId}:${crypto.randomUUID()}`
  arenaTicketMap.set(ticket, {
    userId,
    enemyId,
    expiresAt: now() + ttlMs,
  })
  return ticket
}

export function consumeArenaTicket(userId: string, enemyId: string, ticket: string) {
  const data = arenaTicketMap.get(ticket)
  if (!data) return false

  arenaTicketMap.delete(ticket)

  if (data.expiresAt < now()) return false
  if (data.userId !== userId) return false
  if (data.enemyId !== enemyId) return false

  return true
}

export function assertUuid(value: string, fieldName: string) {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  if (!isUuid) {
    throw new Error(`${fieldName} inválido.`)
  }
}

export function normalizeUsername(raw: string) {
  const value = String(raw || '').trim().replace(/\s+/g, ' ')

  if (value.length < 3 || value.length > 24) {
    throw new Error('Nome deve ter entre 3 e 24 caracteres.')
  }

  if (!/^[a-zA-ZÀ-ÿ0-9 _.-]+$/.test(value)) {
    throw new Error('Nome contém caracteres inválidos.')
  }

  return value
}

export function clampInt(value: unknown, min: number, max: number) {
  const n = Number(value)
  if (!Number.isInteger(n)) {
    throw new Error('Valor inteiro inválido.')
  }
  if (n < min || n > max) {
    throw new Error(`Valor fora do intervalo permitido (${min}-${max}).`)
  }
  return n
}
