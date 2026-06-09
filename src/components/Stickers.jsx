import { useState, useRef, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import { getStickers, saveStickers } from '../hooks/useStickers'
import starRaw     from '../../Assests/Components/star-sticker.svg?raw'
import hearteyeRaw from '../../Assests/Components/Hearteye-sticker.svg?raw'
import heartSrc    from '../../Assests/Components/heart-sticker.svg'
import checkSrc    from '../../Assests/Components/check-sticker.svg'
import sunSrc      from '../../Assests/Components/sun.svg'

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

// Replace hardcoded cobalt/linen fills with CSS variable references so
// these stickers flip correctly in dark mode.
function themedSvg(raw, w, h) {
  return raw
    .replace(/fill="#3B5BDB"/g, 'style="fill:var(--color-cobalt)"')
    .replace(/fill="#FAF8F2"/g, 'style="fill:var(--color-base)"')
    .replace(/(<svg[^>]+)width="[^"]*"/, `$1width="${w}"`)
    .replace(/(<svg[^>]+)height="[^"]*"/, `$1height="${h}"`)
}

// column-reverse means first entry renders at the bottom of the tray
const TRAY = [
  { type: 'star',     raw: starRaw,     w: 108, h: 106 },
  { type: 'sun',      src: sunSrc,      w: 110, h: 110 },
  { type: 'hearteye', raw: hearteyeRaw, w: 120, h: 120 },
  { type: 'heart',    src: heartSrc,    w: 92,  h: 101 },
  { type: 'check',    src: checkSrc,    w: 96,  h: 122 },
]

const SRCS  = Object.fromEntries(TRAY.filter(t => t.src).map(t => [t.type, t.src]))
const RAWS  = Object.fromEntries(TRAY.filter(t => t.raw).map(t => [t.type, t.raw]))
const SIZES = Object.fromEntries(TRAY.map(t => [t.type, { w: t.w, h: t.h }]))

function StickerImage({ type, w, h }) {
  if (RAWS[type]) {
    return (
      <span
        style={{ display: 'block', width: w, height: h, flexShrink: 0 }}
        dangerouslySetInnerHTML={{ __html: themedSvg(RAWS[type], w, h) }}
      />
    )
  }
  return (
    <img
      src={SRCS[type]}
      alt={type}
      draggable={false}
      style={{ width: w, height: h, display: 'block' }}
    />
  )
}

export default function Stickers() {
  const [placedStickers, setPlacedStickers] = useState([])
  const placedRef = useRef([])
  useEffect(() => { placedRef.current = placedStickers }, [placedStickers])

  const [draggingId, setDraggingId] = useState(null)
  const [overTrash, setOverTrash]   = useState(false)
  const overTrashRef = useRef(false)
  const trashRef     = useRef(null)
  const dragRef      = useRef(null)

  useEffect(() => {
    getStickers().then(setPlacedStickers)
  }, [])

  // ── Tray: drag-to-place ─────────────────────────────────────────────
  const handleTrayPointerDown = (item, e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)

    const ox = item.w / 2
    const oy = item.h / 2

    const ghost = document.createElement('div')
    Object.assign(ghost.style, {
      position:      'fixed',
      width:         item.w + 'px',
      height:        item.h + 'px',
      left:          (e.clientX - ox) + 'px',
      top:           (e.clientY - oy) + 'px',
      pointerEvents: 'none',
      zIndex:        '99998',
      opacity:       '0.85',
    })
    if (item.raw) {
      ghost.innerHTML = themedSvg(item.raw, item.w, item.h)
    } else {
      const img = document.createElement('img')
      img.src = item.src
      img.draggable = false
      Object.assign(img.style, { width: item.w + 'px', height: item.h + 'px', display: 'block' })
      ghost.appendChild(img)
    }
    document.body.appendChild(ghost)

    const onMove = (ev) => {
      ghost.style.left = (ev.clientX - ox) + 'px'
      ghost.style.top  = (ev.clientY - oy) + 'px'
    }

    const onUp = (ev) => {
      document.removeEventListener('pointermove', onMove)
      document.removeEventListener('pointerup',   onUp)
      ghost.remove()
      const x = ev.clientX + window.scrollX - ox
      const y = ev.clientY + window.scrollY - oy
      const entry = { id: uid(), type: item.type, x: Math.round(x), y: Math.round(y) }
      setPlacedStickers(prev => {
        const next = [...prev, entry]
        saveStickers(next)
        return next
      })
    }

    document.addEventListener('pointermove', onMove)
    document.addEventListener('pointerup',   onUp)
  }

  // ── Placed sticker: reposition / trash ─────────────────────────────
  const hitTrash = (cx, cy) => {
    if (!trashRef.current) return false
    const r = trashRef.current.getBoundingClientRect()
    return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom
  }

  const handleStickerDown = (sticker, e) => {
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { id: sticker.id, offsetX: e.pageX - sticker.x, offsetY: e.pageY - sticker.y }
    overTrashRef.current = false
    setOverTrash(false)
    setDraggingId(sticker.id)
  }

  const handleStickerMove = (sticker, e) => {
    if (!dragRef.current || dragRef.current.id !== sticker.id) return
    setPlacedStickers(prev =>
      prev.map(s => s.id === sticker.id
        ? { ...s, x: e.pageX - dragRef.current.offsetX, y: e.pageY - dragRef.current.offsetY }
        : s)
    )
    const hit = hitTrash(e.clientX, e.clientY)
    overTrashRef.current = hit
    setOverTrash(hit)
  }

  const handleStickerUp = (sticker) => {
    if (!dragRef.current || dragRef.current.id !== sticker.id) return
    const shouldDelete = overTrashRef.current
    dragRef.current      = null
    overTrashRef.current = false
    setDraggingId(null)
    setOverTrash(false)
    if (shouldDelete) {
      setPlacedStickers(prev => {
        const next = prev.filter(s => s.id !== sticker.id)
        saveStickers(next)
        return next
      })
    } else {
      saveStickers(placedRef.current)
    }
  }

  return (
    <>
      {/* ── Placed stickers layer ── */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', pointerEvents: 'none' }}>
        {placedStickers.map(sticker => {
          const isDragging = draggingId === sticker.id
          const { w, h }   = SIZES[sticker.type] ?? { w: 80, h: 80 }
          return (
            <div
              key={sticker.id}
              className={`sticker-item${isDragging ? ' sticker-item--dragging' : ''}`}
              style={{
                position:      'absolute',
                left:          sticker.x,
                top:           sticker.y,
                pointerEvents: 'all',
                userSelect:    'none',
                cursor:        isDragging ? 'grabbing' : 'grab',
                zIndex:        isDragging ? 9100 : 9000,
              }}
              onPointerDown={e => handleStickerDown(sticker, e)}
              onPointerMove={e => handleStickerMove(sticker, e)}
              onPointerUp={()  => handleStickerUp(sticker)}
            >
              <StickerImage type={sticker.type} w={w} h={h} />
            </div>
          )
        })}
      </div>

      {/* ── Trash zone: visible only while dragging a placed sticker ── */}
      {draggingId !== null && (
        <div
          ref={trashRef}
          className={`sticker-trash-zone${overTrash ? ' sticker-trash-zone--active' : ''}`}
        >
          <Trash2 size={18} />
        </div>
      )}

      {/* ── Tray ── */}
      <div className="sticker-tray">
        {TRAY.map(item => (
          <button
            key={item.type}
            type="button"
            className="sticker-tray-btn"
            onPointerDown={e => handleTrayPointerDown(item, e)}
            aria-label={`Drag ${item.type} sticker`}
          >
            {item.raw
              ? <span
                  style={{ display: 'block', width: 40, height: 40 }}
                  dangerouslySetInnerHTML={{ __html: themedSvg(item.raw, 40, 40) }}
                />
              : <img src={item.src} alt={item.type} draggable={false} />
            }
          </button>
        ))}
      </div>
    </>
  )
}
