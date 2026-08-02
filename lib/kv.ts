// @ts-nocheck
import { Redis } from '@upstash/redis'

const kv = Redis.fromEnv()

const KEY = 'monte_cristo_data'
const MAX_MEDIA = 10
const MAX_WITHDRAW = 10
const MAX_PHOTO_BYTES = 512 * 1024
const MAX_BIO_LEN = 200

export const uid = () => Math.random().toString(36).slice(2, 10)

export async function readDB() {
  const data = await kv.get(KEY)
  return (data || { characters: [] }) as any
}

export async function writeDB(db) {
  await kv.set(KEY, db)
}

// 淘汰逻辑：点赞最少的被挤掉，若并列则挤掉上传时间最早的
export function evictIfNeeded(list) {
  if (list.length <= MAX_MEDIA) return list
  const sorted = [...list].sort((a, b) => {
    if (a.likes.length !== b.likes.length) return a.likes.length - b.likes.length
    return a.createdAt - b.createdAt
  })
  const removeId = sorted[0].id
  return list.filter(item => item.id !== removeId)
}

export function computeTier(ratings) {
  const values = Object.values(ratings)
  if (values.length === 0) return null
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return Math.round(avg)
}

export function photoByteSize(base64) {
  const raw = base64.includes(',') ? base64.split(',').pop() : base64
  return Buffer.from(raw || '', 'base64').length
}

export { MAX_MEDIA, MAX_WITHDRAW, MAX_PHOTO_BYTES, MAX_BIO_LEN }
