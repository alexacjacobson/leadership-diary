const IS_DEV = window.location.hostname === 'localhost'
const LS_KEY = 'assessment_reflections'
const API = '/api/assessment-reflections'

export async function getReflections() {
  if (IS_DEV) {
    return JSON.parse(localStorage.getItem(LS_KEY) || '{}')
  }
  const res = await fetch(API)
  return res.json()
}

export async function saveReflections(reflections) {
  if (IS_DEV) {
    localStorage.setItem(LS_KEY, JSON.stringify(reflections))
    return reflections
  }
  const res = await fetch(API, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(reflections),
  })
  return res.json()
}
