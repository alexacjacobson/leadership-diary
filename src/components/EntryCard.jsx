import { useState, useRef, useEffect } from 'react'
import { Trash2, X } from 'lucide-react'
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

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function fileExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

function assignOrientations(photos) {
  return photos.map((p, i) => ({
    ...p,
    orientation: i === 0 ? 'horizontal' : 'vertical',
  }))
}

export default function EntryCard({ entry, index, isUnlocked, onDelete, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false)
  const [editReflection, setEditReflection] = useState(entry.reflection || '')
  const [editBiggestChallenges, setEditBiggestChallenges] = useState(entry.biggestChallenges || '')
  const [editKeyLearnings, setEditKeyLearnings] = useState(entry.keyLearnings || '')
  const [editNewGoals, setEditNewGoals] = useState(entry.newGoals || '')
  const [editPhotos, setEditPhotos] = useState(entry.photos || [])
  const [newEditPhotos, setNewEditPhotos] = useState([])
  const [editDocuments, setEditDocuments] = useState(entry.documents || [])
  const replaceRefs = useRef({})
  const photoAddRef = useRef(null)
  const docAddRef = useRef(null)

  useEffect(() => {
    if (!isEditing) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCancelEdit()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditing])

  const handleStartEdit = () => {
    setEditReflection(entry.reflection || '')
    setEditBiggestChallenges(entry.biggestChallenges || '')
    setEditKeyLearnings(entry.keyLearnings || '')
    setEditNewGoals(entry.newGoals || '')
    setEditPhotos(entry.photos ? [...entry.photos] : [])
    setNewEditPhotos([])
    setEditDocuments(entry.documents ? [...entry.documents] : [])
    setIsEditing(true)
  }

  const handleSave = () => {
    onUpdate(entry.id, {
      reflection: editReflection.trim(),
      biggestChallenges: editBiggestChallenges.trim(),
      keyLearnings: editKeyLearnings.trim(),
      newGoals: editNewGoals.trim(),
      photos: [...editPhotos, ...newEditPhotos],
      documents: editDocuments,
    })
    setIsEditing(false)
    setShowActions(false)
  }

  const handleCancelEdit = () => {
    setEditReflection(entry.reflection || '')
    setEditBiggestChallenges(entry.biggestChallenges || '')
    setEditKeyLearnings(entry.keyLearnings || '')
    setEditNewGoals(entry.newGoals || '')
    setEditPhotos(entry.photos ? [...entry.photos] : [])
    setNewEditPhotos([])
    setEditDocuments(entry.documents ? [...entry.documents] : [])
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

  const handleAddPhoto = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const incoming = await Promise.all(
      files.map(async (file) => ({
        id: uid(),
        src: await toBase64(file),
        caption: '',
        cardColor: '#FFB8E7',
        orientation: 'vertical',
      }))
    )
    setNewEditPhotos(prev => assignOrientations([...prev, ...incoming]))
    e.target.value = ''
  }

  const handleAddDoc = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const incoming = await Promise.all(
      files.map(async (file) => ({
        id: uid(),
        src: await toBase64(file),
        name: file.name.replace(/\.[^.]+$/, ''),
        fileType: fileExtension(file.name),
        cardColor: '#3B5BDB',
      }))
    )
    setEditDocuments(prev => [...prev, ...incoming])
    e.target.value = ''
  }

  const removeNewEditPhoto = (id) => {
    setNewEditPhotos(prev => assignOrientations(prev.filter(p => p.id !== id)))
  }

  const updateEditDoc = (id, patch) => {
    setEditDocuments(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)))
  }

  const removeEditDoc = (id) => {
    setEditDocuments(prev => prev.filter(d => d.id !== id))
  }

  const handlePhotoPositionChange = (photoId, x, y) => {
    const updatedPhotos = (entry.photos || []).map(p =>
      p.id === photoId ? { ...p, x, y } : p
    )
    onUpdate(entry.id, { photos: updatedPhotos })
  }

  const handlePhotoUpdate = (photoId, patch) => {
    const updatedPhotos = (entry.photos || []).map(p =>
      p.id === photoId ? { ...p, ...patch } : p
    )
    onUpdate(entry.id, { photos: updatedPhotos })
  }

  const handlePhotoDelete = (photoId) => {
    const updatedPhotos = (entry.photos || []).filter(p => p.id !== photoId)
    onUpdate(entry.id, { photos: updatedPhotos })
  }

  const handleDocPositionChange = (docId, x, y) => {
    const updatedDocs = (entry.documents || []).map(d =>
      d.id === docId ? { ...d, x, y } : d
    )
    onUpdate(entry.id, { documents: updatedDocs })
  }

  const handleDocUpdate = (docId, patch) => {
    const updatedDocs = (entry.documents || []).map(d =>
      d.id === docId ? { ...d, ...patch } : d
    )
    onUpdate(entry.id, { documents: updatedDocs })
  }

  const handleDocDelete = (docId) => {
    const updatedDocs = (entry.documents || []).filter(d => d.id !== docId)
    onUpdate(entry.id, { documents: updatedDocs })
  }

  const hasContent = entry.reflection || entry.biggestChallenges || entry.keyLearnings || entry.newGoals

  return (
    <article
      className="entry-card"
      style={{
        animationDelay: `${index * 80}ms`,
        ...(isEditing ? { outline: '2px solid #3B5BDB', borderRadius: '4px' } : {}),
      }}
    >
      {/* Entry controls */}
      <div className="entry-meta">
        <div className="entry-controls">
          {isUnlocked && isEditing && (
            <button
              className="entry-action-btn"
              onClick={() => onDelete(entry.id)}
              aria-label="Delete entry"
              style={{ color: '#888888' }}
            >
              <Trash2 size={15} />
            </button>
          )}
        </div>
      </div>

      {isEditing ? (
        <div className="entry-reflection-bg" style={{ marginBottom: 0 }}>
          <span className="entry-week-label" style={{ position: 'absolute', top: '16px', right: '16px', marginBottom: 0 }}>
            {entry.weekLabel} — {formatDate(entry.createdAt)}
          </span>
          {entry.module && (
            <span className="entry-module-label">{entry.module}</span>
          )}
          <textarea
            className="entry-edit-textarea"
            value={editReflection}
            onChange={e => setEditReflection(e.target.value)}
            rows={4}
            autoFocus
            placeholder="Weekly reflection..."
            aria-label="Edit reflection"
          />
          <hr className="entry-section-divider" />
          <p className="form-section-label">Biggest Challenges</p>
          <textarea
            className="entry-edit-textarea"
            style={{ minHeight: '60px' }}
            value={editBiggestChallenges}
            onChange={e => setEditBiggestChallenges(e.target.value)}
            rows={2}
            aria-label="Edit biggest challenges"
          />
          <hr className="entry-section-divider" />
          <p className="form-section-label">Key Learnings</p>
          <textarea
            className="entry-edit-textarea"
            style={{ minHeight: '60px' }}
            value={editKeyLearnings}
            onChange={e => setEditKeyLearnings(e.target.value)}
            rows={2}
            aria-label="Edit key learnings"
          />
          <hr className="entry-section-divider" />
          <p className="form-section-label">New Goals</p>
          <textarea
            className="entry-edit-textarea"
            style={{ minHeight: '60px' }}
            value={editNewGoals}
            onChange={e => setEditNewGoals(e.target.value)}
            rows={2}
            aria-label="Edit new goals"
          />

          <div style={{ display: 'flex', gap: '24px', marginTop: '12px' }}>
            <button
              type="button"
              className="form-text-action"
              onClick={() => photoAddRef.current?.click()}
            >
              add photo
            </button>
            <input
              ref={photoAddRef}
              type="file"
              accept="image/*"
              multiple
              className="visually-hidden"
              onChange={handleAddPhoto}
              aria-label="Add photos"
            />
            <button
              type="button"
              className="form-text-action"
              onClick={() => docAddRef.current?.click()}
            >
              add document
            </button>
            <input
              ref={docAddRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              multiple
              className="visually-hidden"
              onChange={handleAddDoc}
              aria-label="Add documents"
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

          {newEditPhotos.length > 0 && (
            <div className="form-photos-row" style={{ marginTop: '16px' }}>
              {newEditPhotos.map(photo => (
                <div key={photo.id} className="photo-edit-item">
                  <div className="photo-edit-preview">
                    <PhotoCard
                      photo={photo}
                      onCaptionChange={caption => setNewEditPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, caption } : p))}
                    />
                    <button
                      type="button"
                      className="photo-remove-btn"
                      onClick={() => removeNewEditPhoto(photo.id)}
                      aria-label="Remove photo"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <ColorPicker
                    value={photo.cardColor}
                    onChange={color => setNewEditPhotos(prev => prev.map(p => p.id === photo.id ? { ...p, cardColor: color } : p))}
                  />
                </div>
              ))}
            </div>
          )}

          {editDocuments.length > 0 && (
            <div className="form-photos-row" style={{ marginTop: '16px' }}>
              {editDocuments.map(doc => (
                <div key={doc.id} className="photo-edit-item">
                  <div className="photo-edit-preview">
                    <DocumentCard
                      doc={doc}
                      onNameChange={name => updateEditDoc(doc.id, { name })}
                    />
                    <button
                      type="button"
                      className="photo-remove-btn"
                      onClick={() => removeEditDoc(doc.id)}
                      aria-label="Remove document"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <ColorPicker
                    value={doc.cardColor}
                    onChange={color => updateEditDoc(doc.id, { cardColor: color })}
                  />
                </div>
              ))}
            </div>
          )}

          <div className="entry-edit-actions" style={{ gap: '32px' }}>
            <button type="button" className="form-text-action" onClick={handleCancelEdit}>
              cancel entry
            </button>
            <button type="button" className="form-text-action" onClick={handleSave}>
              save changes
            </button>
          </div>
        </div>
      ) : (
        <>
          {hasContent && (
            <div
              className="entry-reflection-bg"
              onDoubleClick={isUnlocked ? handleStartEdit : undefined}
            >
              <span className="entry-week-label" style={{ position: 'absolute', top: '16px', right: '16px', marginBottom: 0 }}>
                {entry.weekLabel} — {formatDate(entry.createdAt)}
              </span>
              {entry.module && (
                <span className="entry-module-label">{entry.module}</span>
              )}
              {entry.reflection && (
                <p className="entry-reflection">{entry.reflection}</p>
              )}
              {entry.biggestChallenges && (
                <>
                  <hr className="entry-section-divider" />
                  <p className="form-section-label">Biggest Challenges</p>
                  <p className="entry-reflection">{entry.biggestChallenges}</p>
                </>
              )}
              {entry.keyLearnings && (
                <>
                  <hr className="entry-section-divider" />
                  <p className="form-section-label">Key Learnings</p>
                  <p className="entry-reflection">{entry.keyLearnings}</p>
                </>
              )}
              {entry.newGoals && (
                <>
                  <hr className="entry-section-divider" />
                  <p className="form-section-label">New Goals</p>
                  <p className="entry-reflection">{entry.newGoals}</p>
                </>
              )}
            </div>
          )}

          {(entry.photos || []).length > 0 && (
            <div className="entry-photos">
              {(entry.photos || []).map(photo => (
                <PhotoCard
                  key={photo.id}
                  photo={photo}
                  module={entry.module}
                  onPositionChange={handlePhotoPositionChange}
                  onCardUpdate={handlePhotoUpdate}
                  onCardDelete={handlePhotoDelete}
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
                  module={entry.module}
                  onPositionChange={handleDocPositionChange}
                  onCardUpdate={handleDocUpdate}
                  onCardDelete={handleDocDelete}
                />
              ))}
            </div>
          )}
        </>
      )}
    </article>
  )
}
