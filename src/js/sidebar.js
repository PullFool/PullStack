'use strict';

const Sidebar = (() => {
  const palette = [
    { type: 'heading', label: 'Heading', icon: 'H' },
    { type: 'text', label: 'Text', icon: '¶' },
    { type: 'button', label: 'Button', icon: '◼' },
    { type: 'link', label: 'Link', icon: '🔗' },
    { type: 'image', label: 'Image', icon: '🖼' },
    { type: 'container', label: 'Container', icon: '▢' },
    { type: 'divider', label: 'Divider', icon: '—' },
    { type: 'modal', label: 'Modal', icon: '🪟' },
    { type: 'form', label: 'Form', icon: '📋' },
    { type: 'input', label: 'Input', icon: '⌨' },
    { type: 'textarea', label: 'Textarea', icon: '📝' },
    { type: 'checkbox', label: 'Checkbox', icon: '☑' },
    { type: 'radio', label: 'Radio', icon: '🔘' },
    { type: 'select', label: 'Select', icon: '▼' }
  ];

  function render(target) {
    const root = typeof target === 'string' ? document.getElementById(target) : target;
    if (!root) return;
    root.innerHTML = '';
    palette.forEach(el => {
      const tile = document.createElement('div');
      tile.className = 'element-tile';
      tile.draggable = true;
      tile.dataset.elementType = el.type;
      tile.innerHTML = `<span class="icon">${el.icon}</span>${el.label}`;
      tile.addEventListener('dragstart', (ev) => {
        ev.dataTransfer.setData('application/x-pullstack-element', el.type);
        ev.dataTransfer.effectAllowed = 'copy';
      });
      root.appendChild(tile);
    });
  }

  function clear(target) {
    const root = typeof target === 'string' ? document.getElementById(target) : target;
    if (!root) return;
    root.innerHTML = '<div class="empty-state">Create or open a project to start</div>';
  }

  return { render, clear, palette };
})();
