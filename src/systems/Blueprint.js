import * as THREE from 'three';

export class BlueprintSystem {
  constructor(scene, hud) {
    this.scene = scene;
    this.hud = hud;
    this.active = false;
    this.labels = [];
    this.saved = null;
  }

  set(on, objects, room) {
    if (on === this.active) {
      if (on) this.relayout(objects);
      return;
    }
    this.active = on;
    if (on) this.enter(objects, room);
    else this.exit();
  }

  enter(objects, room) {
    this.saved = {
      bg: this.scene.background ? this.scene.background.clone() : null,
      fog: this.scene.fog ? this.scene.fog.clone() : null,
    };
    this.room = room;
    this.scene.background = new THREE.Color(0x10263a);
    this.scene.fog = null;
    if (room?.ceiling) room.ceiling.visible = false;
    const roots = [room?.root, ...objects].filter(Boolean);
    for (const root of roots) {
      root.traverse((ch) => {
        if (!ch.isMesh || ch.userData.sky || ch.userData._bpMat) return;
        ch.userData._bpMat = ch.material;
        ch.material = new THREE.MeshLambertMaterial({
          color: ch.userData.structural ? 0x7ec8e3 : 0xd7b57a,
          emissive: ch.userData.structural ? 0x12344a : 0x2a2214,
          side: THREE.DoubleSide,
        });
      });
    }
    this.relayout(objects);
  }

  relayout(objects) {
    this.clearLabels();
    if (!this.hud) return;
    for (const obj of objects) {
      if (!obj.visible) continue;
      const el = document.createElement('div');
      el.className = 'bp-label';
      el.textContent = obj.userData.displayName || obj.userData.type;
      this.hud.appendChild(el);
      this.labels.push({ el, obj });
    }
  }

  update(camera, renderer) {
    if (!this.active) return;
    const rect = renderer.domElement.getBoundingClientRect();
    const hud = this.hud.getBoundingClientRect();
    for (const { el, obj } of this.labels) {
      const p = obj.position.clone();
      p.y = 0.02;
      p.project(camera);
      const x = (p.x * 0.5 + 0.5) * rect.width + (rect.left - hud.left);
      const y = (-p.y * 0.5 + 0.5) * rect.height + (rect.top - hud.top);
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      el.style.display = p.z > 1 ? 'none' : 'block';
    }
  }

  exit() {
    this.clearLabels();
    if (this.saved?.bg) this.scene.background = this.saved.bg;
    if (this.saved?.fog) this.scene.fog = this.saved.fog;
    this.scene.traverse((ch) => {
      if (ch.isMesh && ch.userData._bpMat) {
        ch.material = ch.userData._bpMat;
        delete ch.userData._bpMat;
      }
      if (ch.name === 'Room') {
        /* ceiling restored by app */
      }
    });
    this.saved = null;
  }

  clearLabels() {
    for (const { el } of this.labels) el.remove();
    this.labels = [];
  }
}
