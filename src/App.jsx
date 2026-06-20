import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { getEntries, saveEntry, updateEntry, deleteEntry } from './hooks/useEntries'
import NavHeader from './components/NavHeader'
import EntryCard from './components/EntryCard'
import NewEntryForm from './components/NewEntryForm'
import Stickers from './components/Stickers'
import CoverIntro from './components/CoverIntro'
import AssessmentSection from './components/AssessmentSection'
import SidebarNav from './components/SidebarNav'
import lockClosedSrc from '../Assests/Components/lock-closed.svg'
import lockOpenSrc   from '../Assests/Components/lock-open.svg'
import heroSrc       from '../Assests/Components/hero.svg'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function PinLock({ isOpen, isJiggling }) {
  return (
    <div className={`pin-lock-wrap${isJiggling ? ' pin-lock-jiggle' : ''}`}>
      <img src={lockClosedSrc} alt="" className="pin-lock-img" style={{ opacity: isOpen ? 0 : 1 }} />
      <img src={lockOpenSrc}   alt="" className="pin-lock-img" style={{ opacity: isOpen ? 1 : 0 }} />
    </div>
  )
}

export default function App() {
  const [entries, setEntries] = useState([])
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showNewEntryForm, setShowNewEntryForm] = useState(false)
  const formRef = useRef(null)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinValue, setPinValue] = useState('')
  const [pinStatus, setPinStatus] = useState('idle') // 'idle' | 'wrong' | 'correct'
  const [isClosing, setIsClosing] = useState(false)

  const [showIntro, setShowIntro] = useState(true)
  const [pendingDeleteEntry, setPendingDeleteEntry] = useState(null)
  const [toastFading, setToastFading] = useState(false)
  const deleteTimerRef = useRef(null)
  const fadeTimerRef = useRef(null)

  useEffect(() => {
    getEntries().then(setEntries)
  }, [])

  useEffect(() => () => {
    clearTimeout(deleteTimerRef.current)
    clearTimeout(fadeTimerRef.current)
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
    setEntries(prev => prev.map(e => e.id === id ? merged : e))
    try {
      await updateEntry(merged)
      const fresh = await getEntries()
      setEntries(fresh)
    } catch (err) {
      console.error('[handleUpdate] failed:', err)
    }
  }

  const handleDelete = (id) => {
    const entry = entries.find(e => e.id === id)
    if (!entry) return
    clearTimeout(deleteTimerRef.current)
    clearTimeout(fadeTimerRef.current)
    if (pendingDeleteEntry) {
      deleteEntry(pendingDeleteEntry.id).catch(console.error)
    }
    setEntries(prev => prev.filter(e => e.id !== id))
    setPendingDeleteEntry(entry)
    setToastFading(false)
    fadeTimerRef.current = setTimeout(() => setToastFading(true), 4500)
    deleteTimerRef.current = setTimeout(() => {
      deleteEntry(entry.id).catch(console.error)
      setPendingDeleteEntry(null)
      setToastFading(false)
    }, 5000)
  }

  const handleUndoDelete = () => {
    clearTimeout(deleteTimerRef.current)
    clearTimeout(fadeTimerRef.current)
    if (pendingDeleteEntry) {
      setEntries(prev => {
        const restored = [...prev, pendingDeleteEntry]
        return restored.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt))
      })
    }
    setPendingDeleteEntry(null)
    setToastFading(false)
  }

  const closePinModal = () => {
    setShowPinModal(false)
    setPinValue('')
    setPinStatus('idle')
    setIsClosing(false)
  }

  const handlePinChange = (e) => {
    if (pinStatus !== 'idle') return
    const val = e.target.value.replace(/\D/g, '').slice(0, 4)
    setPinValue(val)
    if (val.length === 4) {
      if (val === '1234') {
        setPinStatus('correct')
        setTimeout(() => setIsClosing(true), 500)
        setTimeout(() => {
          setIsUnlocked(true)
          closePinModal()
        }, 900)
      } else {
        setPinStatus('wrong')
        setTimeout(() => {
          setPinValue('')
          setPinStatus('idle')
        }, 600)
      }
    }
  }

  const handleLockClick = () => {
    if (isUnlocked) {
      setIsUnlocked(false)
      setShowNewEntryForm(false)
    } else {
      setShowPinModal(true)
      setPinStatus('idle')
      setIsClosing(false)
    }
  }

  return (
    <>
      <SidebarNav entries={entries} />
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
          <img src={heroSrc} alt="My Leadership Diary" className="hero-image" />

          {isUnlocked && showNewEntryForm && (
            <NewEntryForm
              ref={formRef}
              entryCount={entries.length}
              onSave={handleSave}
              onCancel={() => setShowNewEntryForm(false)}
            />
          )}
        </div>

        <AssessmentSection isUnlocked={isUnlocked} id="assessment" />

        <div className="entries-section">
          <h2 className="assessment-section__title">Weekly Diary Entries</h2>
          <main id="entries" className="entry-feed">
            {[...entries].reverse().map((entry, i) => (
              <div key={entry.id} id={`entry-${entry.id}`}>
                <EntryCard
                  entry={entry}
                  index={i}
                  isUnlocked={isUnlocked}
                  onDelete={handleDelete}
                  onUpdate={handleUpdate}
                />
              </div>
            ))}
          </main>
        </div>
      </div>

      {showPinModal && (
        <div
          className={`pin-modal-overlay${isClosing ? ' pin-modal-overlay--closing' : ''}`}
          onClick={e => { if (e.target === e.currentTarget && pinStatus === 'idle') closePinModal() }}
        >
          <div className="pin-modal">
            <PinLock isOpen={pinStatus === 'correct'} isJiggling={pinStatus === 'wrong'} />
            <input
              type="password"
              maxLength={4}
              className="pin-input"
              placeholder="enter pin"
              value={pinValue}
              onChange={handlePinChange}
              onKeyDown={e => {
                if (e.key === 'Escape' && pinStatus === 'idle') closePinModal()
              }}
              autoFocus
            />
          </div>
        </div>
      )}

      <Stickers />
      {showIntro && <CoverIntro onComplete={() => setShowIntro(false)} />}

      {pendingDeleteEntry && (
        <div className={`delete-toast${toastFading ? ' delete-toast--fading' : ''}`}>
          Entry deleted —{' '}
          <button type="button" className="delete-toast__undo" onClick={handleUndoDelete}>
            undo
          </button>
        </div>
      )}
    </>
  )
}
