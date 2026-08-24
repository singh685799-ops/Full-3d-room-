import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { ROOM, PLAYER } from '../core/constants.js';

export class CameraSystem {
  constructor(renderer, collision) {
    this.renderer = renderer;
    this.collision = collision;
    this.mode = 'orbit';
    this.sensitivity = 0.0014;
    this.walkFov = 72;
    this.keys = new Set();
    this.look = { x: 0, y: 0 };
    this.yaw = 0.55;
    this.pitch = -0.08;
    this.velocity = new THREE.Vector3();
    this.pointerLocked = false;
    this.draggingLook = false;
    this.last = new THREE.Vector2();
    this.joy = { x: 0, z: 0 };
    this.touchLook = false;

    const aspect = window.innerWidth / window.innerHeight;
    this.perspective = new THREE.PerspectiveCamera(55, aspect, 0.08, 80);
    this.ortho = new THREE.OrthographicCamera(-6, 6, 4.5, -4.5, 0.05, 80);
    this.camera = this.perspective;
    this.camera.position.set(2.55, 1.82, 2.48);

    this.orbit = new OrbitControls(this.perspective, renderer.domElement);
    this.orbit.enableDamping = true;
    this.orbit.dampingFactor = 0.08;
    this.orbit.target.set(0, 1.05, 0);
    this.orbit.maxPolarAngle = Math.PI * 0.49;
    this.orbit.minDistance = 0.6;
    this.orbit.maxDistance = 14;
    this.orbit.update();

    this.fpsPos = new THREE.Vector3(1.15, PLAYER.eye, 2.15);
    this.bindInput();
  }

