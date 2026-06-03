const IS_DEV = window.location.hostname === 'localhost';
const API = '/api/entries';

export async function getEntries() {
  if (IS_DEV) {
    return JSON.parse(localStorage.getItem('leadership_diary_entries') || '[]');
  }
  const res = await fetch(API);
  return res.json();
}

export async function saveEntry(entry) {
  if (IS_DEV) {
    const entries = JSON.parse(localStorage.getItem('leadership_diary_entries') || '[]');
    entries.push(entry);
    localStorage.setItem('leadership_diary_entries', JSON.stringify(entries));
    return entry;
  }
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
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
  const res = await fetch(`${API}/${entry.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(entry)
  });
  return res.json();
}

export async function deleteEntry(id) {
  if (IS_DEV) {
    const entries = JSON.parse(localStorage.getItem('leadership_diary_entries') || '[]');
    const filtered = entries.filter(e => e.id !== id);
    localStorage.setItem('leadership_diary_entries', JSON.stringify(filtered));
    return;
  }
  await fetch(`${API}/${id}`, { method: 'DELETE' });
}
