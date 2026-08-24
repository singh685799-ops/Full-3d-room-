import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

export function mesh(geo, mat, slot) {
  const m = new THREE.Mesh(geo, mat);
  m.castShadow = true;
  m.receiveShadow = true;
  if (slot) m.userData.slot = slot;
  return m;
}

export function at(obj, x, y, z, rx = 0, ry = 0, rz = 0) {
  obj.position.set(x, y, z);
  if (rx || ry || rz) obj.rotation.set(rx, ry, rz);
  return obj;
}

export function box(w, h, d, mat, slot) {
  return mesh(new THREE.BoxGeometry(w, h, d), mat, slot);
}

export function rbox(w, h, d, r, mat, slot, seg = 2) {
  return mesh(new RoundedBoxGeometry(w, h, d, seg, r), mat, slot);
}

export function cyl(rt, rb, h, mat, slot, seg = 18) {
  return mesh(new THREE.CylinderGeometry(rt, rb, h, seg), mat, slot);
}

export function sphere(r, mat, slot, seg = 16) {
  return mesh(new THREE.SphereGeometry(r, seg, Math.max(10, seg - 2)), mat, slot);
}

export function torus(r, t, mat, slot) {
  return mesh(new THREE.TorusGeometry(r, t, 10, 24), mat, slot);
}

export function plane(w, h, mat, slot) {
  const m = mesh(new THREE.PlaneGeometry(w, h), mat, slot);
  m.castShadow = false;
  return m;
}

export function group(name) {
  const g = new THREE.Group();
  g.name = name;
  return g;
}

export function add(parent, ...children) {
  for (const c of children) parent.add(c);
  return parent;
}

export function leafShape() {
  const s = new THREE.Shape();
  s.moveTo(0, 0);
  s.quadraticCurveTo(0.07, 0.08, 0, 0.2);
  s.quadraticCurveTo(-0.07, 0.08, 0, 0);
  return new THREE.ShapeGeometry(s);
}

export function lathe(pts, mat, slot, seg = 18) {
  const path = pts.map((p) => new THREE.Vector2(p[0], p[1]));
  return mesh(new THREE.LatheGeometry(path, seg), mat, slot);
}

export function computeLocalBox(obj) {
  obj.updateWorldMatrix(true, true);
  const box = new THREE.Box3().setFromObject(obj);
  const inv = obj.matrixWorld.clone().invert();
  box.applyMatrix4(inv);
  return box;
}

export function worldBox(obj) {
  obj.updateWorldMatrix(true, true);
  if (!obj.userData.localBox) obj.userData.localBox = computeLocalBox(obj);
  const box = obj.userData.localBox.clone();
  box.applyMatrix4(obj.matrixWorld);
  return box;
}

export function footprintOf(obj) {
  const box = worldBox(obj);
  const size = box.getSize(new THREE.Vector3());
  return { w: size.x, h: size.y, d: size.z };
}
