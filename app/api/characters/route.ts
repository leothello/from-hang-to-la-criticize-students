// @ts-nocheck
import { NextResponse } from 'next/server'
import { readDB, writeDB, uid, computeTier, photoByteSize, MAX_PHOTO_BYTES, MAX_BIO_LEN } from '../../../lib/kv'

export async function GET(req) {
  const { searchParams } = new URL(req.url)
  const userId = searchParams.get('userId') || ''
  const db = await readDB()

  const visible = db.characters.filter(c => !c.hiddenBy.includes(userId))
  const result = visible.map(c => ({
    id: c.id,
    name: c.name,
    creatorId: c.creatorId,
    isMine: c.creatorId === userId,
    tier: computeTier(c.ratings),
    myRating: c.ratings[userId] ?? null,
    photos: c.photos,
    bios: c.bios,
    withdrawCount: c.withdrawVotes.length,
    iWithdrew: c.withdrawVotes.includes(userId),
  }))
  return NextResponse.json({ characters: result })
}

export async function POST(req) {
  const body = await req.json()
  const { name, bio, photoBase64, userId } = body

  if (!userId) {
    return NextResponse.json({ error: '缺少用户标识' }, { status: 400 })
  }
  if (!name || !name.trim() || !bio || !bio.trim()) {
    return NextResponse.json({ error: '姓名和简介必须填写' }, { status: 400 })
  }
  if (bio.trim().length > MAX_BIO_LEN) {
    return NextResponse.json({ error: '简介不能多于200字' }, { status: 400 })
  }
  if (photoBase64 && photoByteSize(photoBase64) > MAX_PHOTO_BYTES) {
    return NextResponse.json({ error: '请上传小于512KB的照片' }, { status: 400 })
  }

  const db = await readDB()
  const trimmedName = name.trim()
  if (db.characters.some(c => c.name === trimmedName)) {
    return NextResponse.json({ error: '该人物已存在，不能重复添加' }, { status: 400 })
  }

  const now = Date.now()
  const newChar = {
    id: uid(),
    name: trimmedName,
    creatorId: userId,
    createdAt: now,
    ratings: {},
    photos: photoBase64
      ? [{ id: uid(), base64: photoBase64, uploaderId: userId, likes: [], createdAt: now }]
      : [],
    bios: [{ id: uid(), text: bio.trim(), uploaderId: userId, likes: [], createdAt: now }],
    hiddenBy: [],
    withdrawVotes: [],
  }
  db.characters.push(newChar)
  await writeDB(db)
  return NextResponse.json({ ok: true, id: newChar.id })
}
