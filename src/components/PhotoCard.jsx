import { useRef, useState } from 'react'

export default function PhotoCard({ photo, onCaptionChange, onPositionChange }) {
  const cardRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [livePos, setLivePos] = useState(null)

  const hasSavedPos = photo.x !== undefined && photo.y !== undefined
  const currentLeft = livePos ? livePos.x : photo.x
  const currentTop = livePos ? livePos.y : photo.y

  const handleMouseDown = (e) => {
    if (!onPositionChange || e.target.closest('textarea')) return
    e.preventDefault()
    const rect = cardRef.current.getBoundingClientRect()
    const offsetX = e.clientX - rect.left
    const offsetY = e.clientY - rect.top
    const initLeft = rect.left
    const initTop = rect.top

    let currentX = hasSavedPos ? photo.x : initLeft
    let currentY = hasSavedPos ? photo.y : initTop

    setIsDragging(true)

    const handleMouseMove = (mv) => {
      currentX = mv.clientX - offsetX
      currentY = mv.clientY - offsetY
      setLivePos({ x: currentX, y: currentY })
    }

    const handleMouseUp = () => {
      onPositionChange(photo.id, currentX, currentY)
      setLivePos(null)
      setIsDragging(false)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
    }

    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
  }

  const cardStyle = { backgroundColor: photo.cardColor }
  if (onPositionChange && (hasSavedPos || isDragging)) {
    cardStyle.position = 'fixed'
    cardStyle.left = (currentLeft !== undefined ? currentLeft : 0) + 'px'
    cardStyle.top = (currentTop !== undefined ? currentTop : 0) + 'px'
    cardStyle.zIndex = isDragging ? 1000 : 10
  }

  return (
    <div
      ref={cardRef}
      className={`photo-card photo-card--${photo.orientation}${onPositionChange ? ' photo-card--draggable' : ''}${isDragging ? ' photo-card--dragging' : ''}`}
      style={cardStyle}
      onMouseDown={handleMouseDown}
    >
      <div className="photo-card__well">
        <img src={photo.src} alt={photo.caption || 'Entry photo'} />
      </div>

      {onCaptionChange ? (
        <textarea
          className="photo-card__caption-edit"
          value={photo.caption}
          onChange={e => onCaptionChange(e.target.value)}
          placeholder="add a caption..."
          aria-label="Photo caption"
        />
      ) : (
        photo.caption && (
          <p className="photo-card__caption">{photo.caption}</p>
        )
      )}
    </div>
  )
}
