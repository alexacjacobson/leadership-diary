import { useRef, useState, useEffect } from 'react'
import { Trash2 } from 'lucide-react'
import ColorPicker from './ColorPicker'

const DARK_COLORS = new Set(['#1A1A1A', '#067A42', '#3B5BDB'])
function trashIconColor(color) {
  return DARK_COLORS.has(color) ? '#FFFFFF' : '#1A1A1A'
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function PhotoCard({
  photo,
  module,
  onCaptionChange,
  onPositionChange,
  onCardUpdate,
  onCardDelete,
}) {
  const cardRef = useRef(null)
  const replaceFileRef = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const posRef = useRef(null)
  const editPanelRef = useRef(null)

  const [isDragging, setIsDragging] = useState(false)
  const [posInitialized, setPosInitialized] = useState(false)
  const [isCardEditing, setIsCardEditing] = useState(false)
  const [editCaption, setEditCaption] = useState('')
  const [editColor, setEditColor] = useState('')
  const [cardEditRect, setCardEditRect] = useState(null)

  const isPostedMode = !!onCardUpdate

  useEffect(() => {
    if (!onPositionChange) return
    const raw = localStorage.getItem(`card-pos-${photo.id}`)
    if (raw) {
      posRef.current = JSON.parse(raw)
      setPosInitialized(true)
    } else if (photo.x !== undefined && photo.y !== undefined) {
      posRef.current = { x: photo.x, y: photo.y }
      setPosInitialized(true)
    }
    // No position saved — card stays in normal document flow
  }, [])

  const onPointerDown = (e) => {
    if (!onPositionChange) return
    if (e.target.closest('textarea, button')) return
    if (isCardEditing) return
    if (e.detail > 1) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    if (!posRef.current && cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      posRef.current = { x: rect.left, y: rect.top }
      cardRef.current.style.position = 'fixed'
      cardRef.current.style.left = rect.left + 'px'
      cardRef.current.style.top = rect.top + 'px'
      setPosInitialized(true)
    }
    dragOffset.current = {
      x: e.clientX - (posRef.current?.x ?? 0),
      y: e.clientY - (posRef.current?.y ?? 0),
    }
    setIsDragging(true)
  }

  const onPointerMove = (e) => {
    if (!isDragging) return
    const x = e.clientX - dragOffset.current.x
    const y = e.clientY - dragOffset.current.y
    posRef.current = { x, y }
    if (cardRef.current) {
      cardRef.current.style.left = x + 'px'
      cardRef.current.style.top = y + 'px'
    }
  }

  const onPointerUp = (e) => {
    if (!isDragging) return
    const finalPos = {
      x: e.clientX - dragOffset.current.x,
      y: e.clientY - dragOffset.current.y,
    }
    posRef.current = finalPos
    localStorage.setItem(`card-pos-${photo.id}`, JSON.stringify(finalPos))
    if (onPositionChange) onPositionChange(photo.id, finalPos.x, finalPos.y)
    setIsDragging(false)
  }

  useEffect(() => {
    if (!isCardEditing) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsCardEditing(false)
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isCardEditing])

  useEffect(() => {
    if (!isCardEditing) return
    const handleMouseDown = (e) => {
      if (
        cardRef.current && !cardRef.current.contains(e.target) &&
        (!editPanelRef.current || !editPanelRef.current.contains(e.target))
      ) {
        handleSaveCardEdit()
      }
    }
    document.addEventListener('mousedown', handleMouseDown)
    return () => document.removeEventListener('mousedown', handleMouseDown)
  }, [isCardEditing, editCaption, editColor])

  const handleStartCardEdit = () => {
    if (!isPostedMode) return
    setEditCaption(photo.caption || '')
    setEditColor(photo.cardColor)
    const rect = cardRef.current.getBoundingClientRect()
    setCardEditRect({ left: rect.left, bottom: rect.bottom, width: rect.width })
    setIsCardEditing(true)
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

  const handleReplacePhoto = (e) => {
    const file = e.target.files[0]
    if (!file) return
    toBase64(file).then(src => onCardUpdate(photo.id, { src }))
    e.target.value = ''
  }

  const cardStyle = {
    backgroundColor: isCardEditing ? editColor : photo.cardColor,
    ...(onPositionChange && posInitialized && posRef.current ? {
      position: 'fixed',
      left: posRef.current.x,
      top: posRef.current.y,
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
        className={`photo-card photo-card--${photo.orientation}${onPositionChange ? ' photo-card--draggable' : ''}${isDragging ? ' photo-card--dragging' : ''}${isCardEditing ? ' photo-card--editing' : ''}`}
        style={cardStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onDoubleClick={isPostedMode ? handleStartCardEdit : undefined}
      >
        <div
          className="photo-card__well"
          onClick={isCardEditing && isPostedMode ? () => replaceFileRef.current?.click() : undefined}
          style={isCardEditing && isPostedMode ? { cursor: 'pointer' } : undefined}
        >
          <img src={photo.src} alt={photo.caption || 'Entry photo'} />
          {isCardEditing && isPostedMode && (
            <div className="photo-card__well-overlay">
              <span>click to replace</span>
            </div>
          )}
        </div>

        {isPostedMode && isCardEditing && (
          <button
            type="button"
            className="card-action-btn"
            onPointerDown={e => { e.stopPropagation(); e.preventDefault() }}
            onClick={handleCardDelete}
            aria-label="Delete photo"
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              zIndex: 25,
              color: '#FFFFFF',
            }}
          >
            <Trash2 size={13} />
          </button>
        )}

        {isPostedMode ? (
          <div className="photo-card__caption-area">
            {module && <span className="photo-card__module-line">{module}</span>}
            {isCardEditing ? (
              <>
                <ColorPicker value={editColor} onChange={setEditColor} />
                <textarea
                  className="photo-card__caption-inline-edit"
                  value={editCaption}
                  onChange={e => setEditCaption(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveCardEdit() } }}
                  placeholder="add a caption..."
                  aria-label="Edit caption"
                  autoFocus
                  onClick={e => e.stopPropagation()}
                />
              </>
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

      <input
        ref={replaceFileRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        onChange={handleReplacePhoto}
        aria-label="Replace photo"
      />

    </>
  )
}
