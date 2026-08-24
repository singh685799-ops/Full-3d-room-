import * as THREE from 'three';
import { TransformControls } from 'three/addons/controls/TransformControls.js';
export class SelectionSystem {
  constructor(scene, camera, renderer, collision, history, bus) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.collision = collision;
    this.history = history;
    this.bus = bus;
    this.selected = null;
    this.objects = [];
    this.gizmoMode = 'translate';
    this.snap = true;
    this.gridSize = 0.25;
    this.rotSnap = 45;
    this.enabled = true;

    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.outline = new THREE.BoxHelper(new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1)), 0xc9a36a);
    this.outline.visible = false;
    scene.add(this.outline);

    this.invalidMat = new THREE.MeshBasicMaterial({ color: 0xc45c4a, transparent: true, opacity: 0.28, depthTest: false });
    this.ghost = null;
    this.invalid = false;
    this.dragStart = null;

    this.transform = new TransformControls(camera, renderer.domElement);
    this.transform.setSize(0.85);
    this.transform.addEventListener('dragging-changed', (e) => {
      this.bus.emit('gizmo-drag', e.value);
      if (e.value) this.captureStart();
      else this.commitTransform();
    });
    this.transform.addEventListener('objectChange', () => this.onGizmoChange());
    this.gizmoRoot = this.transform.getHelper ? this.transform.getHelper() : this.transform;
    scene.add(this.gizmoRoot);
    this.setMode('translate');
  }

  setCamera(cam) {
    this.camera = cam;
    this.transform.camera = cam;
  }

  setObjects(list) {
    this.objects = list;
  }

  setMode(mode) {
    this.gizmoMode = mode;
    this.transform.setMode(mode);
    this.applySnap();
  }

  applySnap() {
    if (this.snap) {
      this.transform.setTranslationSnap(this.gridSize);
      this.transform.setRotationSnap(THREE.MathUtils.degToRad(this.rotSnap));
      this.transform.setScaleSnap(0.05);
    } else {
      this.transform.setTranslationSnap(null);
      this.transform.setRotationSnap(null);
      this.transform.setScaleSnap(null);
    }
  }

  setSnap(v) {
    this.snap = v;
    this.applySnap();
  }

  pick(event, structural = []) {
    if (!this.enabled) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const pool = [...this.objects, ...structural];
    const hits = this.raycaster.intersectObjects(pool, true);
    for (const hit of hits) {
      const root = this.findRoot(hit.object, pool);
      if (root && root.userData.selectable !== false) return { root, hit };
    }
    return null;
  }

  findRoot(obj, pool) {
    let cur = obj;
    while (cur) {
      if (pool.includes(cur)) return cur;
      cur = cur.parent;
    }
    return null;
  }

  select(obj) {
    if (obj && obj.userData.locked && this.selected === obj) return;
    this.selected = obj || null;
    if (obj && obj.userData.selectable !== false && !obj.userData.locked) {
      this.transform.attach(obj);
      this.gizmoRoot.visible = true;
    } else {
      this.transform.detach();
      this.gizmoRoot.visible = false;
    }
    this.refreshOutline();
    this.bus.emit('select', obj);
  }

  clear() {
    this.select(null);
  }

  refreshOutline() {
    if (!this.selected || !this.selected.visible) {
      this.outline.visible = false;
      return;
    }
    this.outline.setFromObject(this.selected);
    this.outline.visible = true;
    this.outline.material.color.set(this.invalid ? 0xc45c4a : 0xc9a36a);
  }

  captureStart() {
    if (!this.selected) return;
    this.dragStart = this.snapshot(this.selected);
  }

  snapshot(obj) {
    return {
      id: obj.userData.id,
      position: obj.position.clone(),
      rotation: obj.rotation.clone(),
      scale: obj.scale.clone(),
    };
  }

  onGizmoChange() {
    const obj = this.selected;
    if (!obj) return;
    if (this.transform.getMode() === 'scale') {
      const min = obj.userData.minScale || 0.5;
      const max = obj.userData.maxScale || 1.8;
      obj.scale.x = THREE.MathUtils.clamp(obj.scale.x, min, max);
      obj.scale.y = THREE.MathUtils.clamp(obj.scale.y, min, max);
      obj.scale.z = THREE.MathUtils.clamp(obj.scale.z, min, max);
    }
    this.collision.clampToRoom(obj);
    obj.userData.localBox = null;
    this.invalid = !this.collision.placementValid(obj, this.objects);
    this.refreshOutline();
    this.bus.emit('transform', obj);
  }

  commitTransform() {
    const obj = this.selected;
    if (!obj || !this.dragStart) return;
    if (this.invalid) {
      obj.position.copy(this.dragStart.position);
      obj.rotation.copy(this.dragStart.rotation);
      obj.scale.copy(this.dragStart.scale);
      this.invalid = false;
      this.refreshOutline();
      this.bus.emit('invalid-placement', obj);
    } else {
      const before = this.dragStart;
      const after = this.snapshot(obj);
      if (!this.same(before, after)) {
        this.history.push({
          label: 'Transform',
          undo: () => this.applySnapShot(obj, before),
          redo: () => this.applySnapShot(obj, after),
        });
      }
      this.bus.emit('transform-commit', obj);
    }
    this.dragStart = null;
    this.refreshOutline();
  }

  applySnapShot(obj, snap) {
    if (!obj) return;
    obj.position.copy(snap.position);
    obj.rotation.copy(snap.rotation);
    obj.scale.copy(snap.scale);
    this.refreshOutline();
    this.bus.emit('transform', obj);
  }

  same(a, b) {
    return (
      a.position.distanceTo(b.position) < 1e-4 &&
      Math.abs(a.rotation.x - b.rotation.x) < 1e-4 &&
      Math.abs(a.rotation.y - b.rotation.y) < 1e-4 &&
      Math.abs(a.rotation.z - b.rotation.z) < 1e-4 &&
      a.scale.distanceTo(b.scale) < 1e-4
    );
  }

  floorPoint(event) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
    const hit = new THREE.Vector3();
    if (this.raycaster.ray.intersectPlane(plane, hit)) return hit;
    return null;
  }

  wallPoint(event, walls) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(walls, true);
    return hits[0] || null;
  }

  snapVec(v) {
    if (!this.snap) return v;
    v.x = Math.round(v.x / this.gridSize) * this.gridSize;
    v.z = Math.round(v.z / this.gridSize) * this.gridSize;
    return v;
  }

  hideGizmo(hide) {
    const show = !hide && !!this.selected && !this.selected.userData.locked;
    this.gizmoRoot.visible = show;
    this.transform.enabled = !hide;
  }

  update() {
    if (this.selected) this.refreshOutline();
  }
}
