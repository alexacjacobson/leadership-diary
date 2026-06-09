import { useRef } from 'react'
import { X } from 'lucide-react'
import ColorPicker from './ColorPicker'

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// onUpdate(patch) present  → edit mode (full controls)
// onUpdate absent          → read mode (image click opens URL)
export default function LinkCard({ link, onUpdate, onDelete }) {
  const fileRef = useRef(null)
  const isEditMode = !!onUpdate
  const isLight = link.cardColor === '#FAF8F2' || link.cardColor === '#FFFFFF'

  const handleWellClick = () => {
    if (isEditMode) {
      fileRef.current?.click()
    } else if (link.url) {
      window.open(link.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleFile = (e) => {
    const file = e.target.files[0]
    if (!file) return
    toBase64(file).then(src => onUpdate({ src }))
    e.target.value = ''
  }

  return (
    <div
      className={`link-card${isLight ? ' link-card--light' : ''}${isEditMode ? ' link-card--editing' : ''}`}
      style={{ backgroundColor: link.cardColor || '#FAF8F2' }}
    >
      {/* Thumbnail area */}
      <div
        className="link-card__well"
        onClick={handleWellClick}
        style={{ cursor: (isEditMode || link.url) ? 'pointer' : 'default' }}
      >
        {link.src ? (
          <>
            <img src={link.src} alt={link.caption || 'Link'} draggable={false} />
            {isEditMode ? (
              <div className="link-card__well-overlay">
                <span>click to replace</span>
              </div>
            ) : (
              link.url && <div className="link-card__open-badge">Open ↗</div>
            )}
          </>
        ) : (
          <div className="link-card__placeholder">
            {isEditMode && 'click to add thumbnail'}
          </div>
        )}
      </div>

      {/* Edit mode controls */}
      {isEditMode && (
        <div className="link-card__edit-area">
          <textarea
            className="link-card__caption-edit"
            value={link.caption}
            onChange={e => onUpdate({ caption: e.target.value })}
            placeholder="add a caption..."
            aria-label="Link caption"
          />
          <input
            className="link-card__url-input"
            type="url"
            value={link.url}
            onChange={e => onUpdate({ url: e.target.value })}
            placeholder="https://..."
            aria-label="Link URL"
          />
          <div className="link-card__controls">
            <ColorPicker value={link.cardColor || '#FAF8F2'} onChange={color => onUpdate({ cardColor: color })} />
            <button
              type="button"
              className="link-card__delete-btn"
              onClick={onDelete}
              aria-label="Remove link card"
            >
              <X size={13} />
            </button>
          </div>
        </div>
      )}

      {/* Read mode caption */}
      {!isEditMode && link.caption && (
        <div className="link-card__caption-area">
          <span className="link-card__caption-line">{link.caption}</span>
        </div>
      )}

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="visually-hidden"
        onChange={handleFile}
        aria-label="Upload link thumbnail"
      />
    </div>
  )
}