  bindInput() {
    const el = this.renderer.domElement;
    window.addEventListener('keydown', (e) => {
      if (this.isTyping(e)) return;
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
    el.addEventListener('pointerdown', (e) => {
      if (this.mode !== 'fps') return;
      if (e.button !== 0) return;
      this.draggingLook = true;
      this.last.set(e.clientX, e.clientY);
      el.setPointerCapture(e.pointerId);
      try {
        el.requestPointerLock?.();
      } catch {
        /* iframe may block pointer lock */
      }
    });
    el.addEventListener('pointerup', (e) => {
      this.draggingLook = false;
      try {
        el.releasePointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
    });
    el.addEventListener('pointermove', (e) => {
      if (this.mode !== 'fps') return;
      let dx = 0;
      let dy = 0;
      if (document.pointerLockElement === el) {
        dx = e.movementX || 0;
        dy = e.movementY || 0;
      } else if (this.draggingLook) {
        dx = e.clientX - this.last.x;
        dy = e.clientY - this.last.y;
        this.last.set(e.clientX, e.clientY);
      } else {
        return;
      }
      this.yaw -= dx * this.sensitivity;
      this.pitch -= dy * this.sensitivity;
      this.pitch = THREE.MathUtils.clamp(this.pitch, -1.2, 1.2);
    });
    document.addEventListener('pointerlockchange', () => {
      this.pointerLocked = document.pointerLockElement === el;
    });
  }

  isTyping(e) {
    const t = e.target;
    return t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.tagName === 'SELECT' || t.isContentEditable);
  }

  setMode(mode) {
    this.mode = mode;
    this.orbit.enabled = mode === 'orbit';
    if (mode === 'fps') {
      this.camera = this.perspective;
      this.perspective.fov = this.walkFov;
      this.perspective.updateProjectionMatrix();
      this.syncFpsCamera();
    } else if (mode === 'orbit') {
      this.camera = this.perspective;
      this.perspective.fov = 55;
      this.perspective.updateProjectionMatrix();
      this.orbit.object = this.perspective;
      this.orbit.update();
    } else {
      this.camera = this.ortho;
      this.applyPreset(mode);
    }
    this.resize();
    return this.camera;
  }

  applyPreset(mode) {
    const { width: W, depth: D, height: H } = ROOM;
    const span = Math.max(W, D) * 0.72;
    this.ortho.left = -span * this.aspect();
    this.ortho.right = span * this.aspect();
    this.ortho.top = span;
    this.ortho.bottom = -span;
    this.ortho.updateProjectionMatrix();
    if (mode === 'top' || mode === 'blueprint') {
      this.ortho.position.set(0, 9, 0.001);
      this.ortho.up.set(0, 0, -1);
      this.ortho.lookAt(0, 0, 0);
    } else if (mode === 'front') {
      this.ortho.up.set(0, 1, 0);
      this.ortho.position.set(0, H * 0.5, 8);
      this.ortho.lookAt(0, H * 0.45, 0);
    } else if (mode === 'side') {
      this.ortho.up.set(0, 1, 0);
      this.ortho.position.set(8, H * 0.5, 0);
      this.ortho.lookAt(0, H * 0.45, 0);
    }
  }

  aspect() {
    return this.renderer.domElement.clientWidth / Math.max(1, this.renderer.domElement.clientHeight);
  }

  reset() {
    if (this.mode === 'fps') {
      this.fpsPos.set(1.15, PLAYER.eye, 2.15);
      this.yaw = 0.55;
      this.pitch = -0.08;
      this.syncFpsCamera();
    } else if (this.mode === 'orbit') {
      this.perspective.position.set(2.55, 1.82, 2.48);
      this.orbit.target.set(0, 1.05, 0);
      this.orbit.update();
    } else {
      this.applyPreset(this.mode);
    }
  }

  focus(obj) {
    if (!obj) return;
    const box = new THREE.Box3().setFromObject(obj);
    const center = box.getCenter(new THREE.Vector3());
    const size = box.getSize(new THREE.Vector3()).length();
    if (this.mode === 'orbit') {
      this.orbit.target.copy(center);
      const dir = this.perspective.position.clone().sub(this.orbit.target).normalize();
      this.perspective.position.copy(center.clone().add(dir.multiplyScalar(Math.max(1.6, size * 1.6))));
      this.orbit.update();
    }
  }

  setJoystick(x, z) {
    this.joy.x = x;
    this.joy.z = z;
  }

  update(dt) {
    if (this.mode === 'orbit') this.orbit.update();
    if (this.mode === 'fps') this.updateFps(dt);
  }

  updateFps(dt) {
    let ix = this.joy.x;
    let iz = this.joy.z;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) iz -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) iz += 1;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) ix -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) ix += 1;
    const len = Math.hypot(ix, iz);
    if (len > 1) {
      ix /= len;
      iz /= len;
    }
    const sprint = this.keys.has('ShiftLeft') || this.keys.has('ShiftRight');
    const speed = sprint ? PLAYER.sprint : PLAYER.speed;
    const forward = new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw));
    const right = new THREE.Vector3(Math.cos(this.yaw), 0, -Math.sin(this.yaw));
    const move = forward.multiplyScalar(-iz * speed * dt).add(right.multiplyScalar(ix * speed * dt));
    const from = { x: this.fpsPos.x, z: this.fpsPos.z };
    const to = { x: this.fpsPos.x + move.x, z: this.fpsPos.z + move.z };
    const resolved = this.collision.resolvePlayer(from, to);
    this.fpsPos.x = resolved.x;
    this.fpsPos.z = resolved.z;
    this.fpsPos.y = PLAYER.eye;
    this.syncFpsCamera();
  }

  syncFpsCamera() {
    this.perspective.position.copy(this.fpsPos);
    this.perspective.rotation.order = 'YXZ';
    this.perspective.rotation.y = this.yaw;
    this.perspective.rotation.x = this.pitch;
    this.perspective.rotation.z = 0;
  }

  resize() {
    const w = this.renderer.domElement.clientWidth;
    const h = Math.max(1, this.renderer.domElement.clientHeight);
    this.perspective.aspect = w / h;
    this.perspective.updateProjectionMatrix();
    if (this.mode !== 'orbit' && this.mode !== 'fps') this.applyPreset(this.mode);
  }

  getPlayerXZ() {
    if (this.mode === 'fps') return { x: this.fpsPos.x, z: this.fpsPos.z, yaw: this.yaw };
    return { x: this.camera.position.x, z: this.camera.position.z, yaw: this.yaw };
  }
}
