import { useState, useEffect } from 'react'

export default function SidebarNav({ entries }) {
  const [activeId, setActiveId] = useState('assessment')

  // Build dot list: assessment first, then entries newest-first (matching feed order)
  const items = [
    { id: 'assessment', label: 'Leadership Assessment Results' },
    ...[...entries].reverse().map(e => ({ id: `entry-${e.id}`, label: e.title || 'Untitled' })),
  ]

  useEffect(() => {
    const threshold = () => window.innerHeight * 0.35

    function getActiveId() {
      const scrollY = window.scrollY
      let active = items[0]?.id ?? 'assessment'
      for (const item of items) {
        const el = document.getElementById(item.id)
        if (el && el.offsetTop - threshold() <= scrollY) active = item.id
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

  return (
    <aside className="sidebar">
      <nav aria-label="Page sections">
        <ul className="nav-dots-list">
          {items.map(item => (
            <li
              key={item.id}
              className={`nav-dot-item${activeId === item.id ? ' is-active' : ''}`}
              onClick={() => {
                const el = document.getElementById(item.id)
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }}
            >
              <div className="nav-dot" />
              <span className="nav-dot-label">{item.label}</span>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  )
}
