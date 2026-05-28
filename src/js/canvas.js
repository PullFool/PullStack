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
    try {
      const defsRes = await fetch(`frameworks/${cssFramework}/elements.json`);
      cssDefs = defsRes.ok ? await defsRes.json() : {};
    } catch (e) {
      cssDefs = {};
    }
    try {
      const cdnRes = await fetch(`frameworks/${cssFramework}/cdn.txt`);
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
        #drop-zone { min-height: calc(100vh - 32px); }
        #drop-zone.empty-msg::before { content: "Drag elements here"; display: block; text-align: center; color: #d1d5db; padding: 80px 0; font-size: 14px; }
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

    frameDoc.addEventListener('dragover', (ev) => {
      ev.preventDefault();
      ev.dataTransfer.dropEffect = 'copy';
    });

    frameDoc.addEventListener('drop', (ev) => {
      ev.preventDefault();
      const elType = ev.dataTransfer.getData('application/x-pullstack-element');
      if (!elType) return;
      const el = Project.addElement({ type: elType, props: defaultPropsFor(elType) });
      if (el) render();
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
      case 'button': return { text: 'Click me', onClick: { action: 'none' } };
      case 'link': return { text: 'Read more', href: '#' };
      case 'image': return { src: 'https://placehold.co/600x400', alt: 'Image' };
      case 'container': return { layout: 'block' };
      case 'divider': return {};
      case 'input': return { placeholder: 'Enter text...', type: 'text' };
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
      case 'button':
        inner = `<button type="button"${clsPart}${stylePart}>${escape(p.text)}</button>`;
        break;
      case 'link':
        inner = `<a href="${escape(p.href)}"${clsPart}${stylePart}>${escape(p.text)}</a>`;
        break;
      case 'image':
        inner = `<img src="${escape(p.src)}" alt="${escape(p.alt)}"${clsPart} />`;
        break;
      case 'container': {
        const children = (el.children || []).map(c => renderElementHtml(c)).join('');
        inner = `<div${clsPart}${stylePart}>${children}</div>`;
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
    return `<div data-ps-el="${el.id}"${selectedAttr}>${inner}</div>`;
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
    get selected() { return selectedId; }
  };
})();
