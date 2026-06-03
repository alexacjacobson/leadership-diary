import { useState } from 'react'

const STORAGE_KEY = 'leadership_diary_entries'

function loadEntries() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

export default function useEntries() {
  const [entries, setEntries] = useState(loadEntries)

  const saveEntry = (entry) => {
    setEntries(prev => {
      const next = [...prev, entry]
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const deleteEntry = (id) => {
    setEntries(prev => {
      const next = prev.filter(e => e.id !== id)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  const updateEntry = (id, patch) => {
    setEntries(prev => {
      const next = prev.map(e => (e.id === id ? { ...e, ...patch } : e))
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return next
    })
  }

  return { entries, saveEntry, deleteEntry, updateEntry }
}
