# PRD: Leadership Diary — My Design Diary
**Assignment 1 · Leadership Diary App**  
Built with React + Vite · Saved to localStorage · Styled to Alexa Jacobson's personal style guide

---

## 01 · Purpose

A personal, digital leadership diary for tracking growth across a graduate design course. The app must feel like *mine* — not a generic tool — so I actually want to open it each week. It stores reflections, goals, and photo memories in the browser. No backend. No login. Just a clean, beautiful journaling surface that lives locally.

---

## 02 · Core User Stories

1. **First visit** — I see a landing screen that says *"My Design Diary"* with a gentle prompt to start my first entry.
2. **Create entry** — I write a free-text reflection, optionally upload one or more photos with captions, choose a card color from my palette, and post the entry.
3. **View past entries** — I can scroll through all past entries in reverse-chronological order, each rendered in its styled photo card layout.
4. **Persist data** — All entries survive a page refresh (localStorage).

---

## 03 · Tech Stack

| Layer | Choice |
|---|---|
| Framework | React 18 + Vite |
| Styling | CSS Modules or a single global CSS file using CSS custom properties |
| Storage | `window.localStorage` — serialize/deserialize as JSON |
| Icons | Lucide React |
| Fonts | Loaded via Google Fonts: **Libre Baskerville** (display/headlines) + **Plus Jakarta Sans** (body/UI) + **JetBrains Mono** (labels/numbers) |
| Images | Stored as base64 strings inside the localStorage entry object |

No external UI component libraries. No Tailwind. Custom CSS only, following the style guide.

---

## 04 · Design System (from style guide)

### Colors — CSS custom properties
```css
--color-base:    #FAF8F2;   /* Linen — page background */
--color-ink:     #1A1A1A;   /* Ink — body text, headings */
--color-muted:   #888888;   /* Ash — captions, labels, metadata */
--color-primary: #D45FA8;   /* Deep Pink — CTAs, active states */
--color-orange:  #FF6E48;   /* Marigold — energy accent, sparingly */
--color-cobalt:  #3B5BDB;   /* Cobalt — links, tags */
--color-green:   #067A42;   /* Forest — dividers, icons, labels */
--color-petal:   #FFB8E7;   /* Petal — card backgrounds, hover fills */
```

### Typography
- **Headlines / display** → `Libre Baskerville`, 400 regular or italic
- **Body copy / UI text** → `Plus Jakarta Sans`, 400 regular
- **Navigation / labels** → `Plus Jakarta Sans`, 500 medium
- **Section numbers / metadata** → `JetBrains Mono`, 400 regular

### Spacing scale (8px base)
```
--space-2:  8px
--space-4:  16px
--space-6:  24px
--space-8:  32px
--space-12: 48px
--space-16: 64px
--space-24: 96px
```

### Principles
- **No shadows** — elevation through behavior (cards tilt on hover, buttons invert color, tags scale).
- **No decorative borders or dividers** unless doing structural work.
- **Pill-shaped inputs and buttons** — consistent shape language throughout.
- Focused input state: `2px solid var(--color-primary)` border.
- White space is emphasis, not emptiness.

---

## 05 · Photo Card Component

### Source SVGs
The design uses two photo card shapes from the `contents/` folder:
- `horizontal-photo.svg` — 381 × 343px, landscape orientation
- `vertical-photo.svg` — 244 × 358px, portrait orientation

### Card anatomy (reverse-engineered from SVGs)
Each card is a rounded rectangle (`border-radius: 4px`) with:
- A solid **background color fill** (the outer card body — user-selectable)
- A white **inner image well** inset ~18–22px from all edges, also `border-radius: 4px`
- A **caption area** below the image well (inside the card body)

### Color picker for cards
When creating an entry or uploading a photo, the user picks the card background color from a swatch row of the 6 palette colors:
`--color-petal` · `--color-primary` · `--color-orange` · `--color-cobalt` · `--color-green` · `--color-ink`

The active swatch gets a subtle scale-up (no border/shadow — shape does the work).

### Card orientation
- Single photo upload → show as **vertical** card (portrait)
- Multiple photos → show as a **horizontal** card for the first, then remaining as vertical cards in a row

---

## 06 · Screens & Layout

### 6.1 Landing / Empty State
Shown only on first visit (no entries in localStorage).

```
[Full-page, centered]

  "My Design Diary"           ← Libre Baskerville, large, Ink
  "Where leadership takes shape."  ← Plus Jakarta Sans, italic, Ash

  [Start your first entry →]  ← pill button, Deep Pink
```

### 6.2 Diary Home (entries exist)
```
[Top]
  Section label:  "01 — Leadership Diary"   ← JetBrains Mono, Ash
  Page headline:  "My Design Diary"         ← Libre Baskerville, Ink

[Right / floating]
  [+ New Entry]   ← pill button, Deep Pink

[Main area — entry feed, reverse chronological]
  EntryCard × N
```

### 6.3 Entry Card (read view)
```
┌──────────────────────────────────────────┐
│  Week 01 — June 3, 2026     [JetBrains Mono, Ash]
│
│  [reflection text body]     [Plus Jakarta Sans, Ink]
│
│  [PhotoCard] [PhotoCard] …  (if photos attached)
│
└──────────────────────────────────────────┘
```
Cards are stacked vertically in the feed with `--space-12` (48px) between them. No card border — the linen background and whitespace separate entries.

### 6.4 New Entry Form (modal or dedicated page — Claude Code's call)
```
Section label: "New Entry"    [JetBrains Mono, Ash]

[ Reflection                                    ]  ← textarea, pill-ish, multiline
[                                               ]
[                                               ]

[ + Add photo ]   ← secondary pill button, outline style

  → On photo add: show photo preview in card shape with color picker swatches below
  → Allow multiple photos (each with its own color picker + caption field)

[ Post entry → ]  ← primary pill button, Deep Pink, full-width or right-aligned
```

