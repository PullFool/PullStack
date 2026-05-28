# PullStack Build Checklist

Living roadmap. Tick off as we ship.

---

## Phase 1 — Foundation ✅

- [x] NW.js desktop app shell (`package.json` + `nw.exe`)
- [x] Window config (1400×900, min 1024×700, dark theme)
- [x] 3-column workspace layout (sidebar / canvas / properties)
- [x] New Project modal with CSS + code framework pickers
- [x] Plugin folder system (`frameworks/*/` and `exporters/*/`)
- [x] Save project to local `.pullstack.json` file
- [x] Open `.pullstack.json` from disk
- [x] Auto-save to `localStorage` (survives Reload window)
- [x] Photoshop-style menubar
  - [x] File · Edit · View · Tools · Help
  - [x] Dropdowns with shortcuts
  - [x] Mouse-hover switching between menus
- [x] Keyboard shortcuts
  - [x] Ctrl+N (New) / Ctrl+O (Open) / Ctrl+S (Save) / Ctrl+E (Export)
  - [x] Ctrl+Z / Ctrl+Y (Undo/Redo)
  - [x] Del (Delete selected) / F5 (Preview) / F12 (DevTools) / Ctrl+R (Reload window)
  - [x] Esc (Exit preview / close modals)

---

## Phase 2 — Core Builder ✅

- [x] Sidebar element palette with 8 base types
  - [x] Heading · Text · Button · Link · Image · Container · Divider · Input
