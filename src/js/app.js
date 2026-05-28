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
  $('openProjectBtn').addEventListener('click', openProject);
  $('exportBtn').addEventListener('click', exportProject);
  $('refreshBtn').addEventListener('click', refreshFrameworks);

  document.addEventListener('keydown', (ev) => {
    if (ev.key === 'Delete' && Canvas.selected) {
      Project.removeElement(Canvas.selected);
      Canvas.select(null);
      Canvas.render();
      Properties.show(null);
    }
    if ((ev.ctrlKey || ev.metaKey) && ev.key === 's') {
      ev.preventDefault();
      saveProject();
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
    $('previewBtn').disabled = false;
    $('exportBtn').disabled = false;
    $('refreshBtn').disabled = false;
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
