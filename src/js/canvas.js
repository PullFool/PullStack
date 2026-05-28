'use strict';

const Canvas = (() => {
  let canvasEl = null;
  let selectedId = null;
  let onSelectCb = null;
  let cssDefs = {};
  let cdnInjected = '';

  async function loadFrameworkAssets(cssFramework) {
    if (!cssFramework) {
      cssDefs = {};
      removeFrameworkAssets();
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
      const cdn = cdnRes.ok ? await cdnRes.text() : '';
      injectFrameworkAssets(cdn);
    } catch (e) {
      injectFrameworkAssets('');
    }
  }

  function injectFrameworkAssets(html) {
    removeFrameworkAssets();
    if (!html.trim()) return;
    const wrap = document.createElement('div');
    wrap.id = 'framework-assets';
    wrap.style.display = 'none';
    wrap.innerHTML = html;
    Array.from(wrap.querySelectorAll('link, script, style')).forEach(node => {
      const fresh = document.createElement(node.tagName);
      Array.from(node.attributes).forEach(a => fresh.setAttribute(a.name, a.value));
      fresh.textContent = node.textContent;
      fresh.dataset.frameworkAsset = 'true';
      document.head.appendChild(fresh);
    });
    cdnInjected = html;
  }

  function removeFrameworkAssets() {
    Array.from(document.head.querySelectorAll('[data-framework-asset]')).forEach(n => n.remove());
    cdnInjected = '';
  }

  function init(target, opts = {}) {
    canvasEl = typeof target === 'string' ? document.getElementById(target) : target;
    if (!canvasEl) return;
    onSelectCb = opts.onSelect || (() => {});

    canvasEl.addEventListener('dragover', (ev) => {
      const type = ev.dataTransfer.types.find(t => t === 'application/x-pullstack-element');
      if (type) {
        ev.preventDefault();
        ev.dataTransfer.dropEffect = 'copy';
      }
    });

    canvasEl.addEventListener('drop', (ev) => {
      const elType = ev.dataTransfer.getData('application/x-pullstack-element');
      if (!elType) return;
      ev.preventDefault();
      const el = Project.addElement({ type: elType, props: defaultPropsFor(elType) });
      if (el) render();
    });

    canvasEl.addEventListener('click', (ev) => {
      const target = ev.target.closest('[data-el-id]');
      if (target) {
        select(target.dataset.elId);
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

  function render() {
    if (!canvasEl) return;
    const project = Project.get();
    if (!project || project.tree.length === 0) {
      renderEmpty(!!project);
      return;
    }
    canvasEl.innerHTML = '';
    project.tree.forEach(el => {
      canvasEl.appendChild(renderElement(el));
    });
    if (selectedId) {
      const sel = canvasEl.querySelector(`[data-el-id="${selectedId}"]`);
      if (sel) sel.classList.add('is-selected');
    }
  }

  function renderEmpty(hasProject) {
    const title = hasProject ? 'Empty canvas' : 'Welcome to PullStack';
    const desc = hasProject
      ? 'Drag elements from the left sidebar to start building.'
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

  function renderElement(el) {
    const wrap = document.createElement('div');
    wrap.dataset.elId = el.id;
    wrap.className = 'ps-el ps-el--' + el.type;
    wrap.innerHTML = renderInner(el);
    return wrap;
  }

  function classFor(el) {
    const p = el.props || {};
    if (el.type === 'heading') return cssDefs[`heading.${p.level || 1}`] || cssDefs.heading || '';
    return cssDefs[el.type] || '';
  }

  function classAttr(el) {
    const c = classFor(el);
    return c ? ` class="${c}"` : '';
  }

  function renderInner(el) {
    const p = el.props || {};
    const cls = classAttr(el);
    switch (el.type) {
      case 'heading': return `<h${p.level || 1}${cls}>${escape(p.text)}</h${p.level || 1}>`;
      case 'text': return `<p${cls}>${escape(p.text)}</p>`;
      case 'button': return `<button type="button"${cls}>${escape(p.text)}</button>`;
      case 'link': return `<a href="${escape(p.href)}"${cls}>${escape(p.text)}</a>`;
      case 'image': return `<img src="${escape(p.src)}" alt="${escape(p.alt)}"${cls} />`;
      case 'container': return `<div${cls}>${(el.children || []).map(c => renderElement(c).outerHTML).join('')}</div>`;
      case 'divider': return `<hr${cls} />`;
      case 'input': return `<input type="${escape(p.type || 'text')}" placeholder="${escape(p.placeholder)}"${cls} />`;
      default: return `<div${cls}>${escape(el.type)}</div>`;
    }
  }

  function escape(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function select(id) {
    if (selectedId === id) return;
    if (selectedId) {
      const prev = canvasEl.querySelector(`[data-el-id="${selectedId}"]`);
      if (prev) prev.classList.remove('is-selected');
    }
    selectedId = id;
    if (id) {
      const next = canvasEl.querySelector(`[data-el-id="${id}"]`);
      if (next) next.classList.add('is-selected');
    }
    onSelectCb(id);
  }

  return {
    init,
    render,
    select,
    loadFrameworkAssets,
    removeFrameworkAssets,
    get selected() { return selectedId; }
  };
})();
