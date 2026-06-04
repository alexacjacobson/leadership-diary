import { Lock, Unlock } from 'lucide-react'
import bloomPink from '../assets/bloom-pink.svg'

export default function NavHeader({ isUnlocked, onLockClick }) {
  return (
    <header className="nav-header">
      <div className="nav-inner">
        <img src={bloomPink} alt="" className="nav-bloom" />
        <span
          className="nav-name"
          style={{ cursor: 'pointer' }}
          onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }) }}
        >Alexa Jacobson</span>
        <div className="nav-right">
          <button
            className="nav-lock-btn"
            onClick={onLockClick}
            aria-label={isUnlocked ? 'Lock' : 'Unlock'}
          >
            {isUnlocked
              ? <Unlock size={16} color="#D45FA8" />
              : <Lock size={16} color="#888888" />
            }
          </button>
        </div>
      </div>
    </header>
  )
}
