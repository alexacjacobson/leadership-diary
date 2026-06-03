import { useRef, useState, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import ColorPicker from './ColorPicker'

export default function PhotoCard({
  photo,
  module,
  onCaptionChange,
  onPositionChange,
  onCardUpdate,
  onCardDelete,
}) {
  const cardRef = useRef(null)
  const actionsRef = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })

  const [isDragging, setIsDragging] = useState(false)
  const [pos, setPos] = useState(() => {
    const raw = localStorage.getItem(`card-pos-${photo.id}`)
    if (raw) return JSON.parse(raw)
    if (photo.x !== undefined && photo.y !== undefined) return { x: photo.x, y: photo.y }
    return null
  })

  const [showCardActions, setShowCardActions] = useState(false)
  const [isCardEditing, setIsCardEditing] = useState(false)
  const [editCaption, setEditCaption] = useState('')
  const [editColor, setEditColor] = useState('')
  const [cardEditRect, setCardEditRect] = useState(null)

  const isPostedMode = !!onCardUpdate

  useEffect(() => {
    if (!showCardActions) return
    const handleOutside = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowCardActions(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showCardActions])

  useEffect(() => {
    if (!onPositionChange || pos !== null) return
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      setPos({ x: rect.left, y: rect.top })
    }
  }, [])

  const onPointerDown = (e) => {
    if (!onPositionChange) return
    if (e.target.closest('textarea, button')) return
    if (isCardEditing) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    dragOffset.current = {
      x: e.clientX - (pos?.x ?? 0),
      y: e.clientY - (pos?.y ?? 0),
    }
    setIsDragging(true)
  }

  const onPointerMove = (e) => {
    if (!isDragging) return
    setPos({
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    })
  }

  const onPointerUp = (e) => {
    setIsDragging(false)
    const finalPos = {
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    }
    setPos(finalPos)
    localStorage.setItem(`card-pos-${photo.id}`, JSON.stringify(finalPos))
    if (onPositionChange) onPositionChange(photo.id, finalPos.x, finalPos.y)
  }

  const handleStartCardEdit = (e) => {
    e.stopPropagation()
    setEditCaption(photo.caption || '')
    setEditColor(photo.cardColor)
    const rect = cardRef.current.getBoundingClientRect()
    setCardEditRect({ left: rect.left, bottom: rect.bottom, width: rect.width })
    setIsCardEditing(true)
    setShowCardActions(false)
  }

  const handleSaveCardEdit = () => {
    onCardUpdate(photo.id, { caption: editCaption, cardColor: editColor })
    setIsCardEditing(false)
    setCardEditRect(null)
  }

  const handleCardDelete = (e) => {
    e.stopPropagation()
    onCardDelete(photo.id)
  }

  const cardStyle = {
    backgroundColor: isCardEditing ? editColor : photo.cardColor,
    ...(onPositionChange && pos ? {
      position: 'fixed',
      left: pos.x,
      top: pos.y,
      cursor: isDragging ? 'grabbing' : 'grab',
      userSelect: 'none',
      touchAction: 'none',
      zIndex: isDragging ? 1000 : (isCardEditing ? 500 : 1),
    } : {}),
  }

  return (
    <>
      <div
        ref={cardRef}
        className={`photo-card photo-card--${photo.orientation}${onPositionChange ? ' photo-card--draggable' : ''}${isDragging ? ' photo-card--dragging' : ''}`}
        style={cardStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
      >
        <div className="photo-card__well">
          <img src={photo.src} alt={photo.caption || 'Entry photo'} />
        </div>

        {isPostedMode && (
          <div className="card-controls-overlay" ref={actionsRef}>
            {!showCardActions && !isCardEditing ? (
              <button
                type="button"
                className="card-more-btn"
                onClick={e => { e.stopPropagation(); setShowCardActions(true) }}
                aria-label="Card options"
              >
                <MoreHorizontal size={14} />
              </button>
            ) : showCardActions ? (
              <div className="card-action-btns">
                <button type="button" className="card-action-btn" onClick={handleStartCardEdit} aria-label="Edit card">
                  <Pencil size={13} />
                </button>
                <button type="button" className="card-action-btn" onClick={handleCardDelete} aria-label="Delete card">
                  <Trash2 size={13} />
                </button>
              </div>
            ) : null}
          </div>
        )}

        {isPostedMode ? (
          <div className="photo-card__caption-area">
            {module && <span className="photo-card__module-line">{module}</span>}
            {isCardEditing ? (
              <textarea
                className="photo-card__caption-inline-edit"
                value={editCaption}
                onChange={e => setEditCaption(e.target.value)}
                placeholder="add a caption..."
                aria-label="Edit caption"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              photo.caption && <span className="photo-card__caption-line">{photo.caption}</span>
            )}
          </div>
        ) : onCaptionChange ? (
          <textarea
            className="photo-card__caption-edit"
            value={photo.caption}
            onChange={e => onCaptionChange(e.target.value)}
            placeholder="add a caption..."
            aria-label="Photo caption"
          />
        ) : (
          <div className="photo-card__caption-area">
            {module && <span className="photo-card__module-line">{module}</span>}
            {photo.caption && <span className="photo-card__caption-line">{photo.caption}</span>}
          </div>
        )}
      </div>

      {isCardEditing && cardEditRect && (
        <div
          className="card-edit-panel"
          style={{
            position: 'fixed',
            left: cardEditRect.left + 'px',
            top: (cardEditRect.bottom + 8) + 'px',
            width: cardEditRect.width + 'px',
            zIndex: 500,
          }}
        >
          <ColorPicker value={editColor} onChange={setEditColor} />
          <button type="button" className="form-text-action" onClick={handleSaveCardEdit}>
            save
          </button>
        </div>
      )}
    </>
  )
}
