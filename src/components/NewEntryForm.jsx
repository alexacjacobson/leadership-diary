import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react'
import { X } from 'lucide-react'
import ColorPicker from './ColorPicker'
import PhotoCard from './PhotoCard'
import DocumentCard from './DocumentCard'
import LinkCard from './LinkCard'

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
  const [title, setTitle] = useState('')
  const [reflection, setReflection] = useState('')
  const [biggestChallenges, setBiggestChallenges] = useState('')
  const [keyLearnings, setKeyLearnings] = useState('')
  const [newGoals, setNewGoals] = useState('')
  const [keywords, setKeywords] = useState([])
  const [keywordInput, setKeywordInput] = useState('')
  const [photos, setPhotos] = useState([])
  const [documents, setDocuments] = useState([])
  const [links, setLinks] = useState([])
  const [hiddenSections, setHiddenSections] = useState({ biggestChallenges: false, keyLearnings: false, newGoals: false })
  const [customSections, setCustomSections] = useState([])
  const mediaFileRef = useRef(null)

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

  const toggleDefaultSection = (key) =>
    setHiddenSections(prev => ({ ...prev, [key]: !prev[key] }))

  const addCustomSection = () =>
    setCustomSections(prev => [...prev, { id: uid(), label: '', content: '', hidden: false }])

  const updateCustomSection = (id, patch) =>
    setCustomSections(prev => prev.map(s => s.id === id ? { ...s, ...patch } : s))

  const canPost = true

  const handleMediaFiles = async (e) => {
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
    if (newPhotos.length) setPhotos(prev => assignOrientations([...prev, ...newPhotos]))
    if (newDocs.length) setDocuments(prev => [...prev, ...newDocs])
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

  const handleAddLink = () => {
    setLinks(prev => [...prev, { id: uid(), src: '', url: '', caption: '', cardColor: '#FAF8F2' }])
  }

  const updateLink = (id, patch) => {
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ...patch } : l))
  }

  const removeLink = (id) => {
    setLinks(prev => prev.filter(l => l.id !== id))
  }

  const handlePost = () => {
    if (!canPost) return
    onSave({
      id: uid(),
      createdAt: new Date().toISOString(),
      weekLabel: weekLabel(entryCount),
      module,
      title: title.trim(),
      reflection: reflection.trim(),
      biggestChallenges: biggestChallenges.trim(),
      keyLearnings: keyLearnings.trim(),
      newGoals: newGoals.trim(),
      keywords,
      photos,
      documents,
      links,
      hiddenSections,
      customSections,
    })
    setModule(MODULES[0])
    setTitle('')
    setReflection('')
    setBiggestChallenges('')
    setKeyLearnings('')
    setNewGoals('')
    setKeywords([])
    setKeywordInput('')
    setPhotos([])
    setDocuments([])
    setLinks([])
    setHiddenSections({ biggestChallenges: false, keyLearnings: false, newGoals: false })
    setCustomSections([])
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

        <input
          type="text"
          className="entry-title-input"
          placeholder="entry title..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Entry title"
        />

        <textarea
          className="reflection-textarea"
          placeholder="What have you learned this week?"
          value={reflection}
          onChange={e => setReflection(e.target.value)}
          onKeyDown={handleKeyDown}
          aria-label="Weekly reflection"
        />

        <div className="form-section-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <p className="form-section-label" style={{ margin: 0 }}>Biggest Challenges</p>
            <button type="button" style={{ background: 'none', border: 'none', padding: 0, color: '#FFB8E7', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', cursor: 'pointer', lineHeight: 1 }} onClick={() => toggleDefaultSection('biggestChallenges')}>
              {hiddenSections.biggestChallenges ? '(show)' : '(hide)'}
            </button>
          </div>
          {!hiddenSections.biggestChallenges && (
            <textarea
              className="reflection-textarea reflection-textarea--sm"
              value={biggestChallenges}
              onChange={e => setBiggestChallenges(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Biggest challenges"
            />
          )}
        </div>

        <div className="form-section-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <p className="form-section-label" style={{ margin: 0 }}>Key Learnings</p>
            <button type="button" style={{ background: 'none', border: 'none', padding: 0, color: '#FFB8E7', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', cursor: 'pointer', lineHeight: 1 }} onClick={() => toggleDefaultSection('keyLearnings')}>
              {hiddenSections.keyLearnings ? '(show)' : '(hide)'}
            </button>
          </div>
          {!hiddenSections.keyLearnings && (
            <textarea
              className="reflection-textarea reflection-textarea--sm"
              value={keyLearnings}
              onChange={e => setKeyLearnings(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="Key learnings"
            />
          )}
        </div>

        <div className="form-section-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <p className="form-section-label" style={{ margin: 0 }}>New Goals</p>
            <button type="button" style={{ background: 'none', border: 'none', padding: 0, color: '#FFB8E7', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', cursor: 'pointer', lineHeight: 1 }} onClick={() => toggleDefaultSection('newGoals')}>
              {hiddenSections.newGoals ? '(show)' : '(hide)'}
            </button>
          </div>
          {!hiddenSections.newGoals && (
            <textarea
              className="reflection-textarea reflection-textarea--sm"
              value={newGoals}
              onChange={e => setNewGoals(e.target.value)}
              onKeyDown={handleKeyDown}
              aria-label="New goals"
            />
          )}
        </div>

        {customSections.map(section => (
          <div key={section.id} className="form-section-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <input
                type="text"
                value={section.label}
                onChange={e => updateCustomSection(section.id, { label: e.target.value })}
                placeholder="SECTION LABEL"
                style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--color-cobalt)', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', color: 'var(--color-cobalt)', letterSpacing: '0.08em', textTransform: 'uppercase', outline: 'none', width: '180px', padding: '0 0 1px 0' }}
                aria-label="Custom section label"
              />
              <button type="button" style={{ background: 'none', border: 'none', padding: 0, color: '#FFB8E7', fontFamily: 'JetBrains Mono, monospace', fontSize: '11px', cursor: 'pointer', lineHeight: 1 }} onClick={() => updateCustomSection(section.id, { hidden: !section.hidden })}>
                {section.hidden ? '(show)' : '(hide)'}
              </button>
            </div>
            {!section.hidden && (
              <textarea
                className="reflection-textarea reflection-textarea--sm"
                value={section.content}
                onChange={e => updateCustomSection(section.id, { content: e.target.value })}
                onKeyDown={handleKeyDown}
                aria-label="Custom section content"
              />
            )}
          </div>
        ))}

        <div style={{ marginTop: '4px' }}>
          <button type="button" style={{ background: 'none', border: 'none', padding: 0, color: '#D45FA8', fontFamily: 'JetBrains Mono, monospace', fontSize: '18px', cursor: 'pointer', lineHeight: 1 }} onClick={addCustomSection} aria-label="Add custom section">
            +
          </button>
        </div>

        <div className="form-section-group">
          <p className="form-section-label">Keywords</p>
          {keywords.length > 0 && (
            <div className="keywords-row">
              {keywords.map((kw, i) => (
                <span key={i} className="keyword-pill">
                  {kw}
                  <button
                    type="button"
                    className="keyword-pill__remove"
                    onClick={() => setKeywords(prev => prev.filter((_, j) => j !== i))}
                    aria-label={`Remove ${kw}`}
                  >
                    <X size={10} />
                  </button>
                </span>
              ))}
            </div>
          )}
          <input
            className="keyword-input"
            type="text"
            placeholder="add a keyword..."
            value={keywordInput}
            onChange={e => setKeywordInput(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault()
                const trimmed = keywordInput.trim()
                if (trimmed) {
                  setKeywords(prev => [...prev, trimmed])
                  setKeywordInput('')
                }
              }
            }}
            aria-label="Add keyword"
          />
        </div>

        {/* add media / add link — always above cards */}
        <div className="form-add-row">
          <button
            type="button"
            className="form-text-action"
            onClick={() => mediaFileRef.current?.click()}
          >
            add media
          </button>
          <input
            ref={mediaFileRef}
            type="file"
            accept=".jpg,.jpeg,.png,.gif,.webp,image/*,.pdf"
            multiple
            className="visually-hidden"
            onChange={handleMediaFiles}
            aria-label="Upload media"
          />
          <button
            type="button"
            className="form-text-action"
            onClick={handleAddLink}
          >
            add link
          </button>
        </div>

        {photos.length > 0 && (
          <div className="form-photos-row">
            {photos.map(photo => (
              <div key={photo.id} className="photo-edit-item">
                <PhotoCard
                  photo={photo}
                  onCaptionChange={caption => updatePhoto(photo.id, { caption })}
                  onColorChange={color => updatePhoto(photo.id, { cardColor: color })}
                  onCardDelete={removePhoto}
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

        {links.length > 0 && (
          <div className="form-photos-row">
            {links.map(link => (
              <LinkCard
                key={link.id}
                link={link}
                onUpdate={patch => updateLink(link.id, patch)}
                onDelete={() => removeLink(link.id)}
              />
            ))}
          </div>
        )}
      </div>
      </div>

      <div className="form-actions">
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
