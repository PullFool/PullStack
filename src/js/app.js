'use strict';

(async function () {
  const $ = (id) => document.getElementById(id);

  Properties.init('propertiesBody', {
    onChange: (evt) => {
      Canvas.render();
      if (evt.type === 'remove') Canvas.select(null);
    }
  });

  Canvas.init('canvas', {
    onSelect: (id) => Properties.show(id)
  });

  const cssOptions = await Exporter.listFrameworks();
  const codeOptions = await Exporter.listExporters();

  populateSelect('cssFrameworkSelect', cssOptions, 'tailwind');
  populateSelect('codeFrameworkSelect', codeOptions, 'html');

  $('newProjectBtn').addEventListener('click', openNewProject);
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
    if (ev.key === 'F12') {
      ev.preventDefault();
      if (typeof nw !== 'undefined' && nw.Window && nw.Window.get) {
        nw.Window.get().showDevTools();
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
      case 'export': exportProject(); break;
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
      case 'delete-selected':
        if (Canvas.selected) {
          Project.removeElement(Canvas.selected);
          Canvas.select(null);
          Canvas.render();
          Properties.show(null);
        }
        break;
      case 'reload-window':
        location.reload();
        break;
      case 'devtools':
        if (typeof nw !== 'undefined' && nw.Window && nw.Window.get) {
          nw.Window.get().showDevTools();
        }
        break;
      case 'update-frameworks':
      case 'reload-frameworks':
        refreshFrameworks();
        break;
      case 'about':
        toast('PullStack v0.1.0 — drag-and-drop page builder', 'success');
        break;
      case 'docs':
        toast('Docs coming soon at github.com/PullFool/PullStack', 'success');
        break;
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
})();
