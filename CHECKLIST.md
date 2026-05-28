# PullStack Build Checklist

Living roadmap. State as of 2026-05-28.

---

## Phase 1 — Foundation ✅

- [x] NW.js desktop app shell
- [x] Window config (1400×900, dark theme)
- [x] 3-column workspace (Pages+sidebar / canvas / Layers+properties)
- [x] New Project modal with CSS + code framework pickers
- [x] Plugin folder system (`frameworks/*/` and `exporters/*/`)
- [x] Save / Open `.pullstack.json` to disk
- [x] Auto-save to localStorage (debounced)
- [x] Force-save on Reload window + window close
- [x] Photoshop-style menubar (File / Edit / View / Tools / Help)
- [x] Keyboard shortcuts (Ctrl+N/O/S/E/Z/Y/C/V/D, Del, F5, F12, Esc, Ctrl+R)

---

## Phase 2 — Core Builder ✅

- [x] 14-element palette: Heading, Text, Button, Link, Image, Container, Divider, Modal, Form, Input, Textarea, Checkbox, Radio, Select
- [x] Drag from palette → drop on canvas (iframe-isolated so frameworks don't leak into editor)
- [x] Click to select, Delete key removes
- [x] Properties panel per element type
- [x] Color picker (background or text per element type)
- [x] Framework variant chips (Bootstrap / Tailwind / Bulma / DaisyUI) for button + heading + container
- [x] Gradient presets (Tailwind / DaisyUI: Sunset, Ocean, Aurora, Forest, Fire, Twilight)

---

## Phase 3 — Interactivity ✅

- [x] Element nesting (drop into containers / forms)
- [x] Element reorder via drag-to-move with ancestor-cycle guard
- [x] Button on-click actions:
  - [x] No action
  - [x] Go to URL
  - [x] Go to page (dropdown of project pages, auto-extension per code framework)
  - [x] Scroll to section
  - [x] Open modal
  - [x] Close modal
  - [x] Toggle visibility
- [x] Modal element with title / id / dismissable, lives in page.tree
- [x] Modal sub-items under each page in the sidebar (your design)
- [x] Click page → page view (modals hidden)
- [x] Click modal sub-item → focused modal edit view
- [x] "▶ Try this action" button in properties panel — fires the action without leaving edit mode
- [x] Preview mode (F5) — hides editor chrome, makes onclick attributes live, navigation routes through PullStackPreview

---

## Phase 4 — Export System ✅

- [x] 7 code exporters: HTML / Laravel Blade / Inertia+Vue / CodeIgniter / WordPress / Vue / React
- [x] Framework class injection per element
- [x] Inline color override (per-element background / text color)
- [x] Framework CDN auto-injected into exported `<head>`
- [x] Modal / toggle JS helpers auto-injected when used
- [x] Export single file (Ctrl+E)
- [x] Export as ZIP — one file per page at the exporter's `outputFolder`, generated README.md
- [x] Cloud registry update system (Tools → Update frameworks)
  - [x] `registry.json` at repo root listing versions
  - [x] Fetches from raw.githubusercontent.com/PullFool/PullStack
  - [x] Compares local manifest.version against registry
  - [x] Centered status modal with progress bar
  - [x] NW.js `fs` writes new files into local plugin folders
  - [x] Up-to-date / installing / done / failure states

---

## Phase 5 — Polish ✅

- [x] Undo / Redo (50-deep history, snapshot on every mutation)
- [x] Preview mode toggle + Esc to exit
- [x] Toggle sidebar / Toggle properties from View menu
- [x] Auto-save to localStorage + force-save on reload
- [x] Status modal with progress bar (used by cloud updates)
- [x] About modal · Keyboard shortcuts modal
- [x] Open docs in external browser via `nw.Shell`
- [x] Disabled button styling
- [x] Layers tree view (right panel)
  - [x] Element tree with indentation per depth
  - [x] Click → select on canvas
  - [x] Drag → reorder / re-parent
  - [x] Collapse / expand parents
  - [x] Hide / show whole panel
- [x] Copy / Paste / Duplicate (Ctrl+C / Ctrl+V / Ctrl+D)
  - [x] Internal clipboard survives during session
  - [x] Paste lands in selected container / form / modal, otherwise top-level
- [x] Multiple pages per project
  - [x] Pages section in sidebar with + Add / ✎ rename / × delete
  - [x] Each page has its own element tree
  - [x] Active page highlighted
  - [x] Switching pages clears selection
  - [x] Modals appear as indented sub-items under their page
- [x] Code view toggle ({ } button on canvas toolbar) — live HTML mirror of what would be exported

---

## Bonus shipped 🎁

- [x] Cloud framework update system (Tools → Update frameworks fetches from GitHub)
- [x] Gradient presets across Tailwind / DaisyUI buttons + Tailwind headings + containers
- [x] Iframe-isolated canvas (Bootstrap / Bulma resets don't blow up the editor UI)
- [x] CSP-safe (no external script dependencies in the editor)
- [x] PullStack repo public on GitHub: github.com/PullFool/PullStack

---

## Today's fixes (2026-05-28)

- [x] Modal-as-sub-item architecture (your idea, replaced bottom-pinning and inline-collapsible)
- [x] Drop a modal → stays on page, sub-item appears immediately in sidebar
- [x] Click modal sub-item → focused modal-only edit view
- [x] Removed breadcrumb header in modal view per your request
- [x] onMutate callback so Pages / Layers / Code view refresh after drops
- [x] Force-save before Reload window so state doesn't reset to a new project
- [x] Force-save on window close (beforeunload)
- [x] Status modal replaced toast for cloud-update progress

---

## V2 directions (open, not started)

- [ ] Element variants for heading / text / link across all frameworks (currently button-heavy)
- [ ] Additional CSS frameworks (Materialize, Foundation, UnoCSS, HeroUI, Mantine, Chakra)
- [ ] Additional exporters (Next.js, Nuxt, Svelte, Astro, Django, Flask, Rails)
- [ ] Asset library (manage uploaded images in-project)
- [ ] Template gallery (starter pages: landing, portfolio, blog, dashboard)
- [ ] Component library (saved reusable blocks across projects)
- [ ] Direct deploy to Netlify / Vercel / GitHub Pages
- [ ] Real-time multi-user collaboration

---

_Project: github.com/PullFool/PullStack_
_Last updated: 2026-05-28_
