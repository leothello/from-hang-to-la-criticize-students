// @ts-nocheck
import { NextResponse } from 'next/server'
import { readDB, writeDB, uid, evictIfNeeded, photoByteSize, MAX_PHOTO_BYTES, MAX_BIO_LEN, MAX_WITHDRAW } from '../../../../lib/kv'

export async function POST(req) {
  const body = await req.json()
  const { type, characterId, userId, payload } = body

  if (!type || !characterId || !userId) {
    return NextResponse.json({ error: '参数缺失' }, { status: 400 })
  }

  const db = await readDB()
  const idx = db.characters.findIndex(c => c.id === characterId)
  if (idx === -1) {
    return NextResponse.json({ error: '人物不存在' }, { status: 404 })
  }
  const char = db.characters[idx]

  if (type === 'rate') {
    const value = Number(payload && payload.value)
    if (![1, 2, 3, 4, 5].includes(value)) {
      return NextResponse.json({ error: '档位无效' }, { status: 400 })
    }
    char.ratings[userId] = value

  } else if (type === 'addPhoto') {
    const base64 = payload && payload.base64
    if (!base64) return NextResponse.json({ error: '缺少照片' }, { status: 400 })
    if (photoByteSize(base64) > MAX_PHOTO_BYTES) {
      return NextResponse.json({ error: '请上传小于512KB的照片' }, { status: 400 })
    }
    char.photos.push({ id: uid(), base64, uploaderId: userId, likes: [], createdAt: Date.now() })
    char.photos = evictIfNeeded(char.photos)

  } else if (type === 'addBio') {
    const text = ((payload && payload.text) || '').trim()
    if (!text) return NextResponse.json({ error: '简介不能为空' }, { status: 400 })
    if (text.length > MAX_BIO_LEN) return NextResponse.json({ error: '简介不能多于200字' }, { status: 400 })
    char.bios.push({ id: uid(), text, uploaderId: userId, likes: [], createdAt: Date.now() })
    char.bios = evictIfNeeded(char.bios)

  } else if (type === 'likePhoto') {
    const photo = char.photos.find(p => p.id === (payload && payload.id))
    if (photo) {
      const i = photo.likes.indexOf(userId)
      if (i === -1) photo.likes.push(userId)
      else photo.likes.splice(i, 1)
    }

  } else if (type === 'likeBio') {
    const bio = char.bios.find(b => b.id === (payload && payload.id))
    if (bio) {
      const i = bio.likes.indexOf(userId)
      if (i === -1) bio.likes.push(userId)
      else bio.likes.splice(i, 1)
    }

  } else if (type === 'hide') {
    // 非上传者的“删除” = 仅对自己隐藏
    if (!char.hiddenBy.includes(userId)) char.hiddenBy.push(userId)

  } else if (type === 'delete') {
    // 上传者本人删除 = 对所有人删除
    if (char.creatorId !== userId) {
      return NextResponse.json({ error: '无权限删除' }, { status: 403 })
    }
    db.characters.splice(idx, 1)
    await writeDB(db)
    return NextResponse.json({ ok: true, removed: true })

  } else if (type === 'withdraw') {
    if (!char.withdrawVotes.includes(userId)) char.withdrawVotes.push(userId)
    if (char.withdrawVotes.length > MAX_WITHDRAW) {
      db.characters.splice(idx, 1)
      await writeDB(db)
      return NextResponse.json({ ok: true, removed: true })
    }

  } else {
    return NextResponse.json({ error: '未知操作' }, { status: 400 })
  }

  db.characters[idx] = char
  await writeDB(db)
  return NextResponse.json({ ok: true })
}
