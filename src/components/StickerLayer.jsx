import { useState, useRef } from 'react'
import { Trash2 } from 'lucide-react'
import checkSrc from '../../Assests/Components/check-sticker.svg'
import heartSrc from '../../Assests/Components/heart-sticker.svg'
import hearteyeSrc from '../../Assests/Components/Hearteye-sticker.svg'
import starSrc from '../../Assests/Components/star-sticker.svg'

const SRCS = {
  check:    checkSrc,
  heart:    heartSrc,
  hearteye: hearteyeSrc,
  star:     starSrc,
}

export default function StickerLayer({ stickers, onMove, onMoveEnd, onDelete }) {
  const [draggingId, setDraggingId] = useState(null)
  const [overTrash, setOverTrash]   = useState(false)
  const dragRef     = useRef(null)   // { id, offsetX, offsetY }
  const overTrashRef = useRef(false) // sync ref so onPointerUp reads latest value
  const trashRef    = useRef(null)

  const hitTestTrash = (clientX, clientY) => {
    if (!trashRef.current) return false
    const r = trashRef.current.getBoundingClientRect()
    return clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom
  }

  return (
    <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none' }}>
      {stickers.map(sticker => {
        const isDragging = draggingId === sticker.id

        return (
          <div
            key={sticker.id}
            className={`sticker-item${isDragging ? ' sticker-item--dragging' : ''}`}
            style={{
              position: 'fixed',
              left: sticker.x,
              top: sticker.y,
              pointerEvents: 'auto',
              userSelect: 'none',
              cursor: isDragging ? 'grabbing' : 'grab',
              zIndex: isDragging ? 9100 : 9000,
            }}
            onPointerDown={(e) => {
              e.preventDefault()
              e.currentTarget.setPointerCapture(e.pointerId)
              dragRef.current = {
                id: sticker.id,
                offsetX: e.clientX - sticker.x,
                offsetY: e.clientY - sticker.y,
              }
              overTrashRef.current = false
              setOverTrash(false)
              setDraggingId(sticker.id)
            }}
            onPointerMove={(e) => {
              if (!dragRef.current || dragRef.current.id !== sticker.id) return
              onMove(sticker.id, e.clientX - dragRef.current.offsetX, e.clientY - dragRef.current.offsetY)
              const hit = hitTestTrash(e.clientX, e.clientY)
              overTrashRef.current = hit
              setOverTrash(hit)
            }}
            onPointerUp={() => {
              if (!dragRef.current || dragRef.current.id !== sticker.id) return
              const shouldDelete = overTrashRef.current
              dragRef.current = null
              overTrashRef.current = false
              setDraggingId(null)
              setOverTrash(false)
              if (shouldDelete) {
                onDelete(sticker.id)
              } else {
                onMoveEnd()
              }
            }}
          >
            <img src={SRCS[sticker.type]} alt={sticker.type} draggable={false} />
          </div>
        )
      })}

      {/* Floating trash zone — visible only while dragging a placed sticker */}
      {draggingId !== null && (
        <div
          ref={trashRef}
          className={`sticker-trash-zone${overTrash ? ' sticker-trash-zone--active' : ''}`}
        >
          <Trash2 size={18} />
        </div>
      )}
    </div>
  )
}
