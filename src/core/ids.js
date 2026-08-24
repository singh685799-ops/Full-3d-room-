let seq = 1;

export function uid(prefix = 'obj') {
  seq += 1;
  return `${prefix}_${Date.now().toString(36)}_${seq.toString(36)}`;
}

export function bumpFrom(id) {
  const n = Number.parseInt(String(id).split('_').pop(), 36);
  if (Number.isFinite(n) && n >= seq) seq = n + 1;
}

export function resetIds() {
  seq = 1;
}