- [x] Drag from palette → drop on canvas
- [x] Canvas rendered inside an isolated iframe (frameworks don't leak)
- [x] Iframe loads the project's chosen CSS framework (CDN)
- [x] Click to select; outline appears around selected element
- [x] Delete with Del key or Properties button
- [x] Properties panel auto-shows for selected element
  - [x] Text / Level (heading) / URL (link) / src + alt (image) / Placeholder (input)
- [x] Color picker (background or text, depending on element type)
- [x] Framework variant presets as colored chips
  - [x] Bootstrap (Primary / Success / Danger / Warning / Info / Light / Dark)
  - [x] Tailwind (8 solid + 6 gradients: Sunset, Ocean, Aurora, Forest, Fire, Twilight)
  - [x] Bulma (Primary / Link / Info / Success / Warning / Danger / Light / Dark)
  - [x] DaisyUI (8 solid + 3 gradients)
  - [x] Heading variants (Tailwind only: 3 gradient text + Dark / Muted)
  - [x] Container variants (Tailwind only: Default / Narrow / Sunset bg / Ocean bg / Dark)

---

## Phase 3 — Interactivity ⏳ (~40% done)

### Done
- [x] Element nesting (drop into containers, visual drop target)
- [x] Element reorder (drag existing element to move/re-parent)
- [x] Ancestor-cycle guard (can't drop a container into its own child)

### Pending
- [ ] **3a. Button on-click actions**
  - [ ] "On click" select in Button properties
  - [ ] `None` action (current default)
  - [ ] `Go to URL` (renders as `<a>`, optional new tab)
  - [ ] `Scroll to section` (smooth scroll to element ID)
  - [ ] `Open modal` (show modal element by ID)
  - [ ] `Close modal`
  - [ ] `Toggle visibility` (show/hide arbitrary target)
  - [ ] Export pipeline emits matching JS / framework syntax per exporter
- [ ] **3b. Modal element type**
  - [ ] 🪟 Modal tile in sidebar palette
  - [ ] Default styled with framework's modal classes (where available)
  - [ ] Properties: title, ID, backdrop on/off, close-on-overlay-click
  - [ ] Accepts children (other elements)
  - [ ] Initially hidden in the canvas; preview pill to toggle visible during design
  - [ ] Per-framework variants
- [ ] **3c. Form + form inputs**
  - [ ] 📋 Form container (action URL, method GET/POST)
  - [ ] Existing Input element nests inside Form
  - [ ] 📝 Textarea
  - [ ] ☑ Checkbox
  - [ ] 🔘 Radio
  - [ ] ▼ Select with options array
  - [ ] Submit button variant
  - [ ] Optional `name` attribute editor for every input

---

## Phase 4 — Export System ⏳ (~95% done)

### Done
- [x] 7 code exporters (HTML / Blade / Inertia+Vue / CodeIgniter / WordPress / Vue / React)
- [x] CSS framework class injection per element
- [x] Inline `style="..."` for custom colors picked in the panel
- [x] Custom-class override (`customClass` prop) flows through to export
- [x] Framework CDN auto-injected into exported file `<head>`
- [x] Cloud registry update system
  - [x] `registry.json` at repo root listing versions + files
  - [x] Tools → Update frameworks fetches from GitHub raw
  - [x] Centered status modal with progress bar
  - [x] NW.js `fs` writes the new files into local `frameworks/` and `exporters/`
  - [x] Up-to-date and error states handled

### Pending
- [ ] **4a. Export as ZIP**
  - [ ] Choice during Export: "Single file" or "Project ZIP"
  - [ ] ZIP contains the rendered file at the exporter's `outputFolder` path (e.g. `resources/views/`)
  - [ ] ZIP includes a README with framework install instructions
  - [ ] ZIP includes framework config files where applicable (`tailwind.config.js`, `package.json`)
- [ ] **4b. Additional exporters (deferred to v2)**
  - [ ] Next.js Pages router
  - [ ] Nuxt 3
  - [ ] Svelte SFC
  - [ ] Astro
  - [ ] Django template
  - [ ] Flask + Jinja

---

## Phase 5 — Polish ⏳ (~60% done)

### Done
- [x] Undo/Redo (snapshot history, depth 50, every mutation hooks in)
- [x] Preview mode (hide chrome, full-window canvas, Esc / button to exit)
- [x] Toggle sidebar / Toggle properties
- [x] Auto-save to localStorage (debounced 400 ms)
- [x] Status modal with icon + progress bar + auto-dismiss
- [x] About modal · Keyboard shortcuts modal
- [x] Open docs in external browser via `nw.Shell`
- [x] Disabled button styling (so disabled state is visible)

### Pending
- [ ] **5a. Layers / tree view**
  - [ ] New panel section (right side, above Properties)
  - [ ] Render the element tree with indentation for children
  - [ ] Click a layer → select it on the canvas
  - [ ] Drag a layer → reorder / re-parent
  - [ ] Eye icon → hide / show the element on the canvas
  - [ ] Expand / collapse children
- [ ] **5b. Copy / Paste / Duplicate**
  - [ ] Ctrl+C copy selected
  - [ ] Ctrl+V paste into current parent (or top-level)
  - [ ] Ctrl+D duplicate in place
  - [ ] Internal clipboard survives between projects
- [ ] **5c. Multiple pages per project**
  - [ ] "Pages" section in sidebar (above element palette)
  - [ ] Each page has its own element tree
  - [ ] Add / rename / delete pages
  - [ ] Switch active page
  - [ ] Export emits one file per page, with cross-links resolving
- [ ] **5d. Code view**
  - [ ] Toggle button to split canvas with live rendered HTML
  - [ ] Updates in real time as the canvas changes
  - [ ] Read-only (editing happens visually)
  - [ ] Syntax highlighting

---

## Bonus / unplanned-but-shipped 🎁

- [x] Cloud framework update system
- [x] Gradient variants for Tailwind / DaisyUI buttons + Tailwind headings
- [x] Iframe-isolated canvas (so Bootstrap reset doesn't blow up the editor)
- [x] CSP-safe, no external script dependencies in the editor
- [x] PullStack repo public on GitHub: github.com/PullFool/PullStack

---

## Recommended next-up order

| # | Task | Phase | Est. |
|---|------|-------|------|
| 1 | Button on-click actions (3a) | 3 | ~20 min |
| 2 | Modal element (3b) | 3 | ~20 min |
| 3 | Form + textarea / checkbox / radio / select (3c) | 3 | ~30 min |
| 4 | Layers tree (5a) | 5 | ~30 min |
| 5 | Copy / Paste / Duplicate (5b) | 5 | ~15 min |
| 6 | Export ZIP (4a) | 4 | ~30 min |
| 7 | Multiple pages (5c) | 5 | ~40 min |
| 8 | Code view (5d) | 5 | ~25 min |

Total to feature-complete v1: ~3 hours.

---

_Last updated: 2026-05-28_
