import * as THREE from 'three';
import { getTexture } from './textures.js';
import { MATERIAL_TYPES } from '../core/constants.js';

export class MaterialLibrary {
  constructor() {
    this.templates = {};
    this._makeTemplates();
  }

  _makeTemplates() {
    this.templates.wood = new THREE.MeshStandardMaterial({
      color: 0x7a4e2d,
      roughness: 0.48,
      metalness: 0.02,
      map: getTexture('wood', 1),
      roughnessMap: getTexture('woodRough', 1),
    });
    this.templates.metal = new THREE.MeshStandardMaterial({
      color: 0xb7bec6,
      roughness: 0.28,
      metalness: 0.86,
      map: getTexture('metal', 1),
    });
    this.templates.glass = new THREE.MeshPhysicalMaterial({
      color: 0xb9d4e6,
      roughness: 0.05,
      metalness: 0.05,
      transmission: 0.72,
      thickness: 0.12,
      transparent: true,
      opacity: 0.42,
      ior: 1.45,
      envMapIntensity: 1.2,
    });
    this.templates.fabric = new THREE.MeshStandardMaterial({
      color: 0xd5cdc0,
      roughness: 0.86,
      metalness: 0.0,
      map: getTexture('fabric', 1),
    });
    this.templates.plastic = new THREE.MeshStandardMaterial({
      color: 0xd8dce0,
      roughness: 0.42,
      metalness: 0.08,
      map: getTexture('plastic', 1),
    });
    this.templates.ceramic = new THREE.MeshStandardMaterial({
      color: 0xeee4d6,
      roughness: 0.22,
      metalness: 0.04,
      map: getTexture('ceramic', 1),
    });
    this.templates.concrete = new THREE.MeshStandardMaterial({
      color: 0x9c9b97,
      roughness: 0.9,
      metalness: 0.02,
      map: getTexture('concrete', 1),
    });
    this.templates.paint = new THREE.MeshStandardMaterial({
      color: 0xe7e0d4,
      roughness: 0.72,
      metalness: 0.0,
      map: getTexture('paint', 1),
    });
    this.templates.carpet = new THREE.MeshStandardMaterial({
      color: 0x6d4b3a,
      roughness: 0.95,
      metalness: 0.0,
      map: getTexture('carpet', 1),
    });
    this.templates.marble = new THREE.MeshStandardMaterial({
      color: 0xe8e2d8,
      roughness: 0.18,
      metalness: 0.04,
      map: getTexture('marble', 1),
    });
  }

  inst(type, color, extras = {}) {
    const key = MATERIAL_TYPES.includes(type) ? type : 'paint';
    const mat = this.templates[key].clone();
    if (color != null) mat.color = new THREE.Color(color);
    Object.assign(mat, extras);
    return mat;
  }

  applyToMesh(mesh, type, color) {
    if (!mesh || !mesh.isMesh) return;
    const prev = mesh.material;
    const keepMap = prev && prev.map && type === mesh.userData.matType;
    const mat = this.inst(type, color);
    if (keepMap && prev.map) mat.map = prev.map;
    if (mesh.userData.emissive != null) {
      mat.emissive = new THREE.Color(mesh.userData.emissive);
      mat.emissiveIntensity = mesh.userData.emissiveIntensity ?? 0.4;
    }
    mesh.material = mat;
    mesh.userData.matType = type;
  }

  applySlot(root, slot, type, color) {
    root.traverse((ch) => {
      if (ch.isMesh && (ch.userData.slot === slot || (!ch.userData.slot && slot === 'body'))) {
        this.applyToMesh(ch, type, color);
      }
    });
  }

  dispose() {
    for (const m of Object.values(this.templates)) m.dispose();
  }
}
