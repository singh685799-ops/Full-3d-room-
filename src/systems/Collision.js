import * as THREE from 'three';
import { ROOM, PLAYER } from '../core/constants.js';
import { worldBox } from '../world/geom.js';

export class CollisionSystem {
  constructor(room) {
    this.room = room;
    this.objects = [];
  }

  setObjects(list) {
    this.objects = list;
  }

  roomInner() {
    return this.room.innerBounds();
  }

  playerHits(x, z, ignoreDoorOpen = false) {
    const r = PLAYER.radius;
    const box = new THREE.Box3(
      new THREE.Vector3(x - r, 0.08, z - r),
      new THREE.Vector3(x + r, PLAYER.height, z + r)
    );
    const b = this.roomInner();
    if (x - r < b.minX || x + r > b.maxX || z - r < b.minZ || z + r > b.maxZ) {
      if (this.inDoorGap(box) && (ignoreDoorOpen || this.doorIsOpen())) {
        // allow passage through open doorway
      } else {
        return true;
      }
    }
    for (const obj of this.objects) {
      if (!obj.visible || obj.userData.solid === false) continue;
      if (this.tooHigh(obj)) continue;
      const ob = worldBox(obj);
      if (box.intersectsBox(ob)) return true;
    }
    return false;
  }

  tooHigh(obj) {
    const box = worldBox(obj);
    return box.min.y > 1.45;
  }

  doorIsOpen() {
    const act = this.room.door?.userData.actuators?.[0];
    if (!act) return false;
    return Math.abs(act.goal - act.open) < 0.05 || Math.abs(act.current - act.open) > 0.4;
  }

  inDoorGap(box) {
    const d = this.room.doorOpening;
    if (!d) return false;
    return box.max.x > d.min.x && box.min.x < d.max.x && box.max.z > d.min.z && box.min.z < d.max.z;
  }

  placementValid(obj, others) {
    if (!obj) return false;
    const box = worldBox(obj);
    const b = this.roomInner();
    const pad = 0.02;
    if (obj.userData.mount === 'floor') {
      if (box.min.x < b.minX + pad || box.max.x > b.maxX - pad) return false;
      if (box.min.z < b.minZ + pad || box.max.z > b.maxZ - pad) return false;
    }
    if (obj.userData.mount === 'wall') {
      if (box.min.y < 0.2 || box.max.y > ROOM.height - 0.1) return false;
    }
    if (obj.userData.placeSolid === false) return true;
    for (const o of others) {
      if (o === obj || !o.visible || o.userData.placeSolid === false) continue;
      const ob = worldBox(o);
      if (this.ignoreVertical(box, ob) || this.stacked(box, ob)) continue;
      if (box.intersectsBox(ob)) return false;
    }
    return true;
  }

  ignoreVertical(a, b) {
    return a.max.y < b.min.y + 0.03 || b.max.y < a.min.y + 0.03;
  }

  stacked(a, b) {
    const aOnB = a.min.y >= b.max.y - 0.1 && a.min.y <= b.max.y + 0.08;
    const bOnA = b.min.y >= a.max.y - 0.1 && b.min.y <= a.max.y + 0.08;
    return aOnB || bOnA;
  }

  clampToRoom(obj) {
    if (!obj) return;
    const b = this.roomInner();
    if (obj.userData.mount === 'ceiling' || obj.userData.mount === 'floor' || obj.userData.mount === 'wall') {
      obj.position.x = THREE.MathUtils.clamp(obj.position.x, b.minX + 0.08, b.maxX - 0.08);
      obj.position.z = THREE.MathUtils.clamp(obj.position.z, b.minZ + 0.08, b.maxZ - 0.08);
    }
    if (obj.userData.mount === 'floor' && obj.userData.type !== 'rug') {
      obj.position.y = Math.max(0, obj.position.y);
    }
    if (obj.userData.mount === 'ceiling') obj.position.y = ROOM.height;
  }

  resolvePlayer(from, to) {
    if (!this.playerHits(to.x, to.z)) return to;
    const slideX = { x: to.x, z: from.z };
    if (!this.playerHits(slideX.x, slideX.z)) return slideX;
    const slideZ = { x: from.x, z: to.z };
    if (!this.playerHits(slideZ.x, slideZ.z)) return slideZ;
    return from;
  }
}
