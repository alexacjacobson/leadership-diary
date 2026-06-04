import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { X } from 'lucide-react'
import ColorPicker from './ColorPicker'
import PhotoCard from './PhotoCard'
import DocumentCard from './DocumentCard'

const MODULES = [
  'Module 1 — Introduction',
  'Module 2 — Self Leadership',
  'Module 3 — Leading from the Whole',
  'Module 4 — Leading from the Side',
  'Module 5 — Leading from the Front',
  'Module 6 — Wrapping Up',
]

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function weekLabel(count) {
  return `Week ${String(count + 1).padStart(2, '0')}`
}

function toBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

function assignOrientations(photos) {
  return photos.map((p, i) => ({
    ...p,
    orientation: i === 0 ? 'horizontal' : 'vertical',
  }))
}

function fileExtension(filename) {
  return filename.split('.').pop().toLowerCase()
}

const NewEntryForm = forwardRef(function NewEntryForm({ entryCount, onSave, onCancel }, ref) {
  const [module, setModule] = useState(MODULES[0])
  const [showModuleDropdown, setShowModuleDropdown] = useState(false)
  const moduleDropdownRef = useRef(null)
  const [reflection, setReflection] = useState('')
  const [biggestChallenges, setBiggestChallenges] = useState('')
  const [keyLearnings, setKeyLearnings] = useState('')
  const [newGoals, setNewGoals] = useState('')
  const [photos, setPhotos] = useState([])
  const [documents, setDocuments] = useState([])
  const photoFileRef = useRef(null)
  const docFileRef = useRef(null)

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

  const canPost =
    reflection.trim().length > 0 ||
    biggestChallenges.trim().length > 0 ||
    keyLearnings.trim().length > 0 ||
    newGoals.trim().length > 0 ||
    photos.length > 0 ||
    documents.length > 0

  const handlePhotoFiles = async (e) => {
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
    setPhotos(prev => assignOrientations([...prev, ...incoming]))
    e.target.value = ''
  }

  const handleDocFiles = async (e) => {
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
    setDocuments(prev => [...prev, ...incoming])
    e.target.value = ''
  }

  const updatePhoto = (id, patch) => {
    setPhotos(prev => prev.map(p => (p.id === id ? { ...p, ...patch } : p)))
  }

  const removePhoto = (id) => {
    setPhotos(prev => assignOrientations(prev.filter(p => p.id !== id)))
  }

  const updateDoc = (id, patch) => {
    setDocuments(prev => prev.map(d => (d.id === id ? { ...d, ...patch } : d)))
  }

  const removeDoc = (id) => {
    setDocuments(prev => prev.filter(d => d.id !== id))
  }

  const handlePost = () => {
    if (!canPost) return
    onSave({
      id: uid(),
      createdAt: new Date().toISOString(),
      weekLabel: weekLabel(entryCount),
      module,
      reflection: reflection.trim(),
      biggestChallenges: biggestChallenges.trim(),
      keyLearnings: keyLearnings.trim(),
      newGoals: newGoals.trim(),
      photos,
      documents,
    })
    setModule(MODULES[0])
    setReflection('')
    setBiggestChallenges('')
    setKeyLearnings('')
    setNewGoals('')
    setPhotos([])
    setDocuments([])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
  }

  useImperativeHandle(ref, () => ({
    save: () => { if (canPost) handlePost() },
  }))

  return (
    <section className="form-section">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="form-white-box">
        <div className="module-pill-wrapper" ref={moduleDropdownRef}>
          <button
            type="button"
            className="module-pill-btn"
            onClick={() => setShowModuleDropdown(v => !v)}
            aria-label="Select module"
          >
            <span className="module-pill-label">{module}</span>
          </button>
          {showModuleDropdown && (
            <div className="module-pill-dropdown">
              <div className="module-pill-items">
                {MODULES.map(m => (
                  <button
                    key={m}
                    type="button"
                    className={`module-pill-item${m === module ? ' module-pill-item--active' : ''}`}
                    onClick={() => { setModule(m); setShowModuleDropdown(false) }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <textarea
          className="reflection-textarea"
          placeholder="What have you learned this week?"
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Weekly reflection"
        />

        <div className="form-section-group">
          <p className="form-section-label">Biggest Challenges</p>
          <textarea
            className="reflection-textarea reflection-textarea--sm"
            value={biggestChallenges}
            onChange={e => setBiggestChallenges(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Biggest challenges"
          />
        </div>

        <div className="form-section-group">
          <p className="form-section-label">Key Learnings</p>
          <textarea
            className="reflection-textarea reflection-textarea--sm"
            value={keyLearnings}
            onChange={e => setKeyLearnings(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="Key learnings"
          />
        </div>

        <div className="form-section-group">
          <p className="form-section-label">New Goals</p>
          <textarea
            className="reflection-textarea reflection-textarea--sm"
            value={newGoals}
            onChange={e => setNewGoals(e.target.value)}
            onKeyDown={handleKeyDown}
            aria-label="New goals"
          />
        </div>

        {photos.length > 0 && (
          <div className="form-photos-row">
            {photos.map(photo => (
              <div key={photo.id} className="photo-edit-item">
                <div className="photo-edit-preview">
                  <PhotoCard
                    photo={photo}
                    onCaptionChange={caption => updatePhoto(photo.id, { caption })}
                  />
                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={() => removePhoto(photo.id)}
                    aria-label="Remove photo"
                  >
                    <X size={14} />
                  </button>
                </div>
                <ColorPicker
                  value={photo.cardColor}
                  onChange={color => updatePhoto(photo.id, { cardColor: color })}
                />
              </div>
            ))}
          </div>
        )}

        {documents.length > 0 && (
          <div className="form-photos-row">
            {documents.map(doc => (
              <div key={doc.id} className="photo-edit-item">
                <div className="photo-edit-preview">
                  <DocumentCard
                    doc={doc}
                    onNameChange={name => updateDoc(doc.id, { name })}
                  />
                  <button
                    type="button"
                    className="photo-remove-btn"
                    onClick={() => removeDoc(doc.id)}
                    aria-label="Remove document"
                  >
                    <X size={14} />
                  </button>
                </div>
                <ColorPicker
                  value={doc.cardColor}
                  onChange={color => updateDoc(doc.id, { cardColor: color })}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="form-text-action"
          onClick={() => photoFileRef.current?.click()}
        >
          add photo
        </button>
        <input
          ref={photoFileRef}
          type="file"
          accept="image/*"
          multiple
          className="visually-hidden"
          onChange={handlePhotoFiles}
          aria-label="Upload photos"
        />
        <button
          type="button"
          className="form-text-action"
          onClick={() => docFileRef.current?.click()}
        >
          add document
        </button>
        <input
          ref={docFileRef}
          type="file"
          accept=".pdf,.doc,.docx,.ppt,.pptx"
          multiple
          className="visually-hidden"
          onChange={handleDocFiles}
          aria-label="Upload documents"
        />
        <button
          type="button"
          className="form-text-action"
          onClick={onCancel}
        >
          cancel entry
        </button>
      </div>
    </section>
  )
})

export default NewEntryForm
