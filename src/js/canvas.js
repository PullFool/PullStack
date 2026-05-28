'use strict';

const Canvas = (() => {
  let canvasEl = null;
  let frameEl = null;
  let frameDoc = null;
  let frameRoot = null;
  let selectedId = null;
  let onSelectCb = null;
  let cssDefs = {};
  let currentCdn = '';
  let previewMode = false;

  function setPreviewMode(on) {
    previewMode = !!on;
    render();
  }

  function init(target, opts = {}) {
    canvasEl = typeof target === 'string' ? document.getElementById(target) : target;
    if (!canvasEl) return;
    onSelectCb = opts.onSelect || (() => {});
    showEmptyState(false);
  }

  async function loadFrameworkAssets(cssFramework) {
    if (!cssFramework) {
      cssDefs = {};
      currentCdn = '';
      showEmptyState(!!Project.get());
      return;
    }
    const bust = `?_t=${Date.now()}`;
    try {
      const defsRes = await fetch(`frameworks/${cssFramework}/elements.json${bust}`, { cache: 'no-store' });
      cssDefs = defsRes.ok ? await defsRes.json() : {};
    } catch (e) {
      cssDefs = {};
    }
    try {
      const cdnRes = await fetch(`frameworks/${cssFramework}/cdn.txt${bust}`, { cache: 'no-store' });
      currentCdn = cdnRes.ok ? await cdnRes.text() : '';
    } catch (e) {
      currentCdn = '';
    }
    await mountFrame();
  }

  function mountFrame() {
    return new Promise(resolve => {
      canvasEl.innerHTML = '<iframe id="canvasFrame" style="width:100%;height:100%;min-height:600px;border:0;background:#ffffff;display:block;"></iframe>';
      frameEl = canvasEl.querySelector('#canvasFrame');

      const overlayStyles = `
        body { min-height: 600px; margin: 0; padding: 16px; background: #ffffff; color: #1a1a1a; font-family: system-ui, sans-serif; }
        body.empty { display: flex; align-items: center; justify-content: center; color: #9ca3af; font-size: 14px; }
        [data-ps-el] { position: relative; outline: 1px dashed transparent; outline-offset: 2px; cursor: pointer; transition: outline-color 0.1s; }
        [data-ps-el]:hover { outline-color: rgba(192, 132, 252, 0.5); }
        [data-ps-el].is-selected { outline: 2px solid #c084fc; }
        [data-ps-container] { min-height: 60px; }
        [data-ps-container]:empty::before { content: "Drop inside this container"; display: block; text-align: center; color: #d1d5db; padding: 22px 0; font-size: 12px; font-style: italic; }
        [data-ps-container].drop-target { outline: 2px dashed #c084fc !important; background: rgba(192, 132, 252, 0.08); }
        #drop-zone { min-height: calc(100vh - 32px); }
        #drop-zone.empty-msg::before { content: "Drag elements here"; display: block; text-align: center; color: #d1d5db; padding: 80px 0; font-size: 14px; }
        #drop-zone.drop-target { outline: 2px dashed #c084fc; outline-offset: -8px; }
      `;

      const html = `<!DOCTYPE html>
<html><head><meta charset="UTF-8">${currentCdn}<style>${overlayStyles}</style></head>
<body><div id="drop-zone"></div></body></html>`;

      frameEl.addEventListener('load', () => {
        frameDoc = frameEl.contentDocument;
        frameRoot = frameDoc.getElementById('drop-zone');
        attachFrameEvents();
        render();
        resolve();
      }, { once: true });

      frameEl.srcdoc = html;
    });
  }

  function attachFrameEvents() {
    if (!frameDoc) return;

    let lastHover = null;
    let draggingId = null;

    function clearHover() {
      if (lastHover) {
        lastHover.classList.remove('drop-target');
        lastHover = null;
      }
    }

    function findDropTarget(ev) {
      const container = ev.target.closest('[data-ps-container]');
      if (container) return { kind: 'container', el: container, parentId: container.dataset.psContainer };
      if (frameRoot && frameRoot.contains(ev.target)) return { kind: 'root', el: frameRoot, parentId: null };
      return null;
    }

    frameDoc.addEventListener('dragstart', (ev) => {
      const elWrap = ev.target.closest('[data-ps-el]');
      if (!elWrap) return;
      draggingId = elWrap.dataset.psEl;
      ev.dataTransfer.setData('application/x-pullstack-move', draggingId);
      ev.dataTransfer.effectAllowed = 'move';
      elWrap.style.opacity = '0.4';
    });

    frameDoc.addEventListener('dragend', (ev) => {
      const elWrap = ev.target.closest('[data-ps-el]');
      if (elWrap) elWrap.style.opacity = '';
      draggingId = null;
      clearHover();
    });

    frameDoc.addEventListener('dragover', (ev) => {
      const drop = findDropTarget(ev);
      if (!drop) return;
      if (draggingId) {
        if (drop.parentId === draggingId) return;
        if (drop.parentId && Project.isAncestor(draggingId, drop.parentId)) return;
      }
      ev.preventDefault();
      ev.dataTransfer.dropEffect = draggingId ? 'move' : 'copy';
      if (lastHover !== drop.el) {
        clearHover();
        lastHover = drop.el;
        lastHover.classList.add('drop-target');
      }
    });

    frameDoc.addEventListener('dragleave', (ev) => {
      const drop = findDropTarget(ev);
      if (!drop || drop.el !== lastHover) {
        clearHover();
      }
    });

    frameDoc.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const drop = findDropTarget(ev);
      clearHover();
      if (!drop) return;

      const moveId = ev.dataTransfer.getData('application/x-pullstack-move');
      if (moveId) {
        const moved = Project.moveElement(moveId, drop.parentId);
        if (moved) {
          render();
          select(moveId);
        }
        return;
      }

      const elType = ev.dataTransfer.getData('application/x-pullstack-element');
      if (!elType) return;
      const el = Project.addElement({ type: elType, props: defaultPropsFor(elType) }, drop.parentId);
      if (el) {
        render();
        select(el.id);
      }
    });

    frameDoc.addEventListener('click', (ev) => {
      const target = ev.target.closest('[data-ps-el]');
      if (target) {
        select(target.dataset.psEl);
      } else {
        select(null);
      }
    });
  }

  function defaultPropsFor(type) {
    switch (type) {
      case 'heading': return { text: 'Heading', level: 1 };
      case 'text': return { text: 'Lorem ipsum dolor sit amet.' };
      case 'button': return { text: 'Click me', onClick: { action: 'none', target: '' } };
      case 'link': return { text: 'Read more', href: '#' };
      case 'image': return { src: 'https://placehold.co/600x400', alt: 'Image' };
      case 'container': return { layout: 'block' };
      case 'divider': return {};
      case 'input': return { placeholder: 'Enter text...', type: 'text' };
      case 'modal': return { title: 'Modal title', modalId: 'modal_' + Math.random().toString(36).slice(2, 8), dismissable: true };
      case 'form': return { action: '/submit', method: 'POST' };
      case 'textarea': return { placeholder: 'Your message...', rows: 4, name: '' };
      case 'checkbox': return { label: 'I agree', name: '', checked: false };
      case 'radio': return { label: 'Option', name: 'group1', value: 'option1', checked: false };
      case 'select': return { name: '', options: ['Option 1', 'Option 2', 'Option 3'] };
      default: return {};
    }
  }

  function defaultClassFor(el) {
    const p = el.props || {};
    if (el.type === 'heading') return cssDefs[`heading.${p.level || 1}`] || cssDefs.heading || '';
    return cssDefs[el.type] || '';
  }

  function presetsFor(el) {
    const key = `${el.type}.variants`;
    const v = cssDefs[key];
    return Array.isArray(v) ? v : [];
  }

  function classFor(el) {
    const p = el.props || {};
    if (p.customClass != null) return p.customClass;
    return defaultClassFor(el);
  }

  function inlineStyleFor(el) {
    const p = el.props || {};
    if (!p.color) return '';
    const target = ['heading', 'text', 'link'].includes(el.type) ? 'color' : 'background-color';
    return ` style="${target}: ${p.color}"`;
  }

  function classAttr(el) {
    const c = classFor(el);
    return c ? ` class="${c}"` : '';
  }

  function escape(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function previewOnClickAttr(p) {
    if (!previewMode) return '';
    const oc = p.onClick;
    if (!oc || oc.action === 'none') return '';
    const target = String(oc.target || '').replace(/'/g, "\\'");
    switch (oc.action) {
      case 'page':
        return ` onclick="window.parent.PullStackPreview && window.parent.PullStackPreview.gotoPage('${target}')"`;
      case 'open-modal':
        return ` onclick="var m=document.getElementById('${target}');if(m){m.style.display='flex';}"`;
      case 'close-modal':
        return ` onclick="var m=document.getElementById('${target}');if(m){m.style.display='none';}"`;
      case 'toggle':
        return ` onclick="var el=document.getElementById('${target}');if(el){el.style.display=el.style.display==='none'?'':'none';}"`;
      case 'scroll':
        return ` onclick="var el=document.getElementById('${target}');if(el){el.scrollIntoView({behavior:'smooth'});}"`;
      case 'url':
        return ` onclick="window.parent.PullStackPreview && window.parent.PullStackPreview.previewUrl('${target}')"`;
      default:
        return '';
    }
  }

  function renderElementHtml(el) {
    const p = el.props || {};
    const cls = classFor(el);
    const clsPart = cls ? ` class="${cls}"` : '';
    const stylePart = inlineStyleFor(el);
    let inner;
    switch (el.type) {
      case 'heading':
        inner = `<h${p.level || 1}${clsPart}${stylePart}>${escape(p.text)}</h${p.level || 1}>`;
        break;
      case 'text':
        inner = `<p${clsPart}${stylePart}>${escape(p.text)}</p>`;
        break;
      case 'button': {
        const onClickPart = previewOnClickAttr(p);
        inner = `<button type="button"${clsPart}${stylePart}${onClickPart}>${escape(p.text)}</button>`;
        break;
      }
      case 'link':
        inner = `<a href="${escape(p.href)}"${clsPart}${stylePart}>${escape(p.text)}</a>`;
        break;
      case 'image':
        inner = `<img src="${escape(p.src)}" alt="${escape(p.alt)}"${clsPart} />`;
        break;
      case 'container': {
        const children = (el.children || []).map(c => renderElementHtml(c)).join('');
        inner = `<div${clsPart}${stylePart} data-ps-container="${el.id}">${children}</div>`;
        break;
      }
      case 'form': {
        const children = (el.children || []).map(c => renderElementHtml(c)).join('');
        inner = `<form${clsPart}${stylePart} data-ps-container="${el.id}" onsubmit="event.preventDefault()">${children}</form>`;
        break;
      }
      case 'textarea':
        inner = `<textarea${clsPart}${stylePart} rows="${p.rows || 4}" placeholder="${escape(p.placeholder)}"></textarea>`;
        break;
      case 'checkbox':
        inner = `<label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;"><input type="checkbox"${p.checked ? ' checked' : ''} /><span>${escape(p.label || '')}</span></label>`;
        break;
      case 'radio':
        inner = `<label style="display:inline-flex;align-items:center;gap:8px;cursor:pointer;"><input type="radio" name="${escape(p.name || '')}"${p.checked ? ' checked' : ''} /><span>${escape(p.label || '')}</span></label>`;
        break;
      case 'select': {
        const opts = (p.options || []).map(o => `<option>${escape(o)}</option>`).join('');
        inner = `<select${clsPart}${stylePart}>${opts}</select>`;
        break;
      }
      case 'modal': {
        const children = (el.children || []).map(c => renderElementHtml(c)).join('');
        const modalCls = cssDefs.modal || '';
        inner = `
          <div data-ps-modal-wrap style="margin:16px 0;padding:0;border:2px dashed rgba(192,132,252,0.5);border-radius:10px;background:rgba(192,132,252,0.04);">
            <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 14px;background:rgba(192,132,252,0.15);border-radius:8px 8px 0 0;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:#c084fc;">
              <span>🪟 Modal · id="${escape(p.modalId || '')}"</span>
              <span style="font-size:11px;font-weight:500;text-transform:none;letter-spacing:0;opacity:0.7;">${escape(p.title || '')}</span>
            </div>
            <div class="ps-modal-body ${modalCls}" data-ps-container="${el.id}" style="padding:16px;min-height:60px;">${children}</div>
          </div>
        `;
        break;
      }
      case 'divider':
        inner = `<hr${clsPart}${stylePart} />`;
        break;
      case 'input':
        inner = `<input type="${escape(p.type || 'text')}" placeholder="${escape(p.placeholder)}"${clsPart} />`;
        break;
      default:
        inner = `<div${clsPart}${stylePart}>${escape(el.type)}</div>`;
    }
    const selectedAttr = el.id === selectedId ? ' class="is-selected"' : '';
    return `<div data-ps-el="${el.id}" draggable="true"${selectedAttr}>${inner}</div>`;
  }

  function render() {
    const project = Project.get();
    if (!project) {
      showEmptyState(false);
      return;
    }
    if (!frameRoot) return;
    if (project.tree.length === 0) {
      frameRoot.className = 'empty-msg';
      frameRoot.innerHTML = '';
      return;
    }
    frameRoot.className = '';
    frameRoot.innerHTML = project.tree.map(el => renderElementHtml(el)).join('');
  }

  function showEmptyState(hasProject) {
    if (!canvasEl) return;
    const title = hasProject ? 'Loading framework...' : 'Welcome to PullStack';
    const desc = hasProject
      ? 'Setting up the canvas.'
      : 'Create a New project to start dragging elements here.';
    const cta = hasProject ? '' : '<button class="canvas-empty-cta" id="canvasEmptyCta">＋ New Project</button>';
    canvasEl.innerHTML = `
      <div class="canvas-empty">
        <div class="canvas-empty-title">${title}</div>
        <div class="canvas-empty-desc">${desc}</div>
        ${cta}
      </div>
    `;
    const ctaBtn = canvasEl.querySelector('#canvasEmptyCta');
    if (ctaBtn) ctaBtn.addEventListener('click', () => {
      document.getElementById('newProjectModal').classList.add('active');
    });
  }

  function select(id) {
    if (selectedId === id) return;
    if (frameRoot && selectedId) {
      const prev = frameRoot.querySelector(`[data-ps-el="${selectedId}"]`);
      if (prev) prev.classList.remove('is-selected');
    }
    selectedId = id;
    if (frameRoot && id) {
      const next = frameRoot.querySelector(`[data-ps-el="${id}"]`);
      if (next) next.classList.add('is-selected');
    }
    onSelectCb(id);
  }

  return {
    init,
    render,
    select,
    loadFrameworkAssets,
    defaultClassFor,
    presetsFor,
    setPreviewMode,
    get selected() { return selectedId; },
    get isPreview() { return previewMode; }
  };
})();
