import { useRef, useState, useEffect } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import ColorPicker from './ColorPicker'
import documentIconSvg from '../assets/document.svg'

export default function DocumentCard({
  doc,
  module,
  onNameChange,
  onPositionChange,
  onCardUpdate,
  onCardDelete,
}) {
  const cardRef = useRef(null)
  const actionsRef = useRef(null)
  const dragOffset = useRef({ x: 0, y: 0 })
  const hasMoved = useRef(false)

  const [isDragging, setIsDragging] = useState(false)
  const [pos, setPos] = useState(() => {
    const raw = localStorage.getItem(`card-pos-${doc.id}`)
    if (raw) return JSON.parse(raw)
    if (doc.x !== undefined && doc.y !== undefined) return { x: doc.x, y: doc.y }
    return null
  })

  const [showPdf, setShowPdf] = useState(false)
  const [showCardActions, setShowCardActions] = useState(false)
  const [isCardEditing, setIsCardEditing] = useState(false)
  const [editName, setEditName] = useState('')
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
    hasMoved.current = false
    dragOffset.current = {
      x: e.clientX - (pos?.x ?? 0),
      y: e.clientY - (pos?.y ?? 0),
    }
    setIsDragging(true)
  }

  const onPointerMove = (e) => {
    if (!isDragging) return
    hasMoved.current = true
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
    localStorage.setItem(`card-pos-${doc.id}`, JSON.stringify(finalPos))
    if (!hasMoved.current && doc.fileType === 'pdf') setShowPdf(true)
    if (onPositionChange) onPositionChange(doc.id, finalPos.x, finalPos.y)
  }

  const handleCardClick = (e) => {
    if (e.target.closest('textarea, button')) return
    if (!onPositionChange && doc.fileType === 'pdf') setShowPdf(true)
  }

  const handleStartCardEdit = (e) => {
    e.stopPropagation()
    setEditName(doc.name || '')
    setEditColor(doc.cardColor || '#3B5BDB')
    const rect = cardRef.current.getBoundingClientRect()
    setCardEditRect({ left: rect.left, bottom: rect.bottom, width: rect.width })
    setIsCardEditing(true)
    setShowCardActions(false)
  }

  const handleSaveCardEdit = () => {
    onCardUpdate(doc.id, { name: editName, cardColor: editColor })
    setIsCardEditing(false)
    setCardEditRect(null)
  }

  const handleCardDelete = (e) => {
    e.stopPropagation()
    onCardDelete(doc.id)
  }

  const cardStyle = {
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
        className={`doc-card${onPositionChange ? ' photo-card--draggable' : ''}${isDragging ? ' photo-card--dragging' : ''}`}
        style={cardStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={!onPositionChange ? handleCardClick : undefined}
      >
        <div className="doc-card__image-area">
          <img src={documentIconSvg} alt="" />
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

        <div className="doc-card__caption-area">
          {module && <span className="photo-card__module-line">{module}</span>}
          {isPostedMode ? (
            isCardEditing ? (
              <textarea
                className="photo-card__caption-inline-edit"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                placeholder="document name..."
                aria-label="Edit document name"
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              doc.name && <span className="photo-card__caption-line">{doc.name}</span>
            )
          ) : onNameChange ? (
            <textarea
              className="photo-card__caption-inline-edit"
              value={doc.name}
              onChange={e => onNameChange(e.target.value)}
              placeholder="document name..."
              aria-label="Document name"
            />
          ) : (
            doc.name && <span className="photo-card__caption-line">{doc.name}</span>
          )}
        </div>
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

      {showPdf && (
        <div className="pdf-modal-overlay" onClick={() => setShowPdf(false)}>
          <div className="pdf-modal-inner" onClick={e => e.stopPropagation()}>
            <button className="pdf-modal-close" onClick={() => setShowPdf(false)}>close</button>
            <iframe src={doc.src} title={doc.name} />
          </div>
        </div>
      )}
    </>
  )
}
