// @ts-nocheck
'use client'

import { useEffect, useState } from 'react'

const TIERS = [
  { level: 5, label: '夯', color: '#a8332b' },
  { level: 4, label: '顶级', color: '#c07a2e' },
  { level: 3, label: '人上人', color: '#b8942e' },
  { level: 2, label: 'NPC', color: '#6b7a5e' },
  { level: 1, label: '拉', color: '#3f5470' },
]

function getUserId() {
  if (typeof window === 'undefined') return ''
  let id = localStorage.getItem('userId')
  if (!id) {
    id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36)
    localStorage.setItem('userId', id)
  }
  return id
}

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function bestOf(list) {
  if (!list || list.length === 0) return null
  return [...list].sort((a, b) => b.likes.length - a.likes.length)[0]
}

export default function Page() {
  const [userId, setUserId] = useState('')
  const [characters, setCharacters] = useState([])
  const [showNotice, setShowNotice] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [selected, setSelected] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    const id = getUserId()
    setUserId(id)
    if (!localStorage.getItem('seenNotice')) setShowNotice(true)
    load(id)
  }, [])

  async function load(id) {
    const uidToUse = id || userId
    const res = await fetch(`/api/characters?userId=${uidToUse}`)
    const data = await res.json()
    setCharacters(data.characters || [])
  }

  function closeNotice() {
    localStorage.setItem('seenNotice', '1')
    setShowNotice(false)
  }

  function flash(msg) {
    setErrorMsg(msg)
    setTimeout(() => setErrorMsg(''), 2500)
  }

  const pending = characters.filter(c => c.tier === null)
  const byTier = level => characters.filter(c => c.tier === level)

  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-center mb-6" style={{ color: '#2a2420' }}>
        从夯到拉锐评25中所有老师
      </h1>

      <div className="rounded-lg overflow-hidden border" style={{ borderColor: '#d8cfbe' }}>
        {TIERS.map((t, i) => (
          <div
            key={t.level}
            className={`flex ${i !== TIERS.length - 1 ? 'border-b' : ''}`}
            style={{ borderColor: '#d8cfbe' }}
          >
            <div
              className="w-24 flex items-center justify-center text-white font-bold text-lg py-6 shrink-0"
              style={{ backgroundColor: t.color }}
            >
              {t.label}
            </div>
            <div className="flex-1 flex flex-wrap items-center gap-4 px-4 py-3" style={{ backgroundColor: '#f2ece0' }}>
              {byTier(t.level).length === 0 && (
                <span className="text-sm" style={{ color: '#b5aa96' }}>暂无人物</span>
              )}
              {byTier(t.level).map(c => (
                <CharacterAvatar key={c.id} c={c} onClick={() => setSelected(c)} />
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col items-center mt-6 gap-4">
        <button
          onClick={() => setShowAdd(true)}
          className="px-5 py-2 rounded text-white font-medium"
          style={{ backgroundColor: '#2a2420' }}
        >
          + 添加人物
        </button>

        {pending.length > 0 && (
          <div className="flex flex-col items-center gap-2">
            <span className="text-sm" style={{ color: '#9a8f7a' }}>待分档</span>
            <div className="flex flex-wrap justify-center gap-4">
              {pending.map(c => (
                <CharacterAvatar key={c.id} c={c} onClick={() => setSelected(c)} />
              ))}
            </div>
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-black text-white text-sm px-4 py-2 rounded shadow-lg">
          {errorMsg}
        </div>
      )}

      {showNotice && <NoticeModal onClose={closeNotice} />}

      {showAdd && (
        <AddModal
          userId={userId}
          onClose={() => setShowAdd(false)}
          onDone={() => {
            setShowAdd(false)
            load(userId)
          }}
          onError={flash}
        />
      )}

      {selected && (
        <DetailModal
          userId={userId}
          initial={selected}
          onClose={() => setSelected(null)}
          onChanged={() => load(userId)}
          onError={flash}
        />
      )}
    </div>
  )
}

function CharacterAvatar({ c, onClick }) {
  const photo = bestOf(c.photos)
  return (
    <button onClick={onClick} className="flex flex-col items-center w-16 group">
      <div
        className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-xs text-center leading-tight border group-hover:opacity-80"
        style={{ backgroundColor: '#ded2ba', borderColor: '#c9bda4' }}
      >
        {photo ? (
          <img src={photo.base64} alt={c.name} className="w-full h-full object-cover" />
        ) : (
          <span className="px-1" style={{ color: '#6b5f4a' }}>{c.name}</span>
        )}
      </div>
      <span className="text-xs mt-1 truncate w-full text-center" style={{ color: '#4a4038' }}>
        {c.name}
      </span>
    </button>
  )
}

function NoticeModal({ onClose }) {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-6 text-sm leading-relaxed" style={{ color: '#3a332b' }}>
        <p>
          本网站用于你对该学校学生进行评价，请勿上传无关内容。服务器性能垃圾，进入如果看不到内容请稍候片刻（片刻？）。进行交互（上传，点赞…）可能遇到延迟，请静静等待不要重复操作。谢谢使用，有问题，建议，诉求请联系作者，邮箱：leothellogracive@gmail.com
        </p>
        <button
          onClick={onClose}
          className="mt-5 w-full py-2 rounded text-white font-medium"
          style={{ backgroundColor: '#2a2420' }}
        >
          我知道了
        </button>
      </div>
    </div>
  )
}

function AddModal({ userId, onClose, onDone, onError }) {
  const [name, setName] = useState('')
  const [bio, setBio] = useState('')
  const [photoBase64, setPhotoBase64] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  async function handlePhoto(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (file.size > 512 * 1024) {
      onError('请上传小于512KB的照片')
      e.target.value = ''
      return
    }
    const b64 = await fileToBase64(file)
    setPhotoBase64(b64)
  }

  async function submit() {
    if (!name.trim() || !bio.trim()) {
      onError('姓名和简介必须填写')
      return
    }
    if (bio.trim().length > 200) {
      onError('简介不能多于200字')
      return
    }
    setSubmitting(true)
    const res = await fetch('/api/characters', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, bio, photoBase64, userId }),
    })
    const data = await res.json()
    setSubmitting(false)
    if (!res.ok) {
      onError(data.error || '添加失败')
      return
    }
    onDone()
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-6">
        <h2 className="font-bold text-lg mb-4" style={{ color: '#2a2420' }}>添加人物</h2>

        <label className="text-xs" style={{ color: '#8a8072' }}>请填写人物的真实姓名</label>
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          className="w-full border rounded px-3 py-2 mb-3 mt-1 text-sm"
          style={{ borderColor: '#d8cfbe' }}
        />

        <label className="text-xs" style={{ color: '#8a8072' }}>请添加与人物有关的照片（可先空着）</label>
        <input type="file" accept="image/*" onChange={handlePhoto} className="w-full text-sm mb-3 mt-1" />

        <label className="text-xs" style={{ color: '#8a8072' }}>简介（不超过200字）</label>
        <textarea
          value={bio}
          onChange={e => setBio(e.target.value)}
          rows={4}
          className="w-full border rounded px-3 py-2 mb-4 mt-1 text-sm"
          style={{ borderColor: '#d8cfbe' }}
        />

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded border text-sm" style={{ borderColor: '#d8cfbe' }}>
            取消
          </button>
          <button
            onClick={submit}
            disabled={submitting}
            className="flex-1 py-2 rounded text-white text-sm font-medium"
            style={{ backgroundColor: '#2a2420' }}
          >
            确定
          </button>
        </div>
      </div>
    </div>
  )
}

