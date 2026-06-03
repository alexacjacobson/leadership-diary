import { useRef, useState } from 'react'
import documentIconSvg from '../assets/document.svg'

export default function DocumentCard({ doc, onNameChange, onPositionChange }) {
  const cardRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [livePos, setLivePos] = useState(null)
  const [showPdf, setShowPdf] = useState(false)

  const hasSavedPos = doc.x !== undefined && doc.y !== undefined
  const currentLeft = livePos ? livePos.x : doc.x
  const currentTop = livePos ? livePos.y : doc.y

  const handleMouseDown = (e) => {
    if (!onPositionChange || e.target.closest('textarea')) return
    e.preventDefault()
    const rect = cardRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    const initLeft = rect.left
    const initTop = rect.top

    let currentX = hasSavedPos ? doc.x : initLeft
    let currentY = hasSavedPos ? doc.y : initTop
    let moved = false

    setIsDragging(true)

    const handleMouseMove = (mv) => {
      const dx = mv.clientX - (e.clientX)
      const dy = mv.clientY - (e.clientY)
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) moved = true
      currentX = mv.clientX - offsetX
      currentY = mv.clientY - offsetY
      setLivePos({ x: currentX, y: currentY })
    }

    const handleMouseUp = (mu) => {
      if (!moved && doc.fileType === 'pdf') {
        setShowPdf(true)
      }
      onPositionChange(doc.id, currentX, currentY)
      setLivePos(null)
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const handleCardClick = (e) => {
    if (e.target.closest('textarea')) return
    if (doc.fileType === 'pdf' && !onPositionChange) {
      setShowPdf(true)
    }
  }

  const cardStyle = { backgroundColor: doc.cardColor || '#3B5BDB' }
  if (onPositionChange && (hasSavedPos || isDragging)) {
    cardStyle.position = 'fixed'
    cardStyle.left = (currentLeft !== undefined ? currentLeft : 0) + 'px'
    cardStyle.top = (currentTop !== undefined ? currentTop : 0) + 'px'
    cardStyle.zIndex = isDragging ? 1000 : 10
  }

  return (
    <>
      <div
        ref={cardRef}
        className={`photo-card photo-card--horizontal${onPositionChange ? ' photo-card--draggable' : ''}${isDragging ? ' photo-card--dragging' : ''}`}
        style={cardStyle}
        onMouseDown={onPositionChange ? handleMouseDown : undefined}
        onClick={!onPositionChange ? handleCardClick : undefined}
      >
        <div className="photo-card__well doc-card__well">
          <img src={documentIconSvg} alt="" className="doc-card__icon" />
        </div>

        {onNameChange ? (
          <textarea
            className="photo-card__caption-edit"
            value={doc.name}
            onChange={e => onNameChange(e.target.value)}
            placeholder="document name..."
            aria-label="Document name"
          />
        ) : (
          <p className="photo-card__caption">{doc.name}</p>
        )}
      </div>

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
