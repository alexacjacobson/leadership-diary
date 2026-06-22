const IS_DEV = window.location.hostname === 'localhost';
const API = '/api/entries';
const PHOTOS_API = '/api/photos';

// Strip base64 src before storing in the entry object
function stripSrc(photo) {
  const { src, ...meta } = photo;
  return meta;
}

export async function getEntries() {
  if (IS_DEV) {
    return JSON.parse(localStorage.getItem('leadership_diary_entries') || '[]');
  }
  const res = await fetch(API);
  const entries = await res.json();

  // For each entry, merge photo src data back in from separate KV storage.
  // If photos still carry src (legacy format, not yet migrated), use them as-is.
  return Promise.all(entries.map(async entry => {
    if (!entry.photos?.length) return entry;
    if (entry.photos.some(p => p.src)) return entry; // legacy: src already embedded

    const photosRes = await fetch(`${PHOTOS_API}/${entry.id}`);
    const storedPhotos = await photosRes.json();
    const byId = new Map(storedPhotos.map(p => [p.id, p]));
    return {
      ...entry,
      photos: entry.photos.map(meta => ({ ...meta, src: byId.get(meta.id)?.src ?? '' })),
    };
  }));
}

export async function saveEntry(entry) {
  if (IS_DEV) {
    const entries = JSON.parse(localStorage.getItem('leadership_diary_entries') || '[]');
    entries.push(entry);
    localStorage.setItem('leadership_diary_entries', JSON.stringify(entries));
    return entry;
  }

  // Save each photo separately in KV
  await Promise.all((entry.photos || []).filter(p => p.src).map(photo =>
    fetch(`${PHOTOS_API}/${entry.id}/${photo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    })
  ));

  // Save entry with photo metadata only (no src)
  const entryMeta = { ...entry, photos: (entry.photos || []).map(stripSrc) };
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entryMeta),
  });
  return res.json();
}

export async function updateEntry(entry) {
  if (IS_DEV) {
    const entries = JSON.parse(localStorage.getItem('leadership_diary_entries') || '[]');
    const index = entries.findIndex(e => e.id === entry.id);
    if (index !== -1) entries[index] = entry;
    localStorage.setItem('leadership_diary_entries', JSON.stringify(entries));
    return entry;
  }

  console.log('[updateEntry] PUT', `${API}/${entry.id}`, entry);

  // Delete all previously stored photos for this entry, then re-save the current set.
  // This ensures removed photos are cleaned up from KV.
  const existingRes = await fetch(`${PHOTOS_API}/${entry.id}`);
  const existingPhotos = await existingRes.json();
  await Promise.all(existingPhotos.map(p =>
    fetch(`${PHOTOS_API}/${entry.id}/${p.id}`, { method: 'DELETE' })
  ));

  await Promise.all((entry.photos || []).filter(p => p.src).map(photo =>
    fetch(`${PHOTOS_API}/${entry.id}/${photo.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(photo),
    })
  ));

  // Update entry with photo metadata only (no src)
  const entryMeta = { ...entry, photos: (entry.photos || []).map(stripSrc) };
  const res = await fetch(`${API}/${entry.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entryMeta),
  });
  const data = await res.json();
  console.log('[updateEntry] response status:', res.status, data);
  return data;
}

export async function deleteEntry(id) {
  if (IS_DEV) {
    const entries = JSON.parse(localStorage.getItem('leadership_diary_entries') || '[]');
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem('leadership_diary_entries', JSON.stringify(filtered));
    return;
  }
  // Worker DELETE /api/entries/:id also cleans up all photos for the entry
  await fetch(`${API}/${id}`, { method: 'DELETE' });
}
