'use strict';

const Project = (() => {
  let current = null;
  let history = [];
  let historyIndex = -1;
  const MAX_HISTORY = 50;

  function snapshot() {
    if (!current) return;
    history = history.slice(0, historyIndex + 1);
    history.push(JSON.parse(JSON.stringify(current.tree)));
    if (history.length > MAX_HISTORY) {
      history.shift();
    } else {
      historyIndex++;
    }
  }

  function resetHistory() {
    history = [];
    historyIndex = -1;
    snapshot();
  }

  function canUndo() { return historyIndex > 0; }
  function canRedo() { return historyIndex < history.length - 1; }

  function undo() {
    if (!canUndo()) return false;
    historyIndex--;
    current.tree = JSON.parse(JSON.stringify(history[historyIndex]));
    return true;
  }

  function redo() {
    if (!canRedo()) return false;
    historyIndex++;
    current.tree = JSON.parse(JSON.stringify(history[historyIndex]));
    return true;
  }

  function create({ name, cssFramework, codeFramework }) {
    const firstPage = { id: 'page_' + Math.random().toString(36).slice(2, 8), name: 'index', tree: [] };
    current = {
      name: name || 'untitled',
      version: 2,
      cssFramework,
      codeFramework,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      pages: [firstPage],
      activePageId: firstPage.id,
      meta: {}
    };
    Object.defineProperty(current, 'tree', {
      get() {
        const p = current.pages.find(pg => pg.id === current.activePageId);
        return p ? p.tree : [];
      },
      set(v) {
        const p = current.pages.find(pg => pg.id === current.activePageId);
        if (p) p.tree = v;
      },
      configurable: true
    });
    resetHistory();
    return current;
  }

  function migrateLegacy(proj) {
    if (proj.pages) return proj;
    const page = { id: 'page_' + Math.random().toString(36).slice(2, 8), name: 'index', tree: proj.tree || [] };
    proj.pages = [page];
    proj.activePageId = page.id;
    delete proj.tree;
    Object.defineProperty(proj, 'tree', {
      get() {
        const p = proj.pages.find(pg => pg.id === proj.activePageId);
        return p ? p.tree : [];
      },
      set(v) {
        const p = proj.pages.find(pg => pg.id === proj.activePageId);
        if (p) p.tree = v;
      },
      configurable: true
    });
    return proj;
  }

  function addPage(name) {
    if (!current) return null;
    const page = {
      id: 'page_' + Math.random().toString(36).slice(2, 8),
      name: (name || 'untitled').trim() || 'untitled',
      tree: []
    };
    current.pages.push(page);
    current.activePageId = page.id;
    touch();
    snapshot();
    return page;
  }

  function setActivePage(pageId) {
    if (!current) return;
    const page = current.pages.find(p => p.id === pageId);
    if (page) {
      current.activePageId = pageId;
      touch();
    }
  }

  function removePage(pageId) {
    if (!current || current.pages.length <= 1) return false;
    current.pages = current.pages.filter(p => p.id !== pageId);
    if (current.activePageId === pageId) current.activePageId = current.pages[0].id;
    touch();
    snapshot();
    return true;
  }

  function renamePage(pageId, newName) {
    if (!current) return;
    const page = current.pages.find(p => p.id === pageId);
    if (page) {
      page.name = newName.trim() || page.name;
      touch();
    }
  }

  function getPages() {
    return current ? current.pages : [];
  }

  function getActivePage() {
    if (!current) return null;
    return current.pages.find(p => p.id === current.activePageId);
  }

  function get() { return current; }

  function set(project) {
    current = migrateLegacy(project);
    resetHistory();
  }

  function clear() {
    current = null;
    history = [];
    historyIndex = -1;
    clearStorage();
  }

  const STORAGE_KEY = 'pullstack.project';
  let autosaveTimer = null;

  function touch() {
    if (current) current.updatedAt = new Date().toISOString();
    scheduleAutosave();
  }

  function scheduleAutosave() {
    if (autosaveTimer) clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(persistToStorage, 400);
  }

  function persistToStorage() {
    try {
      if (current) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
      }
    } catch (e) { /* localStorage full or unavailable */ }
  }

  function loadFromStorage() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (parsed && (parsed.tree || parsed.pages)) {
        current = migrateLegacy(parsed);
        resetHistory();
        return current;
      }
    } catch (e) { /* corrupt JSON */ }
    return null;
  }

  function clearStorage() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  function addElement(el, parentId = null) {
    if (!current) return null;
    el.id = el.id || ('el_' + Math.random().toString(36).slice(2, 10));
    if (!parentId) {
      current.tree.push(el);
    } else {
      const parent = findById(parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(el);
      }
    }
    touch();
    snapshot();
    return el;
  }

  function removeElement(id) {
    if (!current) return;
    current.tree = removeFromArray(current.tree, id);
    touch();
    snapshot();
  }

  function removeFromArray(arr, id) {
    return arr
      .filter(e => e.id !== id)
      .map(e => {
        if (e.children) e.children = removeFromArray(e.children, id);
        return e;
      });
  }

  function findById(id, arr = null) {
    arr = arr || (current && current.tree) || [];
    for (const el of arr) {
      if (el.id === id) return el;
      if (el.children) {
        const f = findById(id, el.children);
        if (f) return f;
      }
    }
    return null;
  }

  function updateElement(id, patch) {
    const el = findById(id);
    if (el) {
      Object.assign(el, patch);
      touch();
      snapshot();
    }
    return el;
  }

  function detach(id) {
    if (!current) return null;
    let found = null;
    function recurse(arr) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].id === id) {
          found = arr.splice(i, 1)[0];
          return;
        }
        if (arr[i].children) recurse(arr[i].children);
        if (found) return;
      }
    }
    recurse(current.tree);
    return found;
  }

  function isAncestor(possibleAncestorId, descendantId) {
    const node = findById(possibleAncestorId);
    if (!node || !node.children) return false;
    const walk = (arr) => {
      for (const c of arr) {
        if (c.id === descendantId) return true;
        if (c.children && walk(c.children)) return true;
      }
      return false;
    };
    return walk(node.children);
  }

  function reassignIds(node) {
    node.id = 'el_' + Math.random().toString(36).slice(2, 10);
    if (node.children) node.children.forEach(reassignIds);
    if (node.type === 'modal' && node.props) {
      node.props.modalId = 'modal_' + Math.random().toString(36).slice(2, 8);
    }
  }

  function duplicateElement(id) {
    if (!current) return null;
    const original = findById(id);
    if (!original) return null;
    const clone = JSON.parse(JSON.stringify(original));
    reassignIds(clone);

    function appendNextTo(arr, targetId, item) {
      for (let i = 0; i < arr.length; i++) {
        if (arr[i].id === targetId) {
          arr.splice(i + 1, 0, item);
          return true;
        }
        if (arr[i].children && appendNextTo(arr[i].children, targetId, item)) return true;
      }
      return false;
    }
    appendNextTo(current.tree, id, clone);
    touch();
    snapshot();
    return clone;
  }

  function pasteElement(node, parentId) {
    if (!current) return null;
    const clone = JSON.parse(JSON.stringify(node));
    reassignIds(clone);
    if (!parentId) {
      current.tree.push(clone);
    } else {
      const parent = findById(parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(clone);
      } else {
        current.tree.push(clone);
      }
    }
    touch();
    snapshot();
    return clone;
  }

  function moveElement(id, newParentId) {
    if (!current || id === newParentId) return null;
    if (newParentId && isAncestor(id, newParentId)) return null;
    const node = detach(id);
    if (!node) return null;
    if (!newParentId) {
      current.tree.push(node);
    } else {
      const parent = findById(newParentId);
      if (!parent) {
        current.tree.push(node);
      } else {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    }
    touch();
    snapshot();
    return node;
  }

  function serialize() {
    return JSON.stringify(current, null, 2);
  }

  function deserialize(json) {
    try {
      const parsed = typeof json === 'string' ? JSON.parse(json) : json;
      current = migrateLegacy(parsed);
      resetHistory();
      return current;
    } catch (e) {
      return null;
    }
  }

  return {
    create, get, set, clear, touch,
    addElement, removeElement, findById, updateElement,
    moveElement, isAncestor,
    duplicateElement, pasteElement,
    addPage, setActivePage, removePage, renamePage, getPages, getActivePage,
    undo, redo, canUndo, canRedo,
    serialize, deserialize,
    loadFromStorage, persistToStorage, clearStorage
  };
})();
