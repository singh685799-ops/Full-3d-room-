import * as THREE from 'three';
import { findCatalog } from './catalog.js';
import { computeLocalBox } from './geom.js';
import { uid, bumpFrom } from '../core/ids.js';
import { LIMITS } from '../core/constants.js';

export class ObjectFactory {
  constructor(materials) {
    this.materials = materials;
  }

  create(type, overrides = {}) {
    const def = findCatalog(type);
    if (!def) throw new Error(`Unknown object type: ${type}`);
    let root;
    try {
      root = def.build(this.materials);
    } catch (err) {
      console.warn('[atrium] builder failed', type, err);
      root = new THREE.Group();
      root.name = def.name;
      const fallback = new THREE.Mesh(
        new THREE.BoxGeometry(0.4, 0.4, 0.4),
        this.materials.inst('plastic', 0x888888)
      );
      fallback.position.y = 0.2;
      fallback.castShadow = true;
      root.add(fallback);
      root.userData = { type, category: def.category, mount: 'floor', solid: true, placeSolid: true };
    }
    const id = overrides.id || uid();
    bumpFrom(id);
    root.userData.id = id;
    root.userData.type = type;
    root.userData.displayName = overrides.name || def.name;
    root.userData.category = def.category;
    root.userData.mount = root.userData.mount || 'floor';
    root.userData.locked = !!overrides.locked;
    root.userData.selectable = overrides.selectable !== false;
    root.userData.deletable = overrides.deletable !== false;
    root.userData.matType = overrides.matType || root.userData.matType || 'wood';
    root.userData.color = overrides.color || '#8b623d';
    root.userData.minScale = overrides.minScale || LIMITS.minScale;
    root.userData.maxScale = overrides.maxScale || LIMITS.maxScale;
    root.userData.home = null;
    if (overrides.position) root.position.set(overrides.position.x, overrides.position.y, overrides.position.z);
    if (overrides.rotation) root.rotation.set(overrides.rotation.x, overrides.rotation.y, overrides.rotation.z);
    if (overrides.scale) root.scale.set(overrides.scale.x, overrides.scale.y, overrides.scale.z);
    if (overrides.visible === false) root.visible = false;
    if (overrides.state) {
      if (overrides.state.spinning != null) root.userData.spinning = overrides.state.spinning;
      if (overrides.state.lightBind) root.userData.lightBind = overrides.state.lightBind;
      if (overrides.state.actuatorGoals && root.userData.actuators) {
        root.userData.actuators.forEach((a, i) => {
          const goal = overrides.state.actuatorGoals[i];
          if (goal == null) return;
          a.goal = goal;
          a.current = goal;
          if (a.type === 'rotate') a.target.rotation[a.axis] = goal;
          else if (a.type === 'slide') a.target.position[a.axis] = goal;
        });
      }
    }
    root.userData.localBox = computeLocalBox(root);
    root.userData.home = {
      position: root.position.clone(),
      rotation: root.rotation.clone(),
      scale: root.scale.clone(),
    };
    if (overrides.color || overrides.matType) {
      this.materials.applySlot(root, 'body', root.userData.matType, root.userData.color);
    }
    return root;
  }

  serialize(obj) {
    return {
      id: obj.userData.id,
      type: obj.userData.type,
      name: obj.userData.displayName,
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rotation: { x: obj.rotation.x, y: obj.rotation.y, z: obj.rotation.z },
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
      visible: obj.visible,
      locked: !!obj.userData.locked,
      matType: obj.userData.matType,
      color: obj.userData.color,
      state: {
        spinning: !!obj.userData.spinning,
        lightBind: obj.userData.lightBind,
        actuatorGoals: (obj.userData.actuators || []).map((a) => a.goal),
      },
    };
  }
}
