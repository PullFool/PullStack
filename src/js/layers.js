'use strict';

const Layers = (() => {
  let bodyEl = null;
  let onSelectCb = null;
  let collapsed = new Set();

  const ICONS = {
    heading: 'H', text: '¶', button: '◼', link: '🔗', image: '🖼',
    container: '▢', divider: '—', input: '⌨', modal: '🪟',
    form: '📋', textarea: '📝', checkbox: '☑', radio: '🔘', select: '▼'
  };

  function init(target, opts = {}) {
    bodyEl = typeof target === 'string' ? document.getElementById(target) : target;
    onSelectCb = opts.onSelect || (() => {});
  }

  function labelFor(el) {
    const p = el.props || {};
    if (el.type === 'heading') return `Heading: ${truncate(p.text)}`;
    if (el.type === 'text') return `Text: ${truncate(p.text)}`;
    if (el.type === 'button') return `Button: ${truncate(p.text)}`;
    if (el.type === 'link') return `Link: ${truncate(p.text)}`;
    if (el.type === 'image') return 'Image';
    if (el.type === 'container') return 'Container';
    if (el.type === 'modal') return `Modal: ${truncate(p.title || p.modalId)}`;
    if (el.type === 'form') return `Form: ${truncate(p.action)}`;
    if (el.type === 'input') return `Input: ${truncate(p.placeholder)}`;
    if (el.type === 'textarea') return `Textarea: ${truncate(p.placeholder)}`;
    if (el.type === 'checkbox') return `Checkbox: ${truncate(p.label)}`;
    if (el.type === 'radio') return `Radio: ${truncate(p.label)}`;
    if (el.type === 'select') return `Select`;
    if (el.type === 'divider') return 'Divider';
    return el.type;
  }

  function truncate(s) {
    if (!s) return '';
    s = String(s);
    return s.length > 18 ? s.slice(0, 16) + '…' : s;
  }

  function render(selectedId) {
    if (!bodyEl) return;
    const project = Project.get();
    if (!project || !project.tree.length) {
      bodyEl.innerHTML = '<div class="empty-state" style="padding:12px;">No elements yet</div>';
      return;
    }
    bodyEl.innerHTML = '';
    project.tree.forEach(el => bodyEl.appendChild(renderNode(el, 0, selectedId)));
  }

  function renderNode(el, depth, selectedId) {
    const row = document.createElement('div');
    const hasChildren = el.children && el.children.length;
    const isCollapsed = collapsed.has(el.id);
    const isSelected = el.id === selectedId;

    row.className = 'layer-row';
    row.dataset.layerId = el.id;
    row.draggable = true;
    row.style.cssText = `
      display:flex;align-items:center;gap:6px;
      padding:4px 8px 4px ${8 + depth * 14}px;
      font-size:12px;cursor:pointer;border-radius:4px;
      ${isSelected ? 'background:rgba(192,132,252,0.2);color:#fff;' : 'color:rgba(255,255,255,0.75);'}
    `;
    row.innerHTML = `
      <span style="width:12px;flex-shrink:0;text-align:center;font-size:10px;opacity:0.6;cursor:pointer;" data-toggle-collapse="${el.id}">${hasChildren ? (isCollapsed ? '▶' : '▼') : ''}</span>
      <span style="width:16px;flex-shrink:0;text-align:center;">${ICONS[el.type] || '·'}</span>
      <span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${escapeHtml(labelFor(el))}</span>
    `;
    const frag = document.createDocumentFragment();
    frag.appendChild(row);
    if (hasChildren && !isCollapsed) {
      el.children.forEach(c => frag.appendChild(renderNode(c, depth + 1, selectedId)));
    }
    const wrap = document.createElement('div');
    wrap.appendChild(frag);
    return wrap;
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  function attachEvents() {
    if (!bodyEl) return;
    bodyEl.addEventListener('click', (ev) => {
      const collapseBtn = ev.target.closest('[data-toggle-collapse]');
      if (collapseBtn) {
        ev.stopPropagation();
        const id = collapseBtn.dataset.toggleCollapse;
        if (collapsed.has(id)) collapsed.delete(id);
        else collapsed.add(id);
        render(typeof Canvas !== 'undefined' ? Canvas.selected : null);
        return;
      }
      const row = ev.target.closest('[data-layer-id]');
      if (row) {
        onSelectCb(row.dataset.layerId);
      }
    });

    bodyEl.addEventListener('dragstart', (ev) => {
      const row = ev.target.closest('[data-layer-id]');
      if (!row) return;
      ev.dataTransfer.setData('application/x-pullstack-layer-move', row.dataset.layerId);
      ev.dataTransfer.effectAllowed = 'move';
      row.style.opacity = '0.4';
    });

    bodyEl.addEventListener('dragend', (ev) => {
      const row = ev.target.closest('[data-layer-id]');
      if (row) row.style.opacity = '';
    });

    bodyEl.addEventListener('dragover', (ev) => {
      const row = ev.target.closest('[data-layer-id]');
      if (!row) return;
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'move';
    });

    bodyEl.addEventListener('drop', (ev) => {
      const row = ev.target.closest('[data-layer-id]');
      if (!row) return;
      ev.preventDefault();
      const movedId = ev.dataTransfer.getData('application/x-pullstack-layer-move');
      const targetId = row.dataset.layerId;
      if (!movedId || movedId === targetId) return;
      const target = Project.findById(targetId);
      if (!target) return;
      const dropAsChild = ['container', 'modal', 'form'].includes(target.type);
      const parentId = dropAsChild ? targetId : null;
      if (parentId && Project.isAncestor(movedId, parentId)) return;
      const moved = Project.moveElement(movedId, parentId);
      if (moved) {
        if (typeof Canvas !== 'undefined') Canvas.render();
        render(movedId);
      }
    });
  }

  return { init, render, attachEvents };
})();