function DetailModal({ userId, initial, onClose, onChanged, onError }) {
  const [c, setC] = useState(initial)
  const [photoIdx, setPhotoIdx] = useState(0)
  const [bioIdx, setBioIdx] = useState(0)
  const [showAddPhoto, setShowAddPhoto] = useState(false)
  const [showAddBio, setShowAddBio] = useState(false)
  const [newBioText, setNewBioText] = useState('')

  const sortedPhotos = [...c.photos].sort((a, b) => b.likes.length - a.likes.length)
  const sortedBios = [...c.bios].sort((a, b) => b.likes.length - a.likes.length)
  const currentPhoto = sortedPhotos[photoIdx] || null
  const currentBio = sortedBios[bioIdx] || null

  async function act(type, payload = {}) {
    const res = await fetch('/api/characters/action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, characterId: c.id, userId, payload }),
    })
    const data = await res.json()
    if (!res.ok) {
      onError(data.error || '操作失败')
      return null
    }
    return data
  }

  async function refresh() {
    const res = await fetch(`/api/characters?userId=${userId}`)
    const data = await res.json()
    const updated = (data.characters || []).find(x => x.id === c.id)
    if (updated) setC(updated)
    onChanged()
  }

  async function rate(level) {
    await act('rate', { value: level })
    await refresh()
  }

  async function likePhoto() {
    if (!currentPhoto) return
    await act('likePhoto', { id: currentPhoto.id })
    await refresh()
  }

  async function likeBio() {
    if (!currentBio) return
    await act('likeBio', { id: currentBio.id })
    await refresh()
  }

  async function handleAddPhoto(e) {
    const file = e.target.files && e.target.files[0]
    if (!file) return
    if (file.size > 512 * 1024) {
      onError('请上传小于512KB的照片')
      e.target.value = ''
      return
    }
    const b64 = await fileToBase64(file)
    await act('addPhoto', { base64: b64 })
    setShowAddPhoto(false)
    setPhotoIdx(0)
    await refresh()
  }

  async function handleAddBio() {
    if (!newBioText.trim()) {
      onError('简介不能为空')
      return
    }
    if (newBioText.trim().length > 200) {
      onError('简介不能多于200字')
      return
    }
    await act('addBio', { text: newBioText })
    setNewBioText('')
    setShowAddBio(false)
    setBioIdx(0)
    await refresh()
  }

  async function handleDeleteOrHide() {
    const type = c.isMine ? 'delete' : 'hide'
    const data = await act(type, {})
    if (data) {
      onChanged()
      onClose()
    }
  }

  async function handleWithdraw() {
    const data = await act('withdraw')
    if (data) {
      if (data.removed) {
        onChanged()
        onClose()
      } else {
        await refresh()
      }
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-lg max-w-sm w-full p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-3">
          <h2 className="font-bold text-lg" style={{ color: '#2a2420' }}>{c.name}</h2>
          <button onClick={onClose} className="text-sm" style={{ color: '#9a8f7a' }}>关闭</button>
        </div>

        <div className="flex flex-col items-center mb-4">
          <div className="w-24 h-24 rounded-full overflow-hidden flex items-center justify-center border" style={{ backgroundColor: '#ded2ba', borderColor: '#c9bda4' }}>
            {currentPhoto ? (
              <img src={currentPhoto.base64} alt={c.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-sm px-1" style={{ color: '#6b5f4a' }}>{c.name}</span>
            )}
          </div>
          {sortedPhotos.length > 1 && (
            <div className="flex items-center gap-3 mt-2 text-sm" style={{ color: '#8a8072' }}>
              <button onClick={() => setPhotoIdx((photoIdx - 1 + sortedPhotos.length) % sortedPhotos.length)}>‹</button>
              <span>{photoIdx + 1}/{sortedPhotos.length}</span>
              <button onClick={() => setPhotoIdx((photoIdx + 1) % sortedPhotos.length)}>›</button>
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <button onClick={likePhoto} className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#d8cfbe' }}>
              👍 {currentPhoto ? currentPhoto.likes.length : 0}
            </button>
            <button onClick={() => setShowAddPhoto(true)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#d8cfbe' }}>
              上传照片
            </button>
          </div>
          {showAddPhoto && (
            <input type="file" accept="image/*" onChange={handleAddPhoto} className="text-xs mt-2" />
          )}
        </div>

        <div className="mb-4">
          <p className="text-sm leading-relaxed" style={{ color: '#3a332b' }}>
            {currentBio ? currentBio.text : '暂无简介'}
          </p>
          {sortedBios.length > 1 && (
            <div className="flex items-center gap-3 mt-2 text-sm" style={{ color: '#8a8072' }}>
              <button onClick={() => setBioIdx((bioIdx - 1 + sortedBios.length) % sortedBios.length)}>‹</button>
              <span>{bioIdx + 1}/{sortedBios.length}</span>
              <button onClick={() => setBioIdx((bioIdx + 1) % sortedBios.length)}>›</button>
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <button onClick={likeBio} className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#d8cfbe' }}>
              👍 {currentBio ? currentBio.likes.length : 0}
            </button>
            <button onClick={() => setShowAddBio(!showAddBio)} className="text-xs px-2 py-1 rounded border" style={{ borderColor: '#d8cfbe' }}>
              撰写简介
            </button>
          </div>
          {showAddBio && (
            <div className="mt-2">
              <textarea
                value={newBioText}
                onChange={e => setNewBioText(e.target.value)}
                rows={3}
                className="w-full border rounded px-2 py-1 text-sm"
                style={{ borderColor: '#d8cfbe' }}
              />
              <button onClick={handleAddBio} className="text-xs px-3 py-1 rounded text-white mt-1" style={{ backgroundColor: '#2a2420' }}>
                提交
              </button>
            </div>
          )}
        </div>

        <div className="mb-4">
          <p className="text-xs mb-2" style={{ color: '#8a8072' }}>选择档位</p>
          <div className="flex gap-2 flex-wrap">
            {TIERS.map(t => (
              <button
                key={t.level}
                onClick={() => rate(t.level)}
                className="px-3 py-1 rounded text-white text-sm"
                style={{
                  backgroundColor: t.color,
                  outline: c.myRating === t.level ? '2px solid #2a2420' : 'none',
                }}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex justify-between items-center pt-3 border-t" style={{ borderColor: '#eee' }}>
          <button onClick={handleWithdraw} className="text-xs" style={{ color: c.iWithdrew ? '#a8332b' : '#8a8072' }}>
            申请下架 ({c.withdrawCount}/10)
          </button>
          <button onClick={handleDeleteOrHide} className="text-xs" style={{ color: '#a8332b' }}>
            {c.isMine ? '删除' : '从我的列表中删除'}
          </button>
        </div>
      </div>
    </div>
  )
}
