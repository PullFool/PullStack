# PullStack

Drag-and-drop page builder for developers. Design once, export to your stack.

## Status

Phase 1 / V1 scaffolding — runnable skeleton:

- 3-column workspace (sidebar, canvas, properties)
- Project state, drag-and-drop, properties editor (basic)
- Plugin folders for CSS frameworks and code exporters
- Save / load `.pullstack.json` project files
- Export to HTML / Blade / Inertia+Vue / CodeIgniter / WordPress / Vue / React

Drag still only lands top-level on the canvas, properties cover the basic attributes, modals and on-click actions are not wired yet — that's Phase 3.

## Run

```bash
npm install
npm start
```

`npm install` pulls down NW.js. `npm start` launches the desktop window.

## CSS frameworks supported in V1

- Tailwind CSS
- Bootstrap 5
- Bulma
- DaisyUI
- shadcn/ui (React export only)
- Pico CSS
- Vanilla CSS (no framework)

## Code exporters supported in V1

- Plain HTML
- Laravel Blade
- Inertia + Vue 3
- CodeIgniter 4
- WordPress
- Vue 3 SFC
- React JSX

## Adding a new framework or exporter

Both are plugin folders — no app rebuild needed.

### Add a CSS framework

```
frameworks/<your-framework>/
  manifest.json        # { "name": "...", "type": "css-framework", ... }
  elements.json        # { "button": "your-class-list", "heading.1": "...", ... }
  cdn.txt              # CDN <link>/<script> tags injected into the export head
```

Then register the folder name in `Exporter.listFrameworks` known list (will be auto-scanned in a later phase).

### Add a code exporter

```
exporters/<your-target>/
  manifest.json        # { "name": "...", "extension": ".ext", ... }
  template.<ext>       # uses {{TITLE}}, {{HEAD}}, {{CONTENT}} placeholders
```

## Project file format

Projects save to `<name>.pullstack.json` — plain JSON, version-tagged, structured tree of elements with `type`, `props`, and optional `children`.

## License

UNLICENSED (private project).
