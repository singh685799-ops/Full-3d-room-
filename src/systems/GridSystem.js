import * as THREE from 'three';
import { ROOM } from '../core/constants.js';

export class GridSystem {
  constructor(scene) {
    this.scene = scene;
    this.size = 0.25;
    this.grid = new THREE.GridHelper(Math.max(ROOM.width, ROOM.depth), Math.max(ROOM.width, ROOM.depth) / 0.25, 0x4a4338, 0x2a2722);
    this.grid.position.y = 0.002;
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.45;
    scene.add(this.grid);
  }

  setVisible(v) {
    this.grid.visible = v;
  }

  setSize(size) {
    this.size = size;
    this.scene.remove(this.grid);
    this.grid.geometry.dispose();
    const span = Math.max(ROOM.width, ROOM.depth);
    const div = Math.max(2, Math.round(span / size));
    this.grid = new THREE.GridHelper(span, div, 0x4a4338, 0x2a2722);
    this.grid.position.y = 0.002;
    this.grid.material.transparent = true;
    this.grid.material.opacity = 0.45;
    this.scene.add(this.grid);
  }
}
