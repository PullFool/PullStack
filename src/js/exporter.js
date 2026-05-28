'use strict';

const Exporter = (() => {
  async function loadJson(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function loadText(path) {
    try {
      const res = await fetch(path);
      if (!res.ok) return null;
      return await res.text();
    } catch (e) {
      return null;
    }
  }

  async function listFrameworks() {
    const known = ['tailwind', 'bootstrap', 'bulma', 'daisyui', 'pico', 'vanilla', 'shadcn'];
    const out = [];
    for (const name of known) {
      const manifest = await loadJson(`frameworks/${name}/manifest.json`);
      if (manifest) out.push({ id: name, ...manifest });
    }
    return out;
  }

  async function listExporters() {
    const known = ['html', 'laravel-blade', 'inertia-vue', 'codeigniter', 'wordpress', 'vue', 'react'];
    const out = [];
    for (const name of known) {
      const manifest = await loadJson(`exporters/${name}/manifest.json`);
      if (manifest) out.push({ id: name, ...manifest });
    }
    return out;
  }

  async function exportProject(project) {
    const cssDefs = await loadJson(`frameworks/${project.cssFramework}/elements.json`) || {};
    const cssCdn = await loadText(`frameworks/${project.cssFramework}/cdn.txt`) || '';
    const codeManifest = await loadJson(`exporters/${project.codeFramework}/manifest.json`) || {};
    const codeTemplate = await loadText(`exporters/${project.codeFramework}/template${codeManifest.extension || '.html'}`) || '{{CONTENT}}';

    const html = renderTree(project.tree, cssDefs);
    const headInjection = cssCdn.trim();
    const output = codeTemplate
      .replace('{{HEAD}}', headInjection)
      .replace('{{CONTENT}}', html)
      .replace('{{TITLE}}', project.name || 'Untitled');

    return {
      filename: (project.name || 'page') + (codeManifest.extension || '.html'),
      content: output
    };
  }

  function renderTree(tree, cssDefs) {
    return tree.map(el => renderElement(el, cssDefs)).join('\n');
  }

  function renderElement(el, cssDefs) {
    const p = el.props || {};
    const cls = cssDefs[el.type] || '';
    const clsForLevel = el.type === 'heading' ? (cssDefs[`heading.${p.level || 1}`] || cls) : cls;
    const classAttr = clsForLevel ? ` class="${clsForLevel}"` : '';

    switch (el.type) {
      case 'heading':
        return `<h${p.level || 1}${classAttr}>${esc(p.text)}</h${p.level || 1}>`;
      case 'text':
        return `<p${classAttr}>${esc(p.text)}</p>`;
      case 'button':
        return `<button type="button"${classAttr}>${esc(p.text)}</button>`;
      case 'link':
        return `<a href="${esc(p.href)}"${classAttr}>${esc(p.text)}</a>`;
      case 'image':
        return `<img src="${esc(p.src)}" alt="${esc(p.alt)}"${classAttr} />`;
      case 'container': {
        const inner = (el.children || []).map(c => renderElement(c, cssDefs)).join('\n');
        return `<div${classAttr}>\n${inner}\n</div>`;
      }
      case 'divider':
        return `<hr${classAttr} />`;
      case 'input':
        return `<input type="${esc(p.type || 'text')}" placeholder="${esc(p.placeholder)}"${classAttr} />`;
      default:
        return `<div${classAttr}>${esc(el.type)}</div>`;
    }
  }

  function esc(s) {
    if (s == null) return '';
    return String(s)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function download(filename, content) {
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  return {
    listFrameworks,
    listExporters,
    exportProject,
    download
  };
})();
