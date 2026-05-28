# PullStack Build Checklist

Living roadmap. Tick off as we ship.

---

## Phase 1 — Foundation ✅

- [x] NW.js desktop app shell
- [x] Window config (1400×900, dark theme)
- [x] 3-column workspace layout (sidebar / canvas / properties)
- [x] New Project modal with CSS + code framework pickers
- [x] Plugin folder system (`frameworks/*/` and `exporters/*/`)
- [x] Save / Open `.pullstack.json`
- [x] Auto-save to localStorage
- [x] Photoshop-style menubar (File / Edit / View / Tools / Help)
- [x] Keyboard shortcuts (Ctrl+N/O/S/E/Z/Y/C/V/D, Del, F5, F12, Esc)

---

## Phase 2 — Core Builder ✅

- [x] 14-tile element palette (heading, text, button, link, image, container, divider, modal, form, input, textarea, checkbox, radio, select)
- [x] Drag from palette → drop on canvas (iframe-isolated)
- [x] Click to select, Delete to remove
- [x] Properties panel per element type
- [x] Color picker (background/text)
- [x] Framework variant chips (Bootstrap / Tailwind / Bulma / DaisyUI for button, plus Tailwind headings + containers + gradients)

---

## Phase 3 — Interactivity ✅

- [x] Element nesting (drop into containers)
- [x] Element reorder via drag
- [x] Ancestor-cycle guard
- [x] **3a. Button on-click actions** (Go to URL / Scroll to section / Open modal / Close modal / Toggle visibility)
- [x] **3b. Modal element** (title, modalId, dismissable, drop-zone for children)
- [x] **3c. Form + form inputs** (Form, Textarea, Checkbox, Radio, Select)

---

## Phase 4 — Export System ✅

- [x] 7 code exporters (HTML / Blade / Inertia+Vue / CodeIgniter / WordPress / Vue / React)
- [x] Framework class injection per element + inline color overrides
- [x] Framework CDN auto-injected into exported `<head>`
- [x] Modal/toggle helper JS auto-injected when used
- [x] Cloud registry update system (`Tools → Update frameworks`)
- [x] **4a. Export as ZIP** (multi-page, per-exporter outputFolder, generated README.md)

---

## Phase 5 — Polish ✅

- [x] Undo / Redo (50-deep history)
- [x] Preview mode (hide chrome, fullscreen canvas, Esc to exit)
- [x] Toggle sidebar / Toggle properties
- [x] Auto-save to localStorage
- [x] Status modal with progress bar
- [x] About modal · Keyboard shortcuts modal
- [x] Open docs in external browser
- [x] Disabled button styling
- [x] **5a. Layers tree view** (indented, type icons, click-to-select, drag-to-move, collapse, hide button)
- [x] **5b. Copy / Paste / Duplicate** (Ctrl+C/V/D + Edit menu, cross-project clipboard)
- [x] **5c. Multiple pages per project** (Pages section in sidebar, add/rename/delete, active page highlight)
- [x] **5d. Code view toggle** (live HTML output panel in canvas toolbar)

---

## Bonus shipped 🎁

- [x] Cloud framework update system
- [x] Gradient variants (Tailwind / DaisyUI buttons, Tailwind headings)
- [x] Iframe-isolated canvas
- [x] CSP-safe, no external script dependencies
- [x] PullStack repo public on GitHub: github.com/PullFool/PullStack

---

## Feature-complete v1 ✅

All originally-scoped phases shipped. Possible v2 directions:

- [ ] Element variants for heading / text / link across all frameworks (currently button-heavy)
- [ ] Additional CSS frameworks (Materialize, Foundation, UnoCSS, HeroUI, Mantine, Chakra)
- [ ] Additional exporters (Next.js, Nuxt, Svelte, Astro, Django, Flask, Rails)
- [ ] Asset library (manage uploaded images in-project)
- [ ] Template gallery (starter pages: landing, portfolio, blog, dashboard)
- [ ] Component library (saved reusable blocks across projects)
- [ ] Conditional rendering / state variables (becomes Bubble.io tier — careful)
- [ ] Direct deploy to Netlify / Vercel / GitHub Pages
- [ ] Real-time multi-user collaboration

---

_Last updated: 2026-05-28_
