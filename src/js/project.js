'use strict';

const Project = (() => {
  let current = null;

  function create({ name, cssFramework, codeFramework }) {
    current = {
      name: name || 'untitled',
      version: 1,
      cssFramework,
      codeFramework,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      tree: [],
      meta: {}
    };
    return current;
  }

  function get() { return current; }

  function set(project) {
    current = project;
  }

  function clear() { current = null; }

  function touch() {
    if (current) current.updatedAt = new Date().toISOString();
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
    return el;
  }

  function removeElement(id) {
    if (!current) return;
    current.tree = removeFromArray(current.tree, id);
    touch();
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
    }
    return el;
  }

  function serialize() {
    return JSON.stringify(current, null, 2);
  }

  function deserialize(json) {
    try {
      current = typeof json === 'string' ? JSON.parse(json) : json;
      return current;
    } catch (e) {
      return null;
    }
  }

  return {
    create, get, set, clear, touch,
    addElement, removeElement, findById, updateElement,
    serialize, deserialize
  };
})();
