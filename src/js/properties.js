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

  function colorTargetFor(type) {
    switch (type) {
      case 'button':
      case 'container':
      case 'divider':
        return 'background';
      case 'heading':
      case 'text':
      case 'link':
        return 'foreground';
      default:
        return null;
    }
  }

  function classField(el) {
    const target = colorTargetFor(el.type);
    if (!target) return document.createComment('no color picker for this type');

    const wrap = document.createElement('div');
    wrap.className = 'field';
    const label = target === 'background' ? 'Background color' : 'Text color';
    const current = (el.props && el.props.color) ? el.props.color : '';

    wrap.innerHTML = `
      <span class="field-label">${label}</span>
      <div style="display:flex;gap:8px;align-items:center;">
        <input type="color" class="ps-color-input"
          style="width:48px;height:36px;padding:0;border:1px solid var(--border-strong);border-radius:8px;background:transparent;cursor:pointer;" />
        <input type="text" class="ps-color-hex" maxlength="7" placeholder="#000000"
          style="flex:1;background:var(--bg-1);border:1px solid var(--border-strong);border-radius:8px;padding:8px 10px;color:var(--text);font-size:13px;font-family:ui-monospace,Menlo,monospace;" />
        <button type="button" class="hbtn ps-color-clear" style="font-size:11px;padding:6px 10px;">Clear</button>
      </div>
      <div style="font-size:11px;opacity:0.55;margin-top:6px;line-height:1.4;">
        Sets an inline ${target === 'background' ? 'background-color' : 'color'} that overrides the framework default.
      </div>
    `;

    const picker = wrap.querySelector('.ps-color-input');
    const hex = wrap.querySelector('.ps-color-hex');
    const clearBtn = wrap.querySelector('.ps-color-clear');

    const initial = current || (target === 'background' ? '#3b82f6' : '#111827');
    picker.value = initial;
    hex.value = current || '';

    picker.addEventListener('input', () => {
      hex.value = picker.value;
      update(el.id, 'color', picker.value);
    });
    hex.addEventListener('input', () => {
      const v = hex.value.trim();
      if (/^#[0-9a-fA-F]{6}$/.test(v)) {
        picker.value = v;
        update(el.id, 'color', v);
      } else if (v === '') {
        update(el.id, 'color', null);
      }
    });
    clearBtn.addEventListener('click', () => {
      hex.value = '';
      update(el.id, 'color', null);
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
