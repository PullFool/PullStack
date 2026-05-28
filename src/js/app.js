'use strict';

(async function () {
  const $ = (id) => document.getElementById(id);

  Properties.init('propertiesBody', {
    onChange: (evt) => {
      Canvas.render();
      Layers.render(Canvas.selected);
      if (evt.type === 'remove') Canvas.select(null);
    }
  });

  Canvas.init('canvas', {
    onSelect: (id) => {
      Properties.show(id);
      Layers.render(id);
    }
  });

  Layers.init('layersBody', {
    onSelect: (id) => {
      Canvas.select(id);
      Properties.show(id);
    }
  });
  Layers.attachEvents();

  const _origCanvasRender = Canvas.render.bind(Canvas);
  Canvas.render = function () {
    _origCanvasRender();
    Layers.render(Canvas.selected);
  };

  let codeViewOn = false;
  $('codeViewToggle')?.addEventListener('click', () => {
    codeViewOn = !codeViewOn;
    $('codeView').style.display = codeViewOn ? 'block' : 'none';
    $('codeViewToggle').classList.toggle('active', codeViewOn);
    if (codeViewOn) updateCodeView();
  });

  async function updateCodeView() {
    if (!codeViewOn) return;
    const p = Project.get();
    const codeEl = $('codeView');
    if (!p) {
      codeEl.textContent = '// Create or open a project first';
      return;
    }
    try {
      const result = await Exporter.exportProject(p);
      codeEl.textContent = result.content;
    } catch (e) {
      codeEl.textContent = '// Error generating code: ' + e.message;
    }
  }

  const _origCanvasRender2 = Canvas.render.bind(Canvas);
  Canvas.render = function () {
    _origCanvasRender2();
    updateCodeView();
  };

  $('layersToggleBtn')?.addEventListener('click', () => {
    const body = $('layersBody');
    const btn = $('layersToggleBtn');
    if (body.style.display === 'none') {
      body.style.display = '';
      btn.textContent = 'Hide';
    } else {
      body.style.display = 'none';
      btn.textContent = 'Show';
    }
  });

  const cssOptions = await Exporter.listFrameworks();
  const codeOptions = await Exporter.listExporters();

  populateSelect('cssFrameworkSelect', cssOptions, 'tailwind');
  populateSelect('codeFrameworkSelect', codeOptions, 'html');

  const restored = Project.loadFromStorage();
  if (restored) {
    Sidebar.render('elementPalette');
    enableActions();
    updateProjectMeta();
    await Canvas.loadFrameworkAssets(restored.cssFramework);
    Canvas.render();
  }

  $('canvasEmptyCta')?.addEventListener('click', openNewProject);
  $('newProjectCancelBtn').addEventListener('click', closeNewProject);
  $('newProjectCreateBtn').addEventListener('click', createProject);

  $('saveProjectBtn').addEventListener('click', saveProject);
  $('exportBtn').addEventListener('click', exportProject);
  setupMenuBar();

  document.addEventListener('keydown', (ev) => {
    const ctrl = ev.ctrlKey || ev.metaKey;

    if (ev.key === 'Delete' && Canvas.selected) {
      Project.removeElement(Canvas.selected);
      Canvas.select(null);
      Canvas.render();
      Properties.show(null);
      return;
    }
    if (ctrl && ev.key.toLowerCase() === 's') { ev.preventDefault(); saveProject(); return; }
    if (ctrl && ev.key.toLowerCase() === 'n') { ev.preventDefault(); openNewProject(); return; }
    if (ctrl && ev.key.toLowerCase() === 'o') { ev.preventDefault(); openProject(); return; }
    if (ctrl && ev.key.toLowerCase() === 'e') { ev.preventDefault(); exportProject(); return; }
    if (ctrl && ev.key.toLowerCase() === 'z' && !ev.shiftKey) {
      ev.preventDefault();
      if (Project.undo()) { Canvas.render(); Properties.show(Canvas.selected); }
      return;
    }
    if (ctrl && (ev.key.toLowerCase() === 'y' || (ev.key.toLowerCase() === 'z' && ev.shiftKey))) {
      ev.preventDefault();
      if (Project.redo()) { Canvas.render(); Properties.show(Canvas.selected); }
      return;
    }
    if (ctrl && ev.key.toLowerCase() === 'c' && Canvas.selected && !isEditingText()) {
      ev.preventDefault();
      copySelected();
      return;
    }
    if (ctrl && ev.key.toLowerCase() === 'v' && Project.get() && !isEditingText()) {
      ev.preventDefault();
      pasteFromClipboard();
      return;
    }
    if (ctrl && ev.key.toLowerCase() === 'd' && Canvas.selected) {
      ev.preventDefault();
      duplicateSelected();
      return;
    }
    if (ev.key === 'F12') {
      ev.preventDefault();
      if (typeof nw !== 'undefined' && nw.Window && nw.Window.get) {
        nw.Window.get().showDevTools();
      }
      return;
    }
    if (ev.key === 'F5') {
      ev.preventDefault();
      enterPreview();
      return;
    }
    if (ev.key === 'Escape') {
      if (document.body.classList.contains('preview-mode')) {
        exitPreview();
      } else {
        document.querySelectorAll('.modal-overlay.active').forEach(m => m.classList.remove('active'));
      }
    }
  });

  function populateSelect(id, options, defaultId) {
    const sel = $(id);
    sel.innerHTML = '';
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt.id;
      o.textContent = opt.name || opt.id;
      if (opt.id === defaultId) o.selected = true;
      sel.appendChild(o);
    });
  }

  function openNewProject() {
    $('projectNameInput').value = '';
    $('newProjectModal').classList.add('active');
    setTimeout(() => $('projectNameInput').focus(), 50);
  }

  function closeNewProject() {
    $('newProjectModal').classList.remove('active');
  }

  async function createProject() {
    const name = ($('projectNameInput').value || 'untitled').trim();
    const cssFramework = $('cssFrameworkSelect').value;
    const codeFramework = $('codeFrameworkSelect').value;
    Project.create({ name, cssFramework, codeFramework });
    closeNewProject();
    Sidebar.render('elementPalette');
    enableActions();
    updateProjectMeta();
    await Canvas.loadFrameworkAssets(cssFramework);
    Canvas.render();
    toast(`Project "${name}" created`, 'success');
  }

  function saveProject() {
    const p = Project.get();
    if (!p) return;
    const json = Project.serialize();
    Exporter.download((p.name || 'untitled') + '.pullstack.json', json);
    toast('Project saved to Downloads', 'success');
  }

  function openProject() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json,.pullstack.json';
    input.addEventListener('change', async () => {
      const file = input.files && input.files[0];
      if (!file) return;
      const text = await file.text();
      const parsed = Project.deserialize(text);
      if (!parsed) {
        toast('Invalid project file', 'error');
        return;
      }
      Sidebar.render('elementPalette');
      enableActions();
      updateProjectMeta();
      await Canvas.loadFrameworkAssets(parsed.cssFramework);
      Canvas.render();
      toast(`Opened "${parsed.name}"`, 'success');
    });
    input.click();
  }

  async function exportProject() {
    const p = Project.get();
    if (!p) return;
    const result = await Exporter.exportProject(p);
    Exporter.download(result.filename, result.content);
    toast(`Exported as ${result.filename}`, 'success');
  }

  function enableActions() {
    $('saveProjectBtn').disabled = false;
    $('exportBtn').disabled = false;
    document.querySelectorAll('.menu-item[data-needs-project]').forEach(el => {
      el.classList.remove('disabled');
    });
  }

  function setupMenuBar() {
    const bar = $('menubar');

    bar.addEventListener('click', (ev) => {
      const menuItem = ev.target.closest('.menu-item');
      if (menuItem) {
        ev.stopPropagation();
        if (menuItem.classList.contains('disabled')) return;
        bar.querySelectorAll('.menubar-item.open').forEach(i => i.classList.remove('open'));
        runMenuAction(menuItem.dataset.act);
        return;
      }

      const item = ev.target.closest('.menubar-item');
      if (item) {
        ev.stopPropagation();
        const isOpen = item.classList.contains('open');
        bar.querySelectorAll('.menubar-item.open').forEach(i => i.classList.remove('open'));
        if (!isOpen) item.classList.add('open');
      }
    });

    bar.addEventListener('mouseover', (ev) => {
      const hasOpen = !!bar.querySelector('.menubar-item.open');
      if (!hasOpen) return;
      const item = ev.target.closest('.menubar-item');
      if (!item || item.classList.contains('open')) return;
      bar.querySelectorAll('.menubar-item.open').forEach(i => i.classList.remove('open'));
      item.classList.add('open');
    });

    document.addEventListener('click', () => {
      bar.querySelectorAll('.menubar-item.open').forEach(i => i.classList.remove('open'));
    });
  }

  function runMenuAction(act) {
    switch (act) {
      case 'new': openNewProject(); break;
      case 'open': openProject(); break;
      case 'save': saveProject(); break;
      case 'save-as': saveProjectAs(); break;
      case 'export': exportProject(); break;
      case 'close-project': closeProject(); break;
      case 'undo':
        if (Project.undo()) {
          Canvas.render();
          Properties.show(Canvas.selected);
          toast('Undo', 'success');
        }
        break;
      case 'redo':
        if (Project.redo()) {
          Canvas.render();
          Properties.show(Canvas.selected);
          toast('Redo', 'success');
        }
        break;
      case 'copy': copySelected(); break;
      case 'paste': pasteFromClipboard(); break;
      case 'duplicate': duplicateSelected(); break;
      case 'delete-selected':
        if (Canvas.selected) {
          Project.removeElement(Canvas.selected);
          Canvas.select(null);
          Canvas.render();
          Properties.show(null);
        }
        break;
      case 'preview': enterPreview(); break;
      case 'toggle-sidebar': document.querySelector('.sidebar').classList.toggle('hidden'); break;
      case 'toggle-properties': document.querySelector('.properties').classList.toggle('hidden'); break;
      case 'reload-window':
        location.reload();
        break;
      case 'devtools':
        if (typeof nw !== 'undefined' && nw.Window && nw.Window.get) {
          nw.Window.get().showDevTools();
        }
        break;
      case 'update-frameworks':
        checkCloudUpdates();
        break;
      case 'reload-frameworks':
        refreshFrameworks();
        break;
      case 'about':
        $('aboutModal').classList.add('active');
        break;
      case 'shortcuts':
        $('shortcutsModal').classList.add('active');
        break;
      case 'docs':
        if (typeof nw !== 'undefined' && nw.Shell) {
          nw.Shell.openExternal('https://github.com/PullFool/PullStack');
        } else {
          toast('Opening docs requires NW.js', 'success');
        }
        break;
    }
  }

  function saveProjectAs() {
    const p = Project.get();
    if (!p) return;
    const newName = prompt('Save project as:', p.name);
    if (!newName || !newName.trim()) return;
    p.name = newName.trim();
    saveProject();
    updateProjectMeta();
  }

  function closeProject() {
    if (!confirm('Close current project? Unsaved changes will be lost.')) return;
    Project.clear();
    Sidebar.clear('elementPalette');
    Canvas.loadFrameworkAssets(null);
    Properties.show(null);
    document.querySelectorAll('.menu-item[data-needs-project]').forEach(el => {
      el.classList.add('disabled');
    });
    $('saveProjectBtn').disabled = true;
    $('exportBtn').disabled = true;
    $('projectMeta').innerHTML = '<span class="meta-label">No project</span>';
    toast('Project closed', 'success');
  }

  function enterPreview() {
    if (!Project.get()) return;
    document.body.classList.add('preview-mode');
  }

  function exitPreview() {
    document.body.classList.remove('preview-mode');
  }

  let clipboard = null;

  function copySelected() {
    if (!Canvas.selected) return;
    const el = Project.findById(Canvas.selected);
    if (el) {
      clipboard = JSON.parse(JSON.stringify(el));
      toast('Copied to clipboard', 'success');
    }
  }

  function pasteFromClipboard() {
    if (!clipboard) {
      toast('Nothing to paste', 'error');
      return;
    }
    let parentId = null;
    if (Canvas.selected) {
      const el = Project.findById(Canvas.selected);
      if (el && (el.type === 'container' || el.type === 'modal' || el.type === 'form')) {
        parentId = el.id;
      }
    }
    const pasted = Project.pasteElement(clipboard, parentId);
    if (pasted) {
      Canvas.render();
      Canvas.select(pasted.id);
      Properties.show(pasted.id);
      toast('Pasted', 'success');
    }
  }

  function duplicateSelected() {
    if (!Canvas.selected) {
      toast('Nothing selected', 'error');
      return;
    }
    const dup = Project.duplicateElement(Canvas.selected);
    if (dup) {
      Canvas.render();
      Canvas.select(dup.id);
      Properties.show(dup.id);
      toast('Duplicated', 'success');
    }
  }

  $('previewExitBtn')?.addEventListener('click', exitPreview);
  $('aboutCloseBtn')?.addEventListener('click', () => $('aboutModal').classList.remove('active'));
  $('shortcutsCloseBtn')?.addEventListener('click', () => $('shortcutsModal').classList.remove('active'));
  function showStatus({ icon, title, message, progress, showClose, autoClose }) {
    const modal = $('statusModal');
    if (icon !== undefined) $('statusIcon').textContent = icon;
    if (title !== undefined) $('statusTitle').textContent = title;
    if (message !== undefined) $('statusMessage').textContent = message;
    if (progress !== undefined) {
      $('statusProgressWrap').style.display = progress === null ? 'none' : 'block';
      if (progress !== null) $('statusProgressBar').style.width = progress + '%';
    }
    $('statusCloseBtn').style.display = showClose ? 'block' : 'none';
    modal.classList.add('active');
    if (autoClose) {
      setTimeout(() => modal.classList.remove('active'), autoClose);
    }
  }

  function closeStatus() {
    $('statusModal').classList.remove('active');
  }

  $('statusCloseBtn')?.addEventListener('click', closeStatus);

  async function checkCloudUpdates() {
    showStatus({
      icon: '⤓',
      title: 'Checking for updates',
      message: 'Reaching the framework registry on GitHub...',
      progress: 10,
      showClose: false
    });

    let result;
    try {
      result = await Updater.checkUpdates();
    } catch (e) {
      showStatus({
        icon: '⚠',
        title: 'Could not reach registry',
        message: e.message,
        progress: null,
        showClose: true
      });
      return;
    }

    if (!result.updates.length) {
      showStatus({
        icon: '✓',
        title: 'Up to date',
        message: `All frameworks and exporters match registry v${result.registry.registryVersion} (${result.registry.updatedAt}).`,
        progress: 100,
        showClose: true,
        autoClose: 2200
      });
      return;
    }

    const total = result.updates.length;
    let installed = 0;
    let failed = 0;

    showStatus({
      icon: '⬇',
      title: `Installing ${total} update${total > 1 ? 's' : ''}`,
      message: 'Downloading files from GitHub...',
      progress: 15,
      showClose: false
    });

    for (let i = 0; i < total; i++) {
      const u = result.updates[i];
      showStatus({
        message: `${u.name} (${i + 1}/${total}) · ${u.localVer} → ${u.remoteVer}`,
        progress: 15 + Math.round((i / total) * 80)
      });
      try {
        await Updater.applyUpdate(u);
        installed++;
      } catch (e) {
        failed++;
      }
    }

    const p = Project.get();
    if (p) {
      await Canvas.loadFrameworkAssets(p.cssFramework);
      Canvas.render();
      if (Canvas.selected) Properties.show(Canvas.selected);
    }

    if (failed === 0) {
      showStatus({
        icon: '✓',
        title: 'Updates installed',
        message: `${installed} framework${installed > 1 ? 's' : ''} updated successfully.`,
        progress: 100,
        showClose: true
      });
    } else {
      showStatus({
        icon: '⚠',
        title: 'Some updates failed',
        message: `Installed ${installed}, ${failed} failed. Check Tools menu later to retry.`,
        progress: 100,
        showClose: true
      });
    }
  }

  async function refreshFrameworks() {
    const p = Project.get();
    if (!p) return;
    const btn = $('refreshBtn');
    btn.disabled = true;
    btn.textContent = '↻ Refreshing...';
    try {
      await Canvas.loadFrameworkAssets(p.cssFramework);
      Canvas.render();
      if (Canvas.selected) Properties.show(Canvas.selected);
      toast('Framework styles reloaded', 'success');
    } catch (e) {
      toast('Refresh failed: ' + e.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = '↻ Refresh';
    }
  }

  function updateProjectMeta() {
    const p = Project.get();
    const meta = $('projectMeta');
    if (!p) {
      meta.innerHTML = '<span class="meta-label">No project</span>';
      return;
    }
    meta.innerHTML = `<strong>${escape(p.name)}</strong> &nbsp;·&nbsp; <span style="opacity:0.6">${p.cssFramework} → ${p.codeFramework}</span>`;
  }

  function toast(msg, kind) {
    const t = $('toast');
    t.textContent = msg;
    t.className = 'toast show ' + (kind || '');
    setTimeout(() => t.classList.remove('show'), 2500);
  }

  function escape(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function isEditingText() {
    const a = document.activeElement;
    if (!a) return false;
    const tag = a.tagName;
    return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || a.isContentEditable;
  }
})();
