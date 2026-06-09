import { useRef, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
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
  isEditingParent,
  onCaptionChange,
  onCardUpdate,
  onCardDelete,
}) {
  const cardRef        = useRef(null)
  const replaceFileRef = useRef(null)
  const editPanelRef   = useRef(null)
  const expandTimer    = useRef(null)

  const [isCardEditing, setIsCardEditing] = useState(false)
  const [editCaption,   setEditCaption]   = useState('')
  const [editColor,     setEditColor]     = useState('')
  const [cardEditRect,  setCardEditRect]  = useState(null)

  // expandData: null = closed, { rect, tx, ty, scale } = open
  const [expandData, setExpandData] = useState(null)
  const [isScaled,   setIsScaled]   = useState(false)

  const isPostedMode = !!onCardUpdate
  const isExpanded   = expandData !== null
  const canExpand    = !isEditingParent && !onCaptionChange && !isCardEditing

  // Trigger the translate+scale transition one frame after the clone mounts
  useEffect(() => {
    if (!isExpanded) return
    const id = requestAnimationFrame(() => setIsScaled(true))
    return () => cancelAnimationFrame(id)
  }, [isExpanded])

  // Esc to close expanded view
  useEffect(() => {
    if (!isExpanded) return
    const handler = (e) => { if (e.key === 'Escape') closeExpanded() }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isExpanded])

  useEffect(() => () => clearTimeout(expandTimer.current), [])

  const openExpanded = () => {
    if (!cardRef.current) return
    clearTimeout(expandTimer.current)
    const rect  = cardRef.current.getBoundingClientRect()
    const scale = Math.min(
      (window.innerWidth  * 0.85) / rect.width,
      (window.innerHeight * 0.85) / rect.height,
      4
    )
    // Translation needed to move the card's center to the viewport center
    const tx = window.innerWidth  / 2 - (rect.left + rect.width  / 2)
    const ty = window.innerHeight / 2 - (rect.top  + rect.height / 2)
    setExpandData({ rect, tx, ty, scale })
    setIsScaled(false)
  }

  const closeExpanded = () => {
    setIsScaled(false)
    expandTimer.current = setTimeout(() => setExpandData(null), 400)
  }

  // Card editing effects
  useEffect(() => {
    if (!isCardEditing) return
    const handler = (e) => { if (e.key === 'Escape') setIsCardEditing(false) }
    document.addEventListener('keydown', handler)
    return () => document.removeEventListener('keydown', handler)
  }, [isCardEditing])

  useEffect(() => {
    if (!isCardEditing) return
    const handler = (e) => {
      if (
        cardRef.current && !cardRef.current.contains(e.target) &&
        (!editPanelRef.current || !editPanelRef.current.contains(e.target))
      ) handleSaveCardEdit()
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [isCardEditing, editCaption, editColor])

  const handleStartCardEdit = () => {
    if (!isPostedMode) return
    clearTimeout(expandTimer.current)
    setExpandData(null)
    setIsScaled(false)
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

  const activeColor = isCardEditing ? editColor : photo.cardColor
  const isLightCard = activeColor === '#FAF8F2' || activeColor === '#FFFFFF'

  const cardStyle = {
    backgroundColor: activeColor,
    // Hide in-layout card while expanded clone is visible; preserve layout space
    ...(expandData ? { opacity: 0, pointerEvents: 'none' } : {}),
  }

  return (
    <>
      <div
        ref={cardRef}
        className={`photo-card photo-card--${photo.orientation}${isCardEditing ? ' photo-card--editing' : ''}${isLightCard ? ' photo-card--light' : ''}${isEditingParent ? ' photo-card--parent-editing' : ''}`}
        style={cardStyle}
        onClick={canExpand && !expandData ? openExpanded : undefined}
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
          {canExpand && (
            <div className="photo-card__zoom-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8"/>
                <line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </div>
          )}
        </div>

        {isPostedMode && isCardEditing && (
          <button
            type="button"
            className="card-action-btn"
            onClick={handleCardDelete}
            aria-label="Delete photo"
            style={{
              position: 'absolute',
              bottom: '10px',
              right: '10px',
              zIndex: 25,
              color: trashIconColor(activeColor),
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

      {/* Expanded card portal — escapes local stacking contexts */}
      {expandData && createPortal(
        <>
          {/* Backdrop dims the page; click outside to close */}
          <div
            className="photo-expand-backdrop"
            style={{ opacity: isScaled ? 1 : 0 }}
            onClick={closeExpanded}
          />
          {/* Clone starts at the card's exact position, then translates to viewport center */}
          <div
            className={`photo-card photo-card--${photo.orientation}${isLightCard ? ' photo-card--light' : ''}`}
            style={{
              position:        'fixed',
              left:            expandData.rect.left,
              top:             expandData.rect.top,
              width:           expandData.rect.width,
              backgroundColor: photo.cardColor,
              zIndex:          9500,
              cursor:          'pointer',
              transform:       isScaled
                ? `translate(${expandData.tx}px, ${expandData.ty}px) scale(${expandData.scale})`
                : 'translate(0, 0) scale(1)',
              transformOrigin: 'center center',
              transition:      'transform 0.4s cubic-bezier(0.34, 1.1, 0.64, 1)',
              pointerEvents:   'auto',
            }}
            onClick={closeExpanded}
          >
            <div className="photo-card__well">
              <img
                src={photo.src}
                alt={photo.caption || 'Entry photo'}
                onClick={e => e.stopPropagation()}
              />
            </div>
            {photo.caption && (
              <div className="photo-card__caption-area" onClick={e => e.stopPropagation()}>
                {module && <span className="photo-card__module-line">{module}</span>}
                <span className="photo-card__caption-line">{photo.caption}</span>
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  )
}
