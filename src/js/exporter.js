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
    const bust = `?_t=${Date.now()}`;
    const cssDefs = await loadJson(`frameworks/${project.cssFramework}/elements.json${bust}`) || {};
    const cssCdn = await loadText(`frameworks/${project.cssFramework}/cdn.txt${bust}`) || '';
    const codeManifest = await loadJson(`exporters/${project.codeFramework}/manifest.json${bust}`) || {};
    const codeTemplate = await loadText(`exporters/${project.codeFramework}/template${codeManifest.extension || '.html'}${bust}`) || '{{CONTENT}}';

    const features = { needsModalJs: false };
    const html = renderTree(project.tree, cssDefs, features);
    const headInjection = cssCdn.trim();
    let finalHtml = html;
    if (features.needsModalJs) {
      finalHtml += `\n<script>
function openModal(id){var m=document.getElementById(id);if(m){m.style.display='flex';}}
function closeModal(id){var m=document.getElementById(id);if(m){m.style.display='none';}}
function toggleElement(id){var el=document.getElementById(id);if(el){el.style.display=el.style.display==='none'?'':'none';}}
</script>`;
    }
    const output = codeTemplate
      .replace('{{HEAD}}', headInjection)
      .replace('{{CONTENT}}', finalHtml)
      .replace('{{TITLE}}', project.name || 'Untitled');

    return {
      filename: (project.name || 'page') + (codeManifest.extension || '.html'),
      content: output
    };
  }

  function renderTree(tree, cssDefs, features) {
    return tree.map(el => renderElement(el, cssDefs, features)).join('\n');
  }

  function buttonOnClickAttr(onClick, features) {
    if (!onClick || onClick.action === 'none') return '';
    const target = (onClick.target || '').replace(/'/g, "\\'");
    switch (onClick.action) {
      case 'url':
        return ` onclick="window.location.href='${target}'"`;
      case 'scroll':
        return ` onclick="document.getElementById('${target}').scrollIntoView({behavior:'smooth'})"`;
      case 'open-modal':
        features.needsModalJs = true;
        return ` onclick="openModal('${target}')"`;
      case 'close-modal':
        features.needsModalJs = true;
        return ` onclick="closeModal('${target}')"`;
      case 'toggle':
        features.needsModalJs = true;
        return ` onclick="toggleElement('${target}')"`;
      default:
        return '';
    }
  }

  function renderElement(el, cssDefs, features) {
    features = features || { needsModalJs: false };
    const p = el.props || {};
    const baseCls = cssDefs[el.type] || '';
    const baseForLevel = el.type === 'heading' ? (cssDefs[`heading.${p.level || 1}`] || baseCls) : baseCls;
    const effectiveCls = p.customClass != null ? p.customClass : baseForLevel;
    const classAttr = effectiveCls ? ` class="${effectiveCls}"` : '';
    const colorTarget = ['heading', 'text', 'link'].includes(el.type) ? 'color' : 'background-color';
    const styleAttr = (p.color && el.type !== 'image' && el.type !== 'input')
      ? ` style="${colorTarget}: ${p.color}"`
      : '';

    switch (el.type) {
      case 'heading':
        return `<h${p.level || 1}${classAttr}${styleAttr}>${esc(p.text)}</h${p.level || 1}>`;
      case 'text':
        return `<p${classAttr}${styleAttr}>${esc(p.text)}</p>`;
      case 'button': {
        const onClickAttr = buttonOnClickAttr(p.onClick, features);
        return `<button type="button"${classAttr}${styleAttr}${onClickAttr}>${esc(p.text)}</button>`;
      }
      case 'link':
        return `<a href="${esc(p.href)}"${classAttr}${styleAttr}>${esc(p.text)}</a>`;
      case 'image':
        return `<img src="${esc(p.src)}" alt="${esc(p.alt)}"${classAttr} />`;
      case 'container': {
        const inner = (el.children || []).map(c => renderElement(c, cssDefs, features)).join('\n');
        return `<div${classAttr}${styleAttr}>\n${inner}\n</div>`;
      }
      case 'divider':
        return `<hr${classAttr}${styleAttr} />`;
      case 'input':
        return `<input type="${esc(p.type || 'text')}" placeholder="${esc(p.placeholder)}"${classAttr} />`;
      case 'form': {
        const inner = (el.children || []).map(c => renderElement(c, cssDefs, features)).join('\n');
        return `<form action="${esc(p.action || '#')}" method="${esc(p.method || 'POST')}"${classAttr}${styleAttr}>\n${inner}\n</form>`;
      }
      case 'textarea':
        return `<textarea${classAttr}${styleAttr}${p.name ? ` name="${esc(p.name)}"` : ''} rows="${p.rows || 4}" placeholder="${esc(p.placeholder)}"></textarea>`;
      case 'checkbox':
        return `<label><input type="checkbox"${p.name ? ` name="${esc(p.name)}"` : ''}${p.checked ? ' checked' : ''} /> ${esc(p.label || '')}</label>`;
      case 'radio':
        return `<label><input type="radio"${p.name ? ` name="${esc(p.name)}"` : ''}${p.value ? ` value="${esc(p.value)}"` : ''}${p.checked ? ' checked' : ''} /> ${esc(p.label || '')}</label>`;
      case 'select': {
        const opts = (p.options || []).map(o => `<option>${esc(o)}</option>`).join('\n');
        return `<select${classAttr}${styleAttr}${p.name ? ` name="${esc(p.name)}"` : ''}>\n${opts}\n</select>`;
      }
      case 'modal': {
        features.needsModalJs = true;
        const inner = (el.children || []).map(c => renderElement(c, cssDefs, features)).join('\n');
        const modalId = esc(p.modalId || 'modal_' + Math.random().toString(36).slice(2, 8));
        const dismissAttr = p.dismissable !== false ? ` onclick="if(event.target===this)closeModal('${modalId}')"` : '';
        return `<div id="${modalId}" class="${cssDefs.modal || ''}" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.5);align-items:center;justify-content:center;z-index:100;"${dismissAttr}>\n<div style="background:#fff;padding:24px;border-radius:8px;max-width:520px;width:90%;max-height:90vh;overflow:auto;">\n${p.title ? `<h3 style="margin:0 0 12px;">${esc(p.title)}</h3>` : ''}\n${inner}\n</div>\n</div>`;
      }
      default:
        return `<div${classAttr}${styleAttr}>${esc(el.type)}</div>`;
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
