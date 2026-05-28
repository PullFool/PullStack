'use strict';

const Updater = (() => {
  const REGISTRY_URL = 'https://raw.githubusercontent.com/PullFool/PullStack/main/registry.json';
  const BASE_URL = 'https://raw.githubusercontent.com/PullFool/PullStack/main';

  function hasFs() {
    return typeof require === 'function';
  }

  async function fetchText(url) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Fetch ${url} failed: ${res.status}`);
    return res.text();
  }

  async function fetchJson(url) {
    const txt = await fetchText(url);
    return JSON.parse(txt);
  }

  async function getRegistry() {
    return fetchJson(REGISTRY_URL + '?_t=' + Date.now());
  }

  async function getLocalManifest(kind, name) {
    try {
      const res = await fetch(`${kind}/${name}/manifest.json?_t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) return null;
      return await res.json();
    } catch (e) {
      return null;
    }
  }

  async function checkUpdates() {
    const registry = await getRegistry();
    const updates = [];

    for (const [name, info] of Object.entries(registry.frameworks || {})) {
      const local = await getLocalManifest('frameworks', name);
      const localVer = local && local.version ? String(local.version) : null;
      if (!localVer) {
        updates.push({ kind: 'frameworks', name, localVer: '(not installed)', remoteVer: info.version, files: info.files, action: 'install' });
      } else if (localVer !== info.version) {
        updates.push({ kind: 'frameworks', name, localVer, remoteVer: info.version, files: info.files, action: 'update' });
      }
    }

    for (const [name, info] of Object.entries(registry.exporters || {})) {
      const local = await getLocalManifest('exporters', name);
      const localVer = local && local.version ? String(local.version) : null;
      if (!localVer) {
        updates.push({ kind: 'exporters', name, localVer: '(not installed)', remoteVer: info.version, files: info.files, action: 'install' });
      } else if (localVer !== info.version) {
        updates.push({ kind: 'exporters', name, localVer, remoteVer: info.version, files: info.files, action: 'update' });
      }
    }

    return { registry, updates };
  }

  async function applyUpdate(entry) {
    if (!hasFs()) {
      throw new Error('Filesystem access not available - app must run in NW.js, not a browser.');
    }
    const fs = require('fs');
    const path = require('path');
    const baseDir = path.join(process.cwd(), entry.kind, entry.name);
    if (!fs.existsSync(baseDir)) {
      fs.mkdirSync(baseDir, { recursive: true });
    }
    const written = [];
    for (const file of entry.files) {
      const remote = `${BASE_URL}/${entry.kind}/${entry.name}/${file}?_t=${Date.now()}`;
      const text = await fetchText(remote);
      fs.writeFileSync(path.join(baseDir, file), text, 'utf8');
      written.push(file);
    }
    return written;
  }

  return { checkUpdates, applyUpdate, hasFs };
})();
