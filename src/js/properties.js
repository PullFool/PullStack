'use strict';

const Properties = (() => {
  let bodyEl = null;
  let onChangeCb = null;

  function init(target, opts = {}) {
    bodyEl = typeof target === 'string' ? document.getElementById(target) : target;
    onChangeCb = opts.onChange || (() => {});
  }

  function show(elId) {
    if (!bodyEl) return;
    if (!elId) {
      bodyEl.innerHTML = '<div class="empty-state">Select an element to edit its properties</div>';
      return;
    }
    const el = Project.findById(elId);
    if (!el) return;
    bodyEl.innerHTML = '';
    renderFields(el).forEach(f => bodyEl.appendChild(f));
    const removeBtn = document.createElement('button');
    removeBtn.className = 'hbtn';
    removeBtn.style.marginTop = '12px';
    removeBtn.style.width = '100%';
    removeBtn.textContent = '🗑 Delete element';
    removeBtn.addEventListener('click', () => {
      Project.removeElement(elId);
      onChangeCb({ type: 'remove', id: elId });
    });
    bodyEl.appendChild(removeBtn);
  }

  function renderFields(el) {
    const p = el.props || {};
    const fields = [];

    switch (el.type) {
      case 'heading':
        fields.push(textField('Text', p.text, v => update(el.id, 'text', v)));
        fields.push(selectField('Level', String(p.level || 1), ['1', '2', '3', '4', '5', '6'], v => update(el.id, 'level', parseInt(v, 10))));
        break;
      case 'text':
        fields.push(textareaField('Text', p.text, v => update(el.id, 'text', v)));
        break;
      case 'button':
        fields.push(textField('Text', p.text, v => update(el.id, 'text', v)));
        break;
      case 'link':
        fields.push(textField('Text', p.text, v => update(el.id, 'text', v)));
        fields.push(textField('URL', p.href, v => update(el.id, 'href', v)));
        break;
      case 'image':
        fields.push(textField('Source', p.src, v => update(el.id, 'src', v)));
        fields.push(textField('Alt text', p.alt, v => update(el.id, 'alt', v)));
        break;
      case 'input':
        fields.push(textField('Placeholder', p.placeholder, v => update(el.id, 'placeholder', v)));
        fields.push(selectField('Type', p.type || 'text', ['text', 'email', 'password', 'number', 'tel', 'url'], v => update(el.id, 'type', v)));
        break;
      case 'container':
      case 'divider':
        break;
    }

    fields.push(classField(el));
    return fields;
  }

  function classField(el) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const defaultClass = (window.Canvas && Canvas.defaultClassFor)
      ? Canvas.defaultClassFor(el)
      : '';
    const current = (el.props && el.props.customClass != null)
      ? el.props.customClass
      : defaultClass;

    wrap.innerHTML = `
      <span class="field-label">CSS classes</span>
      <textarea class="ps-class-input"
        style="width:100%;min-height:64px;background:var(--bg-1);border:1px solid var(--border-strong);border-radius:8px;padding:10px 12px;color:var(--text);font-size:13px;font-family:ui-monospace,Menlo,monospace;resize:vertical;"
        spellcheck="false"></textarea>
      <div style="display:flex;gap:6px;margin-top:6px;">
        <button type="button" class="hbtn ps-class-reset" style="flex:1;font-size:11px;padding:4px 8px;">Reset to default</button>
      </div>
      <div style="font-size:11px;opacity:0.55;margin-top:6px;line-height:1.5;">
        Edit to restyle. Type any framework utility / component class. Empty = no class.
      </div>
    `;
    const ta = wrap.querySelector('.ps-class-input');
    ta.value = current || '';
    ta.addEventListener('input', () => {
      update(el.id, 'customClass', ta.value);
    });
    wrap.querySelector('.ps-class-reset').addEventListener('click', () => {
      update(el.id, 'customClass', null);
      ta.value = defaultClass || '';
    });
    return wrap;
  }

  function update(elId, key, value) {
    const el = Project.findById(elId);
    if (!el) return;
    el.props = el.props || {};
    el.props[key] = value;
    Project.touch();
    onChangeCb({ type: 'update', id: elId, key, value });
  }

  function textField(label, value, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    wrap.innerHTML = `<span class="field-label">${label}</span><input type="text" />`;
    const input = wrap.querySelector('input');
    input.value = value || '';
    input.addEventListener('input', () => onChange(input.value));
    return wrap;
  }

  function textareaField(label, value, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    wrap.innerHTML = `<span class="field-label">${label}</span><textarea style="width:100%;min-height:80px;background:var(--bg-1);border:1px solid var(--border-strong);border-radius:8px;padding:10px 12px;color:var(--text);font-size:14px;font-family:inherit;resize:vertical;"></textarea>`;
    const input = wrap.querySelector('textarea');
    input.value = value || '';
    input.addEventListener('input', () => onChange(input.value));
    return wrap;
  }

  function selectField(label, value, options, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    wrap.innerHTML = `<span class="field-label">${label}</span><select></select>`;
    const sel = wrap.querySelector('select');
    options.forEach(opt => {
      const o = document.createElement('option');
      o.value = opt;
      o.textContent = opt;
      sel.appendChild(o);
    });
    sel.value = value;
    sel.addEventListener('change', () => onChange(sel.value));
    return wrap;
  }

  function noteField(text) {
    const wrap = document.createElement('div');
    wrap.className = 'empty-state';
    wrap.textContent = text;
    return wrap;
  }

  return { init, show };
})();
