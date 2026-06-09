import checkSrc from '../../Assests/Components/check-sticker.svg'
import heartSrc from '../../Assests/Components/heart-sticker.svg'
import hearteyeSrc from '../../Assests/Components/Hearteye-sticker.svg'
import starSrc from '../../Assests/Components/star-sticker.svg'

// bottom to top: check, heart, hearteye, star (column-reverse means first = bottom)
const TRAY = [
  { type: 'check',    src: checkSrc,    w: 96,  h: 122 },
  { type: 'heart',    src: heartSrc,    w: 92,  h: 101 },
  { type: 'hearteye', src: hearteyeSrc, w: 159, h: 159 },
  { type: 'star',     src: starSrc,     w: 108, h: 106 },
]

export default function StickerTray({ onPlace }) {
  const handlePointerDown = (item, e) => {
    e.preventDefault()

    const ox = item.w / 2
    const oy = item.h / 2

    const ghost = document.createElement('img')
    ghost.src = item.src
    ghost.draggable = false
    Object.assign(ghost.style, {
      position: 'fixed',
      left: (e.clientX - ox) + 'px',
      top:  (e.clientY - oy) + 'px',
      pointerEvents: 'none',
      zIndex: '99998',
      opacity: '0.85',
      width: item.w + 'px',
      height: item.h + 'px',
    })
    document.body.appendChild(ghost)

    const onMove = (ev) => {
      ghost.style.left = (ev.clientX - ox) + 'px'
      ghost.style.top  = (ev.clientY - oy) + 'px'
    }

    const onUp = (ev) => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup', onUp)
      document.body.removeChild(ghost)
      onPlace(item.type, ev.clientX - ox, ev.clientY - oy)
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup', onUp)
  }

  return (
    <div className="sticker-tray">
      {TRAY.map(item => (
        <button
          key={item.type}
          type="button"
          className="sticker-tray-btn"
          onPointerDown={e => handlePointerDown(item, e)}
          aria-label={`Drag ${item.type} sticker`}
        >
          <img src={item.src} alt={item.type} draggable={false} />
        </button>
      ))}
    </div>
  )
}
