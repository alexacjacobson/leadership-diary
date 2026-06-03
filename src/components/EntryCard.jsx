import { useState, useRef } from 'react'
import { MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import PhotoCard from './PhotoCard'
import DocumentCard from './DocumentCard'
import ColorPicker from './ColorPicker'

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export default function EntryCard({ entry, index, onDelete, onUpdate }) {
  const [showActions, setShowActions] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [editReflection, setEditReflection] = useState(entry.reflection)
  const [editPhotos, setEditPhotos] = useState(entry.photos || [])
  const replaceRefs = useRef({})

  const handleStartEdit = () => {
    setEditReflection(entry.reflection)
    setEditPhotos(entry.photos ? [...entry.photos] : [])
    setIsEditing(true)
  }

  const handleSave = () => {
    onUpdate(entry.id, {
      reflection: editReflection.trim(),
      photos: editPhotos,
    })
    setIsEditing(false)
    setShowActions(false)
  }

  const handleCancelEdit = () => {
    setEditReflection(entry.reflection)
    setEditPhotos(entry.photos ? [...entry.photos] : [])
    setIsEditing(false)
    setShowActions(false)
  }

  const updateEditPhoto = (photoId, patch) => {
    setEditPhotos(prev => prev.map(p => (p.id === photoId ? { ...p, ...patch } : p)))
  }

  const handleReplacePhoto = async (photoId, file) => {
    if (!file) return
    const src = await toBase64(file)
    updateEditPhoto(photoId, { src })
  }

  const handlePhotoPositionChange = (photoId, x, y) => {
    const updatedPhotos = (entry.photos || []).map(p =>
      p.id === photoId ? { ...p, x, y } : p
    )
    onUpdate(entry.id, { photos: updatedPhotos })
  }

  const handleDocPositionChange = (docId, x, y) => {
    const updatedDocs = (entry.documents || []).map(d =>
      d.id === docId ? { ...d, x, y } : d
    )
    onUpdate(entry.id, { documents: updatedDocs })
  }

  const handleDocNameChange = (docId, name) => {
    const updatedDocs = (entry.documents || []).map(d =>
      d.id === docId ? { ...d, name } : d
    )
    onUpdate(entry.id, { documents: updatedDocs })
  }

  return (
    <article
      className="entry-card"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <div className="entry-meta">
        {entry.module && (
          <span className="entry-module-label">{entry.module}</span>
        )}
        <span className="entry-week-label">
          {entry.weekLabel} — {formatDate(entry.createdAt)}
        </span>
        <div className="entry-controls">
          {!showActions && !isEditing ? (
            <button
              className="entry-more-btn"
              onClick={() => setShowActions(true)}
              aria-label="Entry options"
            >
              <MoreHorizontal size={16} />
            </button>
          ) : (
            !isEditing && (
              <div className="entry-action-btns">
                <button
                  className="entry-action-btn"
                  onClick={handleStartEdit}
                  aria-label="Edit entry"
                >
                  <Pencil size={15} />
                </button>
                <button
                  className="entry-action-btn"
                  onClick={() => onDelete(entry.id)}
                  aria-label="Delete entry"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            )
          )}
        </div>
      </div>

      {isEditing ? (
        <>
          <div className="entry-reflection-bg">
            <textarea
              className="entry-edit-textarea"
              value={editReflection}
              onChange={e => setEditReflection(e.target.value)}
              rows={4}
              autoFocus
              aria-label="Edit reflection"
            />
          </div>

          {editPhotos.length > 0 && (
            <div className="edit-photo-section">
              {editPhotos.map(photo => (
                <div key={photo.id} className="edit-photo-item">
                  <PhotoCard
                    photo={photo}
                    onCaptionChange={caption => updateEditPhoto(photo.id, { caption })}
                  />
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => replaceRefs.current[photo.id]?.click()}
                  >
                    Replace photo
                  </button>
                  <input
                    ref={el => { if (el) replaceRefs.current[photo.id] = el }}
                    type="file"
                    accept="image/*"
                    className="visually-hidden"
                    onChange={e => handleReplacePhoto(photo.id, e.target.files[0])}
                    aria-label="Replace photo"
                  />
                  <ColorPicker
                    value={photo.cardColor}
                    onChange={color => updateEditPhoto(photo.id, { cardColor: color })}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="entry-edit-actions">
            <button
              type="button"
              className="btn btn-secondary btn-sm"
              onClick={handleCancelEdit}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={handleSave}
            >
              Save changes
            </button>
          </div>
        </>
      ) : (
        <>
          {entry.reflection && (
            <div className="entry-reflection-bg">
              <p className="entry-reflection">{entry.reflection}</p>
            </div>
          )}
          {(entry.photos || []).length > 0 && (
            <div className="entry-photos">
              {(entry.photos || []).map(photo => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  onPositionChange={handlePhotoPositionChange}
                />
              ))}
            </div>
          )}
          {(entry.documents || []).length > 0 && (
            <div className="entry-photos">
              {(entry.documents || []).map(doc => (
                <DocumentCard
                  key={doc.id}
                  doc={doc}
                  onNameChange={name => handleDocNameChange(doc.id, name)}
                  onPositionChange={handleDocPositionChange}
                />
              ))}
            </div>
          )}
        </>
      )}
    </article>
  )
}
