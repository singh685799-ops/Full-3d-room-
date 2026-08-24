import * as THREE from 'three';
import { DEFAULT_LIGHTS, ROOM } from '../core/constants.js';

export class LightingSystem {
  constructor(scene) {
    this.scene = scene;
    this.state = structuredClone(DEFAULT_LIGHTS);
    this.group = new THREE.Group();
    this.group.name = 'Lights';
    scene.add(this.group);

    this.hemi = new THREE.HemisphereLight(0xc5d6e8, 0x3d342c, 0.45);
    this.group.add(this.hemi);

    this.sun = new THREE.DirectionalLight(0xfff1d6, 1.4);
    this.sun.position.set(6, 10, 4);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.camera.near = 0.5;
    this.sun.shadow.camera.far = 30;
    this.sun.shadow.camera.left = -8;
    this.sun.shadow.camera.right = 8;
    this.sun.shadow.camera.top = 8;
    this.sun.shadow.camera.bottom = -8;
    this.sun.shadow.bias = -0.00035;
    this.group.add(this.sun);
    this.group.add(this.sun.target);
    this.sun.target.position.set(0, 0, 0);

    this.ambient = new THREE.AmbientLight(0xc9d6e2, 0.2);
    this.group.add(this.ambient);

    this.ceiling = new THREE.SpotLight(0xfff4e0, 0, 12, Math.PI / 2.4, 0.45, 1.2);
    this.ceiling.position.set(0, ROOM.height - 0.12, 0);
    this.ceiling.castShadow = true;
    this.ceiling.shadow.mapSize.set(1024, 1024);
    this.ceiling.target.position.set(0, 0, 0);
    this.group.add(this.ceiling, this.ceiling.target);

    this.desk = new THREE.SpotLight(0xffd7a1, 0, 5.5, 0.7, 0.4, 1.4);
    this.desk.position.set(2.85, 1.22, -1.15);
    this.desk.target.position.set(2.6, 0.74, -1.15);
    this.group.add(this.desk, this.desk.target);

    this.bedsideL = new THREE.PointLight(0xffc98a, 0, 3.4, 1.6);
    this.bedsideL.position.set(-2.35, 1.05, -1.85);
    this.group.add(this.bedsideL);

    this.bedsideR = new THREE.PointLight(0xffc98a, 0, 3.4, 1.6);
    this.bedsideR.position.set(-0.45, 1.05, -1.85);
    this.group.add(this.bedsideR);

    this.floor = new THREE.PointLight(0xffe4bc, 0, 4.5, 1.4);
    this.floor.position.set(2.4, 1.55, 1.7);
    this.group.add(this.floor);

    this.windowA = new THREE.SpotLight(0xcfe4ff, 0, 8, 0.9, 0.6, 1);
    this.windowA.position.set(-1.7, 1.5, -3.3);
    this.windowA.target.position.set(-1.7, 0.8, -1.2);
    this.group.add(this.windowA, this.windowA.target);

    this.windowB = new THREE.SpotLight(0xcfe4ff, 0, 8, 0.9, 0.6, 1);
    this.windowB.position.set(1.5, 1.5, -3.3);
    this.windowB.target.position.set(1.5, 0.8, -1.2);
    this.group.add(this.windowB, this.windowB.target);

    this.map = {
      ceiling: this.ceiling,
      desk: this.desk,
      bedsideL: this.bedsideL,
      bedsideR: this.bedsideR,
      floor: this.floor,
      ambient: this.ambient,
    };
    this.syncArtificial();
  }

  setShadowQuality(level) {
    const on = level !== 'off';
    this.sun.castShadow = on;
    this.ceiling.castShadow = on;
    const size = level === 'high' ? 2048 : 1024;
    this.sun.shadow.mapSize.set(size, size);
    this.ceiling.shadow.mapSize.set(level === 'high' ? 1024 : 512, level === 'high' ? 1024 : 512);
  }

  setLight(id, patch) {
    if (!this.state[id]) return;
    Object.assign(this.state[id], patch);
    this.syncArtificial();
  }

  toggle(id) {
    if (!this.state[id]) return;
    this.state[id].on = !this.state[id].on;
    this.syncArtificial();
    return this.state[id].on;
  }

  syncArtificial() {
    for (const [id, light] of Object.entries(this.map)) {
      const st = this.state[id];
      if (!st) continue;
      light.color.set(st.color);
      const base = id === 'ambient' ? st.intensity * 0.55 : st.intensity * (id === 'ceiling' ? 18 : id === 'desk' ? 10 : 6);
      light.intensity = st.on ? base : 0;
    }
  }

  applyTime(env) {
    this.sun.intensity = env.sunIntensity;
    this.sun.color.set(env.sunColor);
    this.sun.position.copy(env.sunPos);
    this.hemi.intensity = env.hemiIntensity;
    this.hemi.color.set(env.skyColor);
    this.hemi.groundColor.set(env.groundColor);
    this.windowA.intensity = env.windowIntensity;
    this.windowB.intensity = env.windowIntensity;
    this.windowA.color.set(env.windowColor);
    this.windowB.color.set(env.windowColor);
    this.scene.background = new THREE.Color(env.bg);
    if (this.scene.fog) {
      this.scene.fog.color.set(env.bg);
      this.scene.fog.near = env.night ? 10 : 16;
      this.scene.fog.far = env.night ? 28 : 40;
    }
  }

  serialize() {
    return structuredClone(this.state);
  }

  restore(data) {
    if (!data || typeof data !== 'object') return;
    for (const id of Object.keys(this.state)) {
      if (data[id]) Object.assign(this.state[id], data[id]);
    }
    this.syncArtificial();
  }
}