---

## 07 · Data Model (localStorage)

**Key:** `"leadership_diary_entries"`  
**Value:** JSON array of Entry objects, newest last (display reversed).

```ts
type Entry = {
  id: string;           // uuid or Date.now().toString()
  createdAt: string;    // ISO date string
  weekLabel: string;    // auto-generated e.g. "Week 01"
  reflection: string;   // free text
  photos: Photo[];      // 0 or more
};

type Photo = {
  id: string;
  src: string;          // base64 data URL
  caption: string;      // optional
  cardColor: string;    // one of the CSS custom property values e.g. "#FFB8E7"
  orientation: "horizontal" | "vertical";  // user can toggle or auto-detect
};
```

**Helper functions to scaffold:**
- `getEntries(): Entry[]`
- `saveEntry(entry: Entry): void`
- `deleteEntry(id: string): void` *(optional stretch)*

---

## 08 · Interactions & Micro-animations

| Element | Behavior |
|---|---|
| Photo cards | Tilt 1–2° on hover (CSS `transform: rotate()`) — no shadow |
| Primary button | Color invert on hover: background → Ink, text → Linen |
| Tag/swatch | Scale up `1.1` on selected state |
| Entry feed | Staggered fade-in on load (CSS `animation-delay` per card) |
| New Entry form | Slide in from right or fade up — keep it light |

---

## 09 · Accessibility & Polish

- All inputs have visible labels (visually or `aria-label`)
- Color picker swatches have `aria-label="[color name]"` 
- Image uploads use `<input type="file" accept="image/*">` — convert to base64 on change
- Textarea grows with content (CSS `resize: vertical` or auto-grow with JS)
- Empty state for "no entries" is warm and inviting, not a blank screen

---

## 10 · File Structure

```
/diary/
├── index.html
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── App.css               ← global CSS vars + resets
│   ├── components/
│   │   ├── EntryCard.jsx     ← read view for one entry
│   │   ├── PhotoCard.jsx     ← the photo card shape component
│   │   ├── NewEntryForm.jsx  ← form to create entry
│   │   ├── ColorPicker.jsx   ← swatch row component
│   │   └── EmptyState.jsx    ← landing / first visit screen
│   ├── hooks/
│   │   └── useEntries.js     ← localStorage read/write logic
│   └── assets/
│       ├── horizontal-photo.svg
│       └── vertical-photo.svg
├── package.json
└── vite.config.js
```

---

## 11 · Out of Scope (for now)

- Authentication / multi-user
- Cloud sync or backend
- Editing a posted entry (stretch goal — can add a pencil icon later)
- Export to PDF
- SCARF / VIA / Superpowers structured fields (keep entry format free-text as decided)

---

## 12 · Prompt for Claude Code

Use the following as your opening prompt in VS Code:

---

> **You are helping me build a personal Leadership Diary web app. It is called "My Design Diary."**
> 
> **Stack:** React 18 + Vite. All data saved to `localStorage`. No backend, no auth, no external UI libraries. Icons from `lucide-react`. Fonts from Google Fonts.
> 
> **Style guide:** Follow this exactly — https://style-guide.alexa-c-jacobson.workers.dev/
> - Colors: Linen `#FAF8F2` bg · Ink `#1A1A1A` text · Deep Pink `#D45FA8` primary · Petal `#FFB8E7` tint · Marigold `#FF6E48` · Cobalt `#3B5BDB` · Forest `#067A42`
> - Fonts: Libre Baskerville (headlines) · Plus Jakarta Sans (body/UI) · JetBrains Mono (labels/numbers) — all via Google Fonts
> - No shadows anywhere. Cards tilt on hover. Buttons invert color on hover. Pill-shaped inputs and buttons throughout.
> - Generous whitespace. Big headlines. No decorative borders.
> 
> **Features:**
> 1. Empty state landing screen: headline "My Design Diary", subline "Where leadership takes shape.", pill CTA button to start first entry.
> 2. Home view (entries exist): section label `01 — Leadership Diary` in JetBrains Mono, page headline, `+ New Entry` pill button, reverse-chronological entry feed with staggered fade-in.
> 3. New entry form: multiline free-text reflection textarea, `+ Add photo` button (opens file picker, converts to base64), multiple photos allowed, each photo gets a color swatch picker (6 palette colors), a caption field, and renders inside a styled photo card shape (rounded rect with white inner well). Post button saves to localStorage.
> 4. Entry card (read view): week label + date in JetBrains Mono, reflection text, photo cards displayed inline.
> 5. Photo card component: two orientations (horizontal 381×343, vertical 244×358). Solid colored outer card (`border-radius: 4px`), white inner image well inset ~20px, caption below. Color is set per-photo. Tilts 1–2° on hover.
> 
> **Data model in localStorage** (`"leadership_diary_entries"`):
> ```ts
> type Entry = { id: string; createdAt: string; weekLabel: string; reflection: string; photos: Photo[] }
> type Photo = { id: string; src: string; caption: string; cardColor: string; orientation: "horizontal"|"vertical" }
> ```
> 
> **File structure:**
> ```
> /diary/src/
>   App.jsx · App.css
>   components/EntryCard.jsx · PhotoCard.jsx · NewEntryForm.jsx · ColorPicker.jsx · EmptyState.jsx
>   hooks/useEntries.js
>   assets/horizontal-photo.svg · vertical-photo.svg
> ```
> 
> Build it completely. Make it beautiful. It should feel personal, not generic.

---

*PRD authored for Assignment 1 — Leadership Diary · Alexa Jacobson · June 2026*
