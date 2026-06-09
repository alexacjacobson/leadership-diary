const IS_DEV = window.location.hostname === 'localhost'
const API = '/api/stickers'

export async function getStickers() {
  if (IS_DEV) {
    return JSON.parse(localStorage.getItem('leadership_diary_stickers') || '[]')
  }
  const res = await fetch(API)
  return res.json()
}

export async function saveStickers(stickers) {
  if (IS_DEV) {
    localStorage.setItem('leadership_diary_stickers', JSON.stringify(stickers))
    return
  }
  await fetch(API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(stickers),
  })
}
