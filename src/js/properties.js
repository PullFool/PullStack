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
        fields.push(onClickField(el));
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
      case 'modal':
        fields.push(textField('Title', p.title, v => update(el.id, 'title', v)));
        fields.push(textField('Modal ID', p.modalId, v => update(el.id, 'modalId', v)));
        fields.push(checkboxField('Dismissable (close on overlay click)', p.dismissable !== false, v => update(el.id, 'dismissable', v)));
        break;
    }

    fields.push(classField(el));
    return fields;
  }

  function checkboxField(label, value, onChange) {
    const wrap = document.createElement('label');
    wrap.className = 'field';
    wrap.style.cssText = 'display:flex;align-items:center;gap:8px;cursor:pointer;';
    wrap.innerHTML = `
      <input type="checkbox" style="width:16px;height:16px;accent-color:var(--accent);" />
      <span style="font-size:13px;">${label}</span>
    `;
    const cb = wrap.querySelector('input');
    cb.checked = !!value;
    cb.addEventListener('change', () => onChange(cb.checked));
    return wrap;
  }

  function onClickField(el) {
    const wrap = document.createElement('div');
    wrap.className = 'field';
    const oc = (el.props && el.props.onClick) || { action: 'none', target: '' };

    const actions = [
      { value: 'none', label: 'No action' },
      { value: 'url', label: 'Go to URL' },
      { value: 'scroll', label: 'Scroll to section' },
      { value: 'open-modal', label: 'Open modal' },
      { value: 'close-modal', label: 'Close modal' },
      { value: 'toggle', label: 'Toggle visibility' }
    ];

    wrap.innerHTML = `
      <span class="field-label">On click</span>
      <select class="ps-onclick-action" style="width:100%;background:var(--bg-1);border:1px solid var(--border-strong);border-radius:8px;padding:8px 10px;color:var(--text);font-size:13px;">
        ${actions.map(a => `<option value="${a.value}"${a.value === oc.action ? ' selected' : ''}>${a.label}</option>`).join('')}
      </select>
      <div class="ps-onclick-target" style="margin-top:8px;${oc.action === 'none' ? 'display:none;' : ''}">
        <span class="field-label" style="display:block;margin-bottom:4px;" id="psOnclickTargetLabel">Target</span>
        <input type="text" class="ps-onclick-target-input" placeholder="" style="width:100%;background:var(--bg-1);border:1px solid var(--border-strong);border-radius:8px;padding:8px 10px;color:var(--text);font-size:13px;font-family:ui-monospace,Menlo,monospace;" />
      </div>
    `;

    const sel = wrap.querySelector('.ps-onclick-action');
    const targetWrap = wrap.querySelector('.ps-onclick-target');
    const targetLabel = wrap.querySelector('#psOnclickTargetLabel');
    const targetInput = wrap.querySelector('.ps-onclick-target-input');
    targetInput.value = oc.target || '';

    function updateTargetUI(action) {
      const placeholders = {
        url: 'https://example.com',
        scroll: 'section-id',
        'open-modal': 'modal_xxxxxx',
        'close-modal': 'modal_xxxxxx',
        toggle: 'element-id'
      };
      const labels = {
        url: 'URL',
        scroll: 'Section ID',
        'open-modal': 'Modal ID',
        'close-modal': 'Modal ID',
        toggle: 'Target element ID'
      };
      if (action === 'none') {
        targetWrap.style.display = 'none';
      } else {
        targetWrap.style.display = '';
        targetLabel.textContent = labels[action];
        targetInput.placeholder = placeholders[action];
      }
    }

    updateTargetUI(oc.action);

    sel.addEventListener('change', () => {
      const newAction = sel.value;
      updateTargetUI(newAction);
      update(el.id, 'onClick', { action: newAction, target: targetInput.value });
    });
    targetInput.addEventListener('input', () => {
      update(el.id, 'onClick', { action: sel.value, target: targetInput.value });
    });

    return wrap;
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

    const frag = document.createDocumentFragment();
    const presets = (typeof Canvas !== 'undefined' && Canvas.presetsFor)
      ? Canvas.presetsFor(el)
      : [];

    if (presets.length) {
      const presetWrap = document.createElement('div');
      presetWrap.className = 'field';
      presetWrap.innerHTML = `
        <span class="field-label">Framework presets</span>
        <div class="ps-preset-grid" style="display:grid;grid-template-columns:repeat(2,1fr);gap:6px;"></div>
        <div style="font-size:11px;opacity:0.55;margin-top:6px;line-height:1.4;">
          Click to apply the framework's default style for this variant.
        </div>
      `;
      const grid = presetWrap.querySelector('.ps-preset-grid');
      presets.forEach(p => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'ps-preset-chip';
        chip.title = p.class;
        chip.style.cssText = 'display:flex;align-items:center;gap:6px;background:var(--bg-2);border:1px solid var(--border);color:var(--text);padding:6px 10px;border-radius:8px;font-size:12px;font-weight:600;cursor:pointer;text-align:left;transition:border-color 0.1s,background 0.1s;';
        chip.innerHTML = `
          <span style="width:14px;height:14px;border-radius:50%;background:${p.color};border:1px solid rgba(255,255,255,0.2);flex-shrink:0;"></span>
          <span style="overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.label}</span>
        `;
        chip.addEventListener('click', () => {
          update(el.id, 'customClass', p.class);
          update(el.id, 'color', null);
        });
        chip.addEventListener('mouseenter', () => {
          chip.style.borderColor = 'var(--accent)';
          chip.style.background = 'var(--bg-3)';
        });
        chip.addEventListener('mouseleave', () => {
          chip.style.borderColor = 'var(--border)';
          chip.style.background = 'var(--bg-2)';
        });
        grid.appendChild(chip);
      });
      frag.appendChild(presetWrap);
    }

    const wrap = document.createElement('div');
    wrap.className = 'field';
    const label = target === 'background' ? 'Custom background color' : 'Custom text color';
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
        Overrides any preset above with a custom ${target === 'background' ? 'background' : 'text'} color.
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

    frag.appendChild(wrap);
    return frag;
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
