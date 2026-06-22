import { useState, useEffect } from 'react'
import { Menu, X } from 'lucide-react'

export default function SidebarNav({ entries }) {
  const [activeId, setActiveId] = useState('assessment')
  const [isOpen, setIsOpen] = useState(false)

  // Build dot list: assessment first, then entries newest-first (matching feed order)
  const items = [
    { id: 'assessment', label: 'Leadership Assessment Results' },
    ...[...entries].reverse().map(e => ({ id: `entry-${e.id}`, label: e.title || 'Untitled' })),
  ]

  useEffect(() => {
    function getActiveId() {
      const navEl = document.querySelector('.nav-header')
      const navHeight = navEl ? navEl.offsetHeight : 56
      let active = items[0]?.id ?? 'assessment'
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el) {
          const rect = el.getBoundingClientRect()
          if (rect.top <= navHeight + 20) active = item.id
        }
      }
      return active
    }

    function updateNav() {
      setActiveId(getActiveId())
    }

    window.addEventListener('scroll', updateNav, { passive: true })
    window.addEventListener('resize', updateNav, { passive: true })
    updateNav()

    return () => {
      window.removeEventListener('scroll', updateNav)
      window.removeEventListener('resize', updateNav)
    }
  }, [entries])

  // Auto-close if viewport expands past the breakpoint
  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 1024) setIsOpen(false)
    }
    window.addEventListener('resize', handleResize, { passive: true })
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <>
      <button
        className="sidebar-hamburger"
        onClick={() => setIsOpen(o => !o)}
        aria-label={isOpen ? 'Close navigation' : 'Open navigation'}
        aria-expanded={isOpen}
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <div className="sidebar-backdrop" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`sidebar${isOpen ? ' sidebar--open' : ''}`}>
        <nav aria-label="Page sections">
          <ul className="nav-dots-list">
            {items.map(item => (
              <li
                key={item.id}
                className={`nav-dot-item${activeId === item.id ? ' is-active' : ''}`}
                onClick={() => {
                  const el = document.getElementById(item.id)
                  if (el) el.scrollIntoView({ behavior: 'smooth' })
                  setIsOpen(false)
                }}
              >
                <div className="nav-dot" />
                <span className="nav-dot-label">{item.label}</span>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
    </>
  )
}
