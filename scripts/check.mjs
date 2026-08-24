import { TimeSystem } from '../src/systems/TimeSystem.js';
import { History } from '../src/core/History.js';
import { uid } from '../src/core/ids.js';
import { CATALOG, findCatalog } from '../src/world/catalog.js';
import { CATEGORIES, MATERIAL_TYPES, DEFAULT_LIGHTS, ROOM } from '../src/core/constants.js';
import { DEFAULT_OBJECTS } from '../src/world/defaultLayout.js';

const results = [];
const check = (name, fn) => {
  try {
    const v = fn();
    results.push({ name, ok: v === true, detail: v });
  } catch (err) {
    results.push({ name, ok: false, detail: String(err && err.stack ? err.stack : err) });
  }
};

check('time label noon', () => {
  const t = new TimeSystem();
  t.setHMS(14, 0);
  return t.label() === '14:00';
});

check('night is dark', () => {
  const t = new TimeSystem();
  t.setHMS(2, 0);
  const night = t.evaluate();
  t.setHMS(13, 0);
  const day = t.evaluate();
  return night.night === true && day.night === false && day.sunIntensity > night.sunIntensity;
});

check('smooth dusk transition', () => {
  const t = new TimeSystem();
  t.setHMS(18, 0);
  const a = t.evaluate().sunIntensity;
  t.setHMS(18, 30);
  const b = t.evaluate().sunIntensity;
  return a > b && a > 0.02;
});

check('history undo redo', () => {
  const h = new History();
  let n = 0;
  h.push({ undo: () => { n -= 1; }, redo: () => { n += 1; } });
  h.stack.at(-1).redo();
  const redone = n === 1;
  h.undo();
  const undone = n === 0;
  h.redo();
  return redone && undone && n === 1 && h.canUndo;
});

check('catalog covers categories', () => {
  const cats = new Set(CATALOG.map((c) => c.category));
  return CATEGORIES.every((c) => cats.has(c.id) && CATALOG.filter((i) => i.category === c.id).length >= 3);
});

check('required furniture present', () => {
  const need = ['bed', 'nightstand', 'wardrobe', 'desk', 'officeChair', 'bookshelf', 'sofa', 'rug', 'tallPlant', 'floorLamp', 'clock', 'ceilingFan', 'monitor', 'keyboard', 'mouse', 'desktop', 'painting', 'book'];
  return need.every((id) => findCatalog(id));
});

check('default layout uses known types', () => {
  return DEFAULT_OBJECTS.every((o) => !!findCatalog(o.type));
});

check('materials complete', () => MATERIAL_TYPES.length >= 10);

check('room proportions', () => ROOM.width >= 6 && ROOM.depth >= 5 && ROOM.height >= 2.4);

check('default lights', () => Object.keys(DEFAULT_LIGHTS).length >= 5);

check('ids unique', () => {
  const a = uid();
  const b = uid();
  return a !== b;
});

const failed = results.filter((r) => !r.ok);
console.table(results.map((r) => ({ name: r.name, ok: r.ok, detail: r.ok ? 'ok' : r.detail })));
if (failed.length) {
  console.error(`Failed ${failed.length} checks`);
  process.exit(1);
}
console.log(`All ${results.length} checks passed`);
