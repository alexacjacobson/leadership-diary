import { useRef, useState, useEffect } from 'react'
import { Trash2, Check } from 'lucide-react'
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
  const dragOffset = useRef({ x: 0, y: 0 })
  const posRef = useRef(null)
  const hasMoved = useRef(false)

  const [isDragging, setIsDragging] = useState(false)
  const [posInitialized, setPosInitialized] = useState(false)
  const [showPdf, setShowPdf] = useState(false)
  const [isCardEditing, setIsCardEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [editColor, setEditColor] = useState('')
  const [cardEditRect, setCardEditRect] = useState(null)

  const isPostedMode = !!onCardUpdate

  useEffect(() => {
    if (!onPositionChange) return
    const raw = localStorage.getItem(`card-pos-${doc.id}`)
    if (raw) {
      posRef.current = JSON.parse(raw)
    } else if (doc.x !== undefined && doc.y !== undefined) {
      posRef.current = { x: doc.x, y: doc.y }
    } else if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect()
      posRef.current = { x: rect.left, y: rect.top }
    }
    setPosInitialized(true)
  }, [])

  const onPointerDown = (e) => {
    if (!onPositionChange) return
    if (e.target.closest('textarea, button')) return
    if (isCardEditing) return
    if (e.detail > 1) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    hasMoved.current = false
    dragOffset.current = {
      x: e.clientX - (posRef.current?.x ?? 0),
      y: e.clientY - (posRef.current?.y ?? 0),
    }
    setIsDragging(true)
  }

  const onPointerMove = (e) => {
    if (!isDragging) return
    hasMoved.current = true
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
    localStorage.setItem(`card-pos-${doc.id}`, JSON.stringify(finalPos))
    if (!hasMoved.current && doc.fileType === 'pdf') setShowPdf(true)
    if (onPositionChange) onPositionChange(doc.id, finalPos.x, finalPos.y)
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

  const handleCardClick = (e) => {
    if (e.target.closest('textarea, button')) return
    if (!onPositionChange && doc.fileType === 'pdf') setShowPdf(true)
  }

  const handleStartCardEdit = () => {
    if (!isPostedMode) return
    setEditName(doc.name || '')
    setEditColor(doc.cardColor || '#3B5BDB')
    const rect = cardRef.current.getBoundingClientRect()
    setCardEditRect({ left: rect.left, bottom: rect.bottom, width: rect.width })
    setIsCardEditing(true)
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
        className={`doc-card${onPositionChange ? ' photo-card--draggable' : ''}${isDragging ? ' photo-card--dragging' : ''}`}
        style={cardStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClick={!onPositionChange ? handleCardClick : undefined}
        onDoubleClick={isPostedMode ? handleStartCardEdit : undefined}
      >
        <div className="doc-card__image-area">
          <img src={documentIconSvg} alt="" />
        </div>

        {isPostedMode && (
          <div className="card-controls-overlay">
            {isCardEditing && (
              <button
                type="button"
                className="card-action-btn"
                onPointerDown={e => { e.stopPropagation(); e.preventDefault() }}
                onClick={handleCardDelete}
                aria-label="Delete document"
                style={{ color: '#888888' }}
              >
                <Trash2 size={13} />
              </button>
            )}
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
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleSaveCardEdit() } }}
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

        {isCardEditing && (
          <button
            type="button"
            className="card-edit-confirm-btn"
            onPointerDown={e => { e.stopPropagation(); e.preventDefault() }}
            onClick={handleSaveCardEdit}
            aria-label="Save"
          >
            <Check size={16} />
          </button>
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
