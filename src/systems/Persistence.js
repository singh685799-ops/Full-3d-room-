import { STORAGE_KEY, STORAGE_META } from '../core/constants.js';
import { uid } from '../core/ids.js';

export class Persistence {
  list() {
    return this.readAll().map((r) => ({ id: r.id, name: r.name, updated: r.updated }));
  }

  readAll() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const data = JSON.parse(raw);
      if (!Array.isArray(data)) throw new Error('not an array');
      return data;
    } catch (err) {
      console.warn('[atrium] save store unreadable', err);
      return [];
    }
  }

  writeAll(list) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
      return true;
    } catch (err) {
      console.warn('[atrium] save failed', err);
      return false;
    }
  }

  save(roomData) {
    const all = this.readAll();
    const now = Date.now();
    const rec = {
      id: roomData.id || uid('room'),
      name: roomData.name || 'Untitled room',
      updated: now,
      version: 1,
      data: roomData,
    };
    const idx = all.findIndex((r) => r.id === rec.id);
    if (idx >= 0) all[idx] = rec;
    else all.unshift(rec);
    if (!this.writeAll(all)) return null;
    this.setCurrent(rec.id);
    return rec;
  }

  load(id) {
    const rec = this.readAll().find((r) => r.id === id);
    if (!rec) return null;
    try {
      if (!rec.data || typeof rec.data !== 'object') throw new Error('corrupt');
      this.setCurrent(id);
      return rec;
    } catch (err) {
      console.warn('[atrium] room corrupt', err);
      return null;
    }
  }

  rename(id, name) {
    const all = this.readAll();
    const rec = all.find((r) => r.id === id);
    if (!rec) return false;
    rec.name = name;
    rec.data.name = name;
    rec.updated = Date.now();
    return this.writeAll(all);
  }

  remove(id) {
    return this.writeAll(this.readAll().filter((r) => r.id !== id));
  }

  setCurrent(id) {
    try {
      localStorage.setItem(STORAGE_META, JSON.stringify({ current: id }));
    } catch {
      /* ignore */
    }
  }

  currentId() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_META) || '{}').current || null;
    } catch {
      return null;
    }
  }
}
