import * as THREE from 'three';

const cache = new Map();

function canvas(size = 512) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  return [c, c.getContext('2d')];
}

function tex(c, repeat = 2) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.needsUpdate = true;
  return t;
}

function dataTex(c, repeat = 2) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(repeat, repeat);
  t.colorSpace = THREE.NoColorSpace;
  t.anisotropy = 4;
  t.needsUpdate = true;
  return t;
}

export function getTexture(kind, seed = 1) {
  const key = `${kind}:${seed}`;
  if (cache.has(key)) return cache.get(key);
  let value;
  switch (kind) {
    case 'wood':
      value = makeWood(seed);
      break;
    case 'woodRough':
      value = makeWoodRough(seed);
      break;
    case 'fabric':
      value = makeFabric(seed);
      break;
    case 'carpet':
      value = makeCarpet(seed);
      break;
    case 'concrete':
      value = makeConcrete(seed);
      break;
    case 'marble':
      value = makeMarble(seed);
      break;
    case 'paint':
      value = makePaint(seed);
      break;
    case 'metal':
      value = makeMetal(seed);
      break;
    case 'ceramic':
      value = makeCeramic(seed);
      break;
    case 'plastic':
      value = makePlastic(seed);
      break;
    case 'art':
      value = makeArt(seed);
      break;
    default:
      value = makePaint(seed);
  }
  cache.set(key, value);
  return value;
}

function makeWood(seed) {
  const [c, ctx] = canvas(512);
  const tones = [
    ['#8b5a32', '#6b4020', '#a56b3c'],
    ['#5c3b22', '#3d2414', '#7a5130'],
    ['#c4a574', '#a88855', '#d8c09a'],
    ['#4a2f22', '#2d1b13', '#6a4533'],
  ];
  const [a, b, d] = tones[seed % tones.length];
  ctx.fillStyle = a;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 90; i++) {
    const x = (i * 37 + seed * 13) % 512;
    ctx.strokeStyle = i % 3 === 0 ? b : d;
    ctx.globalAlpha = 0.12 + ((i * 17) % 10) / 80;
    ctx.lineWidth = 1 + (i % 4);
    ctx.beginPath();
    ctx.moveTo(x, 0);
    for (let y = 0; y <= 512; y += 8) {
      ctx.lineTo(x + Math.sin((y + seed * 20) * 0.04) * 10, y);
    }
    ctx.stroke();
  }
  ctx.globalAlpha = 0.08;
  for (let i = 0; i < 12; i++) {
    ctx.fillStyle = b;
    ctx.beginPath();
    ctx.ellipse((i * 90) % 512, (i * 140) % 512, 18, 8, 0.4, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  return tex(c, 3);
}

function makeWoodRough(seed) {
  const [c, ctx] = canvas(256);
  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 70; i++) {
    ctx.strokeStyle = i % 2 ? '#9a9a9a' : '#6a6a6a';
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    const x = (i * 19 + seed) % 256;
    ctx.moveTo(x, 0);
    ctx.lineTo(x + 4, 256);
    ctx.stroke();
  }
  return dataTex(c, 3);
}

function makeFabric(seed) {
  const [c, ctx] = canvas(256);
  ctx.fillStyle = '#cfc7bb';
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 2) {
    for (let x = 0; x < 256; x += 2) {
      const n = ((x * 13 + y * 7 + seed * 3) % 11) / 11;
      ctx.fillStyle = n > 0.55 ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.08)';
      ctx.fillRect(x, y, 2, 2);
    }
  }
  return tex(c, 6);
}

function makeCarpet(seed) {
  const [c, ctx] = canvas(256);
  ctx.fillStyle = '#6a4a38';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 8000; i++) {
    const x = (i * 47 + seed * 9) % 256;
    const y = (i * 23 + seed * 5) % 256;
    ctx.fillStyle = i % 3 === 0 ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.08)';
    ctx.fillRect(x, y, 1, 2);
  }
  return tex(c, 4);
}

