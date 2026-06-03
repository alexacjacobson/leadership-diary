import { useState, useEffect } from 'react'
import { getEntries, saveEntry, updateEntry, deleteEntry } from './hooks/useEntries'
import NavHeader from './components/NavHeader'
import EntryCard from './components/EntryCard'
import NewEntryForm from './components/NewEntryForm'

export default function App() {
  const [entries, setEntries] = useState([])
  const [isUnlocked, setIsUnlocked] = useState(false)
  const [showPinModal, setShowPinModal] = useState(false)
  const [pinValue, setPinValue] = useState('')

  useEffect(() => {
    getEntries().then(setEntries)
  }, [])

  const handleSave = async (entry) => {
    await saveEntry(entry)
    setEntries(prev => [...prev, entry])
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
    } else {
      setShowPinModal(true)
    }
  }

  return (
    <>
      <NavHeader isUnlocked={isUnlocked} onLockClick={handleLockClick} />
      <div className="app">
        {isUnlocked && (
          <NewEntryForm
            entryCount={entries.length}
            onSave={handleSave}
          />
        )}

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
    </>
  )
}
