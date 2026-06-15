import { useState, useEffect } from 'react'
import { Lock, Unlock, Sun, Moon } from 'lucide-react'
import bloomPink from '../assets/bloom-pink.svg'

export default function NavHeader({ isUnlocked, onLockClick }) {
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('diary-theme') === 'dark'
  })

  useEffect(() => {
    if (isDark) {
      document.documentElement.setAttribute('data-theme', 'dark')
      localStorage.setItem('diary-theme', 'dark')
    } else {
      document.documentElement.removeAttribute('data-theme')
      localStorage.setItem('diary-theme', 'light')
    }
  }, [isDark])

  return (
    <header className="nav-header">
      <div className="nav-inner">
        <button
          className="nav-identity-btn"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label="Back to top"
        >
          <img src={bloomPink} alt="" className="nav-bloom" />
          <span className="nav-name">Alexa Jacobson</span>
        </button>
        <div className="nav-right">
          <button
            className="nav-theme-btn"
            onClick={() => setIsDark(d => !d)}
            aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            className="nav-lock-btn"
            onClick={onLockClick}
            aria-label={isUnlocked ? 'Lock' : 'Unlock'}
          >
            {isUnlocked ? <Unlock size={16} /> : <Lock size={16} />}
          </button>
        </div>
      </div>
    </header>
  )
}
