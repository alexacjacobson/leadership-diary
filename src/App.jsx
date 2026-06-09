import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { getEntries, saveEntry, updateEntry, deleteEntry } from './hooks/useEntries'
import { getStickers, saveStickers } from './hooks/useStickers'
import NavHeader from './components/NavHeader'
import EntryCard from './components/EntryCard'
import NewEntryForm from './components/NewEntryForm'
import StickerTray from './components/StickerTray'
import StickerLayer from './components/StickerLayer'
import CoverIntro from './components/CoverIntro'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

export default function App() {
  const [entries, setEntries] = useState([])
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)
  const formRef = useRef(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinValue, setPinValue] = useState('')

  const [showIntro, setShowIntro] = useState(true)

  const [stickers, setStickers] = useState([])
  const stickersRef = useRef([])
  useEffect(() => { stickersRef.current = stickers }, [stickers])

  useEffect(() => {
    getEntries().then(setEntries)
    getStickers().then(setStickers)
  }, [])

  const handleSave = async (entry) => {
    await saveEntry(entry)
    setEntries(prev => [...prev, entry])
    setShowNewEntryForm(false)
  }

  const handleUpdate = async (id, patch) => {
    const existing = entries.find(e => e.id === id)
    if (!existing) return
    const merged = { ...existing, ...patch }
    await updateEntry(merged)
    setEntries(prev => prev.map(e => e.id === id ? merged : e))
  }

  const handleDelete = async (id) => {
    await deleteEntry(id)
    setEntries(prev => prev.filter(e => e.id !== id))
  }

  const handlePinChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPinValue(val)
    if (val.length === 4) {
      if (val === '1234') {
        setIsUnlocked(true)
        setShowPinModal(false)
        setPinValue('')
      } else {
        setTimeout(() => setPinValue(''), 300)
      }
    }
  }

  const handleLockClick = () => {
    if (isUnlocked) {
      setIsUnlocked(false)
      setShowNewEntryForm(false)
    } else {
      setShowPinModal(true)
    }
  }

  const handlePlaceSticker = (type, x, y) => {
    const newSticker = { id: uid(), type, x: Math.round(x), y: Math.round(y) }
    const updated = [...stickers, newSticker]
    setStickers(updated)
    saveStickers(updated)
  }

  const handleMoveSticker = (id, x, y) => {
    setStickers(prev => prev.map(s => s.id === id ? { ...s, x, y } : s))
  }

  const handleMoveStickerEnd = () => {
    saveStickers(stickersRef.current)
  }

  const handleDeleteSticker = (id) => {
    const updated = stickers.filter(s => s.id !== id)
    setStickers(updated)
    saveStickers(updated)
  }

  return (
    <>
      <NavHeader isUnlocked={isUnlocked} onLockClick={handleLockClick} />
      {isUnlocked && (
        <div style={{ position: 'fixed', top: '70px', right: '24px', zIndex: 100, display: 'flex', alignItems: 'center', gap: '12px' }}>
          {showNewEntryForm && (
            <button
              type="button"
              className="btn-cancel-entry"
              onClick={() => setShowNewEntryForm(false)}
              aria-label="Cancel new entry"
            >
              <X size={18} />
            </button>
          )}
          <button
            type="button"
            className={showNewEntryForm ? 'btn-save-entry' : 'btn-new-entry'}
            onClick={() => showNewEntryForm ? formRef.current?.save() : setShowNewEntryForm(true)}
          >
            {showNewEntryForm ? 'save entry' : 'new entry'}
          </button>
        </div>
      )}

      <div className={`app${isUnlocked ? ' app--edit-mode' : ''}`}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          <h1 className="form-title form-title--page">My Leadership Diary</h1>

          {isUnlocked && showNewEntryForm && (
            <NewEntryForm
              ref={formRef}
              entryCount={entries.length}
              onSave={handleSave}
              onCancel={() => setShowNewEntryForm(false)}
            />
          )}
        </div>

        <main id="entries" className="entry-feed">
          {[...entries].reverse().map((entry, i) => (
            <EntryCard
              key={entry.id}
              entry={entry}
              index={i}
              isUnlocked={isUnlocked}
              onDelete={handleDelete}
              onUpdate={handleUpdate}
            />
          ))}
        </main>
      </div>

      {showPinModal && (
        <div
          className="pin-modal-overlay"
          onClick={e => { if (e.target === e.currentTarget) { setShowPinModal(false); setPinValue('') } }}
        >
          <div className="pin-modal">
            <input
              type="password"
              maxLength={4}
              className="pin-input"
              placeholder="enter pin"
              value={pinValue}
              onChange={handlePinChange}
              onKeyDown={e => {
                if (e.key === 'Escape') { setShowPinModal(false); setPinValue('') }
              }}
              autoFocus
            />
          </div>
        </div>
      )}

      <StickerLayer
        stickers={stickers}
        onMove={handleMoveSticker}
        onMoveEnd={handleMoveStickerEnd}
        onDelete={handleDeleteSticker}
      />
      <StickerTray onPlace={handlePlaceSticker} />
      {showIntro && <CoverIntro onComplete={() => setShowIntro(false)} />}
    </>
  )
}