function makeConcrete(seed) {
  const [c, ctx] = canvas(512);
  ctx.fillStyle = '#9a9a96';
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) {
    const x = (i * 91 + seed) % 512;
    const y = (i * 53 + seed * 3) % 512;
    const v = 130 + ((i * 17) % 50);
    ctx.fillStyle = `rgba(${v},${v},${v - 4},0.35)`;
    ctx.fillRect(x, y, 2, 2);
  }
  ctx.strokeStyle = 'rgba(70,70,68,0.18)';
  ctx.lineWidth = 1;
  for (let i = 0; i < 8; i++) {
    ctx.beginPath();
    ctx.moveTo((i * 80) % 512, 0);
    ctx.lineTo(512, (i * 70 + seed * 20) % 512);
    ctx.stroke();
  }
  return tex(c, 2);
}

function makeMarble(seed) {
  const [c, ctx] = canvas(512);
  const grd = ctx.createLinearGradient(0, 0, 512, 512);
  grd.addColorStop(0, '#f3f1ec');
  grd.addColorStop(1, '#ddd6cc');
  ctx.fillStyle = grd;
  ctx.fillRect(0, 0, 512, 512);
  ctx.lineWidth = 2;
  for (let i = 0; i < 18; i++) {
    ctx.strokeStyle = `rgba(120,110,100,${0.12 + (i % 5) / 30})`;
    ctx.beginPath();
    let x = (i * 70 + seed * 11) % 512;
    let y = 0;
    ctx.moveTo(x, y);
    for (let k = 0; k < 20; k++) {
      x += Math.sin(k + i + seed) * 30;
      y += 28;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
  }
  return tex(c, 1.5);
}

function makePaint(seed) {
  const [c, ctx] = canvas(256);
  ctx.fillStyle = '#e8e2d8';
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 2000; i++) {
    const x = (i * 33 + seed) % 256;
    const y = (i * 51 + seed * 2) % 256;
    ctx.fillStyle = i % 2 ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)';
    ctx.fillRect(x, y, 2, 2);
  }
  return tex(c, 2);
}

function makeMetal(seed) {
  const [c, ctx] = canvas(256);
  const g = ctx.createLinearGradient(0, 0, 256, 0);
  g.addColorStop(0, '#9aa0a6');
  g.addColorStop(0.5, '#d5d8dc');
  g.addColorStop(1, '#8d9398');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y++) {
    ctx.fillStyle = `rgba(255,255,255,${((y + seed) % 7) / 90})`;
    ctx.fillRect(0, y, 256, 1);
  }
  return tex(c, 1);
}

function makeCeramic(seed) {
  const [c, ctx] = canvas(256);
  ctx.fillStyle = '#efe6da';
  ctx.fillRect(0, 0, 256, 256);
  ctx.strokeStyle = 'rgba(180,160,140,0.15)';
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.arc(128, 128, 20 + i * 12 + (seed % 5), 0, Math.PI * 2);
    ctx.stroke();
  }
  return tex(c, 1);
}

function makePlastic(seed) {
  const [c, ctx] = canvas(128);
  ctx.fillStyle = '#d0d4d8';
  ctx.fillRect(0, 0, 128, 128);
  ctx.fillStyle = `rgba(255,255,255,${0.08 + (seed % 3) / 40})`;
  ctx.fillRect(0, 20, 128, 18);
  return tex(c, 1);
}

function makeArt(seed) {
  const [c, ctx] = canvas(512);
  const palettes = [
    ['#2b2a28', '#c9a36a', '#7d9b84', '#d9cbb6'],
    ['#1d2a36', '#c47b5a', '#e8d7c0', '#6b8ea3'],
    ['#3a2a24', '#8c5a3c', '#d8c3a5', '#5f6f55'],
    ['#242628', '#9aa7b0', '#e4ddd2', '#b08a62'],
  ];
  const p = palettes[seed % palettes.length];
  ctx.fillStyle = p[0];
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 7; i++) {
    ctx.fillStyle = p[(i + seed) % p.length];
    ctx.globalAlpha = 0.75;
    const x = ((i * 97 + seed * 20) % 400) + 20;
    const y = ((i * 61 + seed * 13) % 400) + 20;
    ctx.fillRect(x, y, 80 + (i * 23) % 160, 40 + (i * 41) % 180);
  }
  ctx.globalAlpha = 1;
  const t = tex(c, 1);
  t.repeat.set(1, 1);
  return t;
}

export function disposeTextures() {
  for (const t of cache.values()) t.dispose?.();
  cache.clear();
}
