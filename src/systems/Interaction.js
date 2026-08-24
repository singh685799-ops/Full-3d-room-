import * as THREE from 'three';

export class InteractionSystem {
  constructor(bus) {
    this.bus = bus;
    this.objects = [];
    this.structural = [];
  }

  setTargets(objects, structural) {
    this.objects = objects;
    this.structural = structural;
  }

  toggle(obj) {
    if (!obj) return null;
    const kind = obj.userData.interact;
    if (obj.userData.actuators?.length) {
      const opening = Math.abs(obj.userData.actuators[0].goal - obj.userData.actuators[0].closed) < 1e-3;
      for (const act of obj.userData.actuators) act.goal = opening ? act.open : act.closed;
      this.bus.emit('acted', { obj, kind: kind || 'toggle', open: opening });
      return { kind: kind || 'toggle', open: opening };
    }
    if (kind === 'fan') {
      obj.userData.spinning = !obj.userData.spinning;
      this.bus.emit('acted', { obj, kind, spinning: obj.userData.spinning });
      return { kind, spinning: obj.userData.spinning };
    }
    if (kind === 'lamp' || kind === 'switch') {
      this.bus.emit('toggle-light', obj.userData.lightBind || 'ceiling');
      return { kind, light: obj.userData.lightBind };
    }
    if (kind === 'computer') {
      this.bus.emit('open-ui', { type: 'computer', obj });
      return { kind };
    }
    if (kind === 'clock') {
      this.bus.emit('open-ui', { type: 'clock', obj });
      return { kind };
    }
    if (kind === 'book' || obj.userData.book) {
      this.bus.emit('open-ui', { type: 'book', obj, book: obj.userData.book });
      return { kind: 'book' };
    }
    return null;
  }

  findInteractable(picked) {
    if (!picked) return null;
    let cur = picked;
    while (cur) {
      if (cur.userData?.interact || cur.userData?.actuators || cur.userData?.book) return cur;
      cur = cur.parent;
    }
    return null;
  }

  update(dt) {
    const all = [...this.objects, ...this.structural];
    for (const obj of all) {
      if (obj.userData.spinning && obj.userData.rotor) {
        obj.userData.rotor.rotation.y += dt * 5.5;
      }
      if (obj.userData.actuators) {
        for (const act of obj.userData.actuators) {
          const k = 1 - Math.exp(-act.speed * dt);
          act.current = THREE.MathUtils.lerp(act.current, act.goal, k);
          if (act.type === 'rotate') act.target.rotation[act.axis] = act.current;
          else if (act.type === 'slide') act.target.position[act.axis] = act.current;
        }
      }
    }
  }
}
