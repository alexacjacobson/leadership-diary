import { useState, useRef, useEffect } from 'react'
import { Trash2, X, Check } from 'lucide-react'
import PhotoCard from './PhotoCard'
import DocumentCard from './DocumentCard'
import ColorPicker from './ColorPicker'

const MODULES = [
  'Module 1 — Introduction',
  'Module 2 — Self Leadership',
  'Module 3 — Leading from the Whole',
  'Module 4 — Leading from the Side',
  'Module 5 — Leading from the Front',
  'Module 6 — Wrapping Up',
]

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
  const [editModule, setEditModule] = useState(entry.module || MODULES[0])
  const [showModuleDropdown, setShowModuleDropdown] = useState(false)
  const moduleDropdownRef = useRef(null)
  const [editReflection, setEditReflection] = useState(entry.reflection || '')
  const [editBiggestChallenges, setEditBiggestChallenges] = useState(entry.biggestChallenges || '')
  const [editKeyLearnings, setEditKeyLearnings] = useState(entry.keyLearnings || '')
  const [editNewGoals, setEditNewGoals] = useState(entry.newGoals || '')
  const [editPhotos, setEditPhotos] = useState(entry.photos || [])
  const [newEditPhotos, setNewEditPhotos] = useState([])
  const [editDocuments, setEditDocuments] = useState(entry.documents || [])
  const replaceRefs = useRef({})
  const mediaAddRef = useRef(null)

  useEffect(() => {
    if (!isEditing) return
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') handleCancelEdit()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isEditing])

  useEffect(() => {
    if (!showModuleDropdown) return
    const handleOutside = (e) => {
      if (moduleDropdownRef.current && !moduleDropdownRef.current.contains(e.target)) {
        setShowModuleDropdown(false)
      }
    }
    document.addEventListener('mousedown', handleOutside)
    return () => document.removeEventListener('mousedown', handleOutside)
  }, [showModuleDropdown])

  const handleStartEdit = () => {
    setEditModule(entry.module || MODULES[0])
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
      module: editModule,
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
    setEditModule(entry.module || MODULES[0])
    setShowModuleDropdown(false)
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

  const handleAddMedia = async (e) => {
    const files = Array.from(e.target.files)
    if (!files.length) return
    const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp'])
    const newPhotos = []
    const newDocs = []
    for (const file of files) {
      const ext = fileExtension(file.name)
      const src = await toBase64(file)
      if (file.type.startsWith('image/') || IMAGE_EXTS.has(ext)) {
        newPhotos.push({ id: uid(), src, caption: '', cardColor: '#FAF8F2', orientation: 'vertical' })
      } else {
        newDocs.push({ id: uid(), src, name: file.name.replace(/\.[^.]+$/, ''), fileType: ext, cardColor: '#3B5BDB' })
      }
    }
    if (newPhotos.length) setNewEditPhotos(prev => assignOrientations([...prev, ...newPhotos]))
    if (newDocs.length) setEditDocuments(prev => [...prev, ...newDocs])
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
        ...(isEditing ? { outline: '2px solid #3B5BDB', borderRadius: '4px', padding: 0, background: '#FFFFFF' } : {}),
      }}
    >
      {/* Entry controls */}
      <div className="entry-meta" style={isEditing ? { marginBottom: 0 } : undefined}>
        <div className="entry-controls">
        </div>
      </div>

      {isEditing ? (
        <div className="entry-reflection-bg" style={{ marginBottom: 0 }}>
          {isUnlocked && (
            <button
              type="button"
              onClick={() => onDelete(entry.id)}
              aria-label="Delete entry"
              style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', color: '#888888', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
            >
              <Trash2 size={15} />
            </button>
          )}
          <div className="module-pill-wrapper" ref={moduleDropdownRef}>
            <button
              type="button"
              className="module-pill-btn"
              onClick={() => setShowModuleDropdown(v => !v)}
              aria-label="Select module"
            >
              <span className="module-pill-label">{editModule}</span>
            </button>
            {showModuleDropdown && (
              <div className="module-pill-dropdown">
                <div className="module-pill-items">
                  {MODULES.map(m => (
                    <button
                      key={m}
                      type="button"
                      className={`module-pill-item${m === editModule ? ' module-pill-item--active' : ''}`}
                      onClick={() => { setEditModule(m); setShowModuleDropdown(false) }}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
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

          <div style={{ marginTop: '12px' }}>
            <button
              type="button"
              onClick={() => mediaAddRef.current?.click()}
              style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#888888', cursor: 'pointer' }}
            >
              + add media
            </button>
            <input
              ref={mediaAddRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp,image/*,.pdf"
              multiple
              className="visually-hidden"
              onChange={handleAddMedia}
              aria-label="Add media"
            />
          </div>

          {editPhotos.length > 0 && (
            <div className="edit-photo-section">
              {editPhotos.map(photo => (
                <div key={photo.id} className="edit-photo-item">
                  <PhotoCard
                    photo={photo}
                    isEditingParent={true}
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
                      isEditingParent={true}
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
                      isEditingParent={true}
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

          <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px', marginTop: '16px' }}>
            <button
              type="button"
              onClick={handleCancelEdit}
              style={{ background: 'none', border: 'none', padding: 0, fontFamily: 'JetBrains Mono, monospace', fontSize: '13px', color: '#888888', cursor: 'pointer' }}
            >
              cancel edits
            </button>
            <button
              type="button"
              onClick={handleSave}
              aria-label="Save edits"
              style={{ background: 'none', border: 'none', padding: 0, color: '#3B5BDB', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <Check size={18} />
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
                  <p className="form-section-label">Biggest Challenges</p>
                  <p className="entry-reflection">{entry.biggestChallenges}</p>
                </>
              )}
              {entry.keyLearnings && (
                <>
                  <p className="form-section-label">Key Learnings</p>
                  <p className="entry-reflection">{entry.keyLearnings}</p>
                </>
              )}
              {entry.newGoals && (
                <>
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
                  onPositionChange={isUnlocked ? handlePhotoPositionChange : undefined}
                  onCardUpdate={isUnlocked ? handlePhotoUpdate : undefined}
                  onCardDelete={isUnlocked ? handlePhotoDelete : undefined}
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
                  onPositionChange={isUnlocked ? handleDocPositionChange : undefined}
                  onCardUpdate={isUnlocked ? handleDocUpdate : undefined}
                  onCardDelete={isUnlocked ? handleDocDelete : undefined}
                />
              ))}
            </div>
          )}
        </>
      )}
    </article>
  )
}
