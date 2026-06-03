import { useState, useRef } from 'react'
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

export default function NewEntryForm({ entryCount, onSave }) {
  const [module, setModule] = useState(MODULES[0])
  const [reflection, setReflection] = useState('')
  const [photos, setPhotos] = useState([])
  const [documents, setDocuments] = useState([])
  const photoFileRef = useRef(null)
  const docFileRef = useRef(null)

  const canPost = reflection.trim().length > 0 || photos.length > 0 || documents.length > 0

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
      photos,
      documents,
    })
    setModule(MODULES[0])
    setReflection('')
    setPhotos([])
    setDocuments([])
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) handlePost()
  }

  return (
    <section className="form-section">
      <h1 className="form-title">My Leadership Diary</h1>

      <div className="form-white-box">
        <select
          className="module-select"
          value={module}
          onChange={e => setModule(e.target.value)}
          aria-label="Select module"
        >
          {MODULES.map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>

        <textarea
          className="reflection-textarea"
          placeholder="What shaped you this week?"
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Weekly reflection"
        />

        {photos.length > 0 && (
          <div className="form-photos-row">
            {photos.map(photo => (
              <div key={photo.id} className="photo-edit-item">
                <div className="photo-edit-preview">
                  <PhotoCard
                    photo={photo}
                    onCaptionChange={caption => updatePhoto(photo.id, { caption })}
                    onPositionChange={(id, x, y) => updatePhoto(id, { x, y })}
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
                    onPositionChange={(id, x, y) => updateDoc(id, { x, y })}
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
          onClick={handlePost}
          disabled={!canPost}
        >
          save entry
        </button>
      </div>
    </section>
  )
}
