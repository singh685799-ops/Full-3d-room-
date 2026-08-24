import { CATEGORIES, MATERIAL_TYPES, MATERIAL_LABELS, DEFAULT_LIGHTS } from '../core/constants.js';
import { CATALOG } from '../world/catalog.js';

export class UI {
  constructor(bus) {
    this.bus = bus;
    this.cat = 'bedroom';
    this.placeType = null;
    this.bindChrome();
    this.renderLibrary();
    this.fillMaterialSelects();
    this.renderLights(DEFAULT_LIGHTS);
  }

  bindChrome() {
    document.querySelectorAll('#leftbar .side-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#leftbar .side-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-library').classList.toggle('hidden', btn.dataset.tab !== 'library');
        document.getElementById('tab-scene').classList.toggle('hidden', btn.dataset.tab !== 'scene');
      });
    });
    document.querySelectorAll('#rightbar .side-tab').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('#rightbar .side-tab').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('rtab-inspect').classList.toggle('hidden', btn.dataset.rtab !== 'inspect');
        document.getElementById('rtab-room').classList.toggle('hidden', btn.dataset.rtab !== 'room');
        document.getElementById('rtab-lights').classList.toggle('hidden', btn.dataset.rtab !== 'lights');
      });
    });
    document.getElementById('btn-lib-toggle')?.addEventListener('click', () => {
      document.getElementById('leftbar').classList.toggle('open');
      document.getElementById('rightbar').classList.remove('open');
    });
    document.getElementById('btn-insp-toggle')?.addEventListener('click', () => {
      document.getElementById('rightbar').classList.toggle('open');
      document.getElementById('leftbar').classList.remove('open');
    });
    document.getElementById('viewport')?.addEventListener('pointerdown', () => {
      if (innerWidth < 980) {
        document.getElementById('leftbar').classList.remove('open');
        document.getElementById('rightbar').classList.remove('open');
      }
    });
    document.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => this.closeModals()));
    document.getElementById('overlay').addEventListener('click', () => this.closeModals());
    document.getElementById('fatal-reload')?.addEventListener('click', () => location.reload());
  }

  renderLibrary() {
    const cats = document.getElementById('lib-cats');
    cats.innerHTML = '';
    for (const c of CATEGORIES) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `cat-btn${c.id === this.cat ? ' active' : ''}`;
      b.textContent = c.label;
      b.addEventListener('click', () => {
        this.cat = c.id;
        this.renderLibrary();
      });
      cats.appendChild(b);
    }
    const grid = document.getElementById('lib-items');
    grid.innerHTML = '';
    for (const item of CATALOG.filter((i) => i.category === this.cat)) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'lib-item';
      b.draggable = true;
      b.dataset.type = item.id;
      b.innerHTML = `<span class="ico">${iconFor(item.category)}</span><span class="nm">${item.name}</span>`;
      b.addEventListener('click', () => this.bus.emit('library-pick', item.id));
      b.addEventListener('dragstart', (e) => {
        e.dataTransfer.setData('text/plain', item.id);
        e.dataTransfer.effectAllowed = 'copy';
      });
      grid.appendChild(b);
    }
  }

  setPlacing(type) {
    this.placeType = type;
    document.querySelectorAll('.lib-item').forEach((el) => {
      el.classList.toggle('placing', el.dataset.type === type);
    });
    const banner = document.getElementById('place-banner');
    if (type) {
      banner.textContent = `Placing ${type} — click in the room · Esc to cancel`;
      banner.classList.remove('hidden');
    } else {
      banner.classList.add('hidden');
    }
  }

  fillMaterialSelects() {
    for (const id of ['ins-mat', 'wall-mat', 'floor-mat']) {
      const sel = document.getElementById(id);
      sel.innerHTML = MATERIAL_TYPES.map((t) => `<option value="${t}">${MATERIAL_LABELS[t]}</option>`).join('');
    }
  }

  renderLights(state) {
    const host = document.getElementById('light-controls');
    host.innerHTML = '';
    for (const [id, st] of Object.entries(state)) {
      const card = document.createElement('div');
      card.className = 'light-card';
      card.innerHTML = `
        <header>
          <span>${st.name}</span>
          <label class="check" style="margin:0"><input type="checkbox" data-light="${id}" ${st.on ? 'checked' : ''}/><span>On</span></label>
        </header>
        <label class="field"><span>Intensity</span><input type="range" min="0" max="200" value="${Math.round(st.intensity * 100)}" data-lint="${id}" /></label>
        <label class="field"><span>Color</span><input type="color" value="${toHex(st.color)}" data-lcol="${id}" /></label>
      `;
      host.appendChild(card);
    }
    host.querySelectorAll('[data-light]').forEach((el) => {
      el.addEventListener('change', () => this.bus.emit('light-edit', { id: el.dataset.light, on: el.checked }));
    });
    host.querySelectorAll('[data-lint]').forEach((el) => {
      el.addEventListener('input', () => this.bus.emit('light-edit', { id: el.dataset.lint, intensity: Number(el.value) / 100 }));
    });
    host.querySelectorAll('[data-lcol]').forEach((el) => {
      el.addEventListener('input', () => this.bus.emit('light-edit', { id: el.dataset.lcol, color: el.value }));
    });
  }

  inspect(obj) {
    const empty = document.getElementById('inspector-empty');
    const pane = document.getElementById('inspector');
    if (!obj) {
      empty.classList.remove('hidden');
      pane.classList.add('hidden');
      return;
    }
    empty.classList.add('hidden');
    pane.classList.remove('hidden');
    document.getElementById('ins-name').value = obj.userData.displayName || obj.name || '';
    document.getElementById('ins-px').value = obj.position.x.toFixed(2);
    document.getElementById('ins-py').value = obj.position.y.toFixed(2);
    document.getElementById('ins-pz').value = obj.position.z.toFixed(2);
    document.getElementById('ins-rx').value = deg(obj.rotation.x);
    document.getElementById('ins-ry').value = deg(obj.rotation.y);
    document.getElementById('ins-rz').value = deg(obj.rotation.z);
    document.getElementById('ins-sx').value = obj.scale.x.toFixed(2);
    document.getElementById('ins-sy').value = obj.scale.y.toFixed(2);
    document.getElementById('ins-sz').value = obj.scale.z.toFixed(2);
    document.getElementById('ins-mat').value = obj.userData.matType || 'wood';
    document.getElementById('ins-color').value = toHex(obj.userData.color || '#888888');
    document.getElementById('ins-vis').checked = obj.visible;
    document.getElementById('ins-lock').checked = !!obj.userData.locked;
  }

  sceneList(objects, selectedId) {
    const host = document.getElementById('scene-list');
    host.innerHTML = '';
    for (const obj of objects) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = `scene-row${obj.userData.id === selectedId ? ' active' : ''}`;
      b.innerHTML = `<span class="dot"></span>${obj.userData.displayName || obj.userData.type}`;
      b.addEventListener('click', () => this.bus.emit('scene-pick', obj.userData.id));
      host.appendChild(b);
    }
  }

  setTimeLabel(text) {
    document.getElementById('time-label').textContent = text;
  }

  setExposureLabel(v) {
    document.getElementById('exp-label').textContent = v.toFixed(2);
  }

  setMode(mode) {
    document.querySelectorAll('[data-cam]').forEach((b) => b.classList.toggle('active', b.dataset.cam === mode));
    document.getElementById('status-mode').textContent = labelMode(mode);
    document.getElementById('crosshair').classList.toggle('hidden', mode !== 'fps');
  }

  setGizmo(mode) {
    document.querySelectorAll('[data-gizmo]').forEach((b) => b.classList.toggle('active', b.dataset.gizmo === mode));
  }

  setUndo(canU, canR) {
    document.getElementById('btn-undo').disabled = !canU;
    document.getElementById('btn-redo').disabled = !canR;
  }

  setStats(n) {
    document.getElementById('status-objs').textContent = `${n} objects`;
  }

  perf(s) {
    document.getElementById('perf-fps').textContent = s.fps || '--';
    document.getElementById('perf-info').innerHTML =
      `${s.calls ?? '–'} calls<br>${s.triangles ?? '–'} tris<br>${s.objects} objects<br>${s.mode}<br>${escapeHtml(s.gpu).slice(0, 42)}`;
  }

  hint(text) {
    const el = document.getElementById('hint');
    el.textContent = text || '';
    el.classList.toggle('show', !!text);
  }

  toast(text) {
    const host = document.getElementById('toasts');
    const el = document.createElement('div');
    el.className = 'toast';
    el.textContent = text;
    host.appendChild(el);
    setTimeout(() => el.remove(), 2800);
  }

  boot(p, msg) {
    document.getElementById('boot-fill').style.width = `${Math.round(p * 100)}%`;
    if (msg) document.getElementById('boot-msg').textContent = msg;
  }

  ready() {
    document.getElementById('boot').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
  }

  fatal(msg) {
    document.getElementById('boot').classList.add('hidden');
    document.getElementById('fatal').classList.remove('hidden');
    document.getElementById('fatal-msg').textContent = msg;
  }

  openModal(id) {
    document.getElementById('overlay').classList.remove('hidden');
    document.getElementById('modal-root').classList.remove('hidden');
    document.querySelectorAll('#modal-root .modal').forEach((m) => m.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
  }

  closeModals() {
    document.getElementById('overlay').classList.add('hidden');
    document.getElementById('modal-root').classList.add('hidden');
    document.querySelectorAll('#modal-root .modal').forEach((m) => m.classList.add('hidden'));
  }

  renderSaves(list, onLoad, onDel, onRename) {
    const host = document.getElementById('save-list');
    host.innerHTML = '';
    if (!list.length) {
      host.innerHTML = '<p class="muted">No saved rooms yet.</p>';
      return;
    }
    for (const rec of list) {
      const row = document.createElement('div');
      row.className = 'save-row';
      const when = new Date(rec.updated).toLocaleString();
      row.innerHTML = `<b>${escapeHtml(rec.name)}</b><span class="muted">${escapeHtml(when)}</span>`;
      const load = document.createElement('button');
      load.className = 'text-btn';
      load.textContent = 'Open';
      load.addEventListener('click', () => onLoad(rec.id));
      const ren = document.createElement('button');
      ren.className = 'text-btn';
      ren.textContent = 'Rename';
      ren.addEventListener('click', () => {
        const name = prompt('Room name', rec.name);
        if (name) onRename(rec.id, name);
      });
      const del = document.createElement('button');
      del.className = 'text-btn danger';
      del.textContent = 'Delete';
      del.addEventListener('click', () => onDel(rec.id));
      row.append(load, ren, del);
      host.appendChild(row);
    }
  }

  setMobile(on) {
    document.getElementById('joystick').classList.toggle('hidden', !on);
    document.getElementById('look-hint').classList.toggle('hidden', !on);
  }

  showBook(book) {
    document.getElementById('book-title').textContent = book?.title || 'Book';
    document.getElementById('book-author').textContent = book?.author ? `by ${book.author}` : '';
    document.getElementById('book-blurb').textContent = book?.blurb || 'A well-thumbed volume.';
    this.openModal('modal-book');
  }

  showClock(label) {
    document.getElementById('clock-big').textContent = label;
    this.openModal('modal-clock');
  }

  showComputer(state, handlers) {
    this.openModal('modal-computer');
    const body = document.getElementById('os-body');
    const render = (tab) => {
      if (tab === 'notes') {
        body.innerHTML = `<p>ATRIUM OS · studio notes</p><p>Walk the room, click objects, or place furniture from the library. Double-click doors, windows, lamps, the fan, and the wardrobe.</p>`;
      } else if (tab === 'lights') {
        body.innerHTML = Object.entries(state.lights)
          .map(([id, l]) => `<p>${l.name}: <button type="button" class="text-btn" data-osl="${id}">${l.on ? 'On' : 'Off'}</button></p>`)
          .join('');
        body.querySelectorAll('[data-osl]').forEach((b) => b.addEventListener('click', () => handlers.toggle(b.dataset.osl)));
      } else {
        body.innerHTML = `<p><b>${escapeHtml(state.name)}</b></p><p>Time ${state.time}</p><p>${state.count} placed objects</p>`;
      }
    };
    document.querySelectorAll('[data-os]').forEach((b) => {
      b.onclick = () => render(b.dataset.os);
    });
    render('notes');
  }
}

function deg(r) {
  return (r * 180) / Math.PI;
}

export function rad(d) {
  return (d * Math.PI) / 180;
}

function toHex(c) {
  if (!c) return '#888888';
  if (typeof c === 'string' && c.startsWith('#')) return c.length === 7 ? c : '#888888';
  try {
    const n = typeof c === 'number' ? c : parseInt(String(c).replace('#', ''), 16);
    return `#${n.toString(16).padStart(6, '0')}`.slice(0, 7);
  } catch {
    return '#888888';
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[ch]));
}

function labelMode(m) {
  return ({ orbit: 'Orbit', fps: 'Walk', top: 'Top', front: 'Front', side: 'Side', blueprint: 'Blueprint' }[m] || m);
}

function iconFor(cat) {
  const map = {
    bedroom: '▣',
    living: '▭',
    office: '▤',
    lighting: '☼',
    decoration: '◈',
    electronics: '▣',
    plants: '❧',
  };
  return map[cat] || '□';
}
