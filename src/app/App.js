import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { ROOM, MATERIAL_TYPES, DEFAULT_LIGHTS } from '../core/constants.js';
import { EventBus } from '../core/EventBus.js';
import { History } from '../core/History.js';
import { uid } from '../core/ids.js';
import { MaterialLibrary } from '../gfx/materials.js';
import { Room } from '../world/Room.js';
import { ObjectFactory } from '../world/ObjectFactory.js';
import { DEFAULT_NAME, DEFAULT_OBJECTS } from '../world/defaultLayout.js';
import { LightingSystem } from '../systems/LightingSystem.js';
import { TimeSystem } from '../systems/TimeSystem.js';
import { CollisionSystem } from '../systems/Collision.js';
import { CameraSystem } from '../systems/CameraSystem.js';
import { SelectionSystem } from '../systems/Selection.js';
import { InteractionSystem } from '../systems/Interaction.js';
import { GridSystem } from '../systems/GridSystem.js';
import { Minimap } from '../systems/Minimap.js';
import { BlueprintSystem } from '../systems/Blueprint.js';
import { Persistence } from '../systems/Persistence.js';
import { PerformanceMonitor } from '../systems/PerformanceMonitor.js';
import { UI, rad } from '../ui/UI.js';

export class App {
  constructor() {
    this.bus = new EventBus();
    this.history = new History();
    this.persist = new Persistence();
    this.ui = new UI(this.bus);
    this.objects = [];
    this.roomId = uid('room');
    this.clock = new THREE.Clock();
    this.placing = null;
    this.ghost = null;
    this.pointerDown = null;
    this.ao = false;
    this.composer = null;
    this.roomTimer = null;
    this.roomBefore = null;
    this.mobile = matchMedia('(pointer: coarse)').matches || innerWidth < 900;
  }

  async start() {
    try {
      this.ui.boot(0.08, 'Checking WebGL…');
      if (!this.hasWebGL()) {
        this.ui.fatal('WebGL is not available in this browser. Enable hardware acceleration and reload.');
        return;
      }
      this.ui.boot(0.18, 'Creating renderer…');
      this.initRenderer();
      this.ui.boot(0.32, 'Building materials…');
      this.materials = new MaterialLibrary();
      this.scene = new THREE.Scene();
      this.scene.background = new THREE.Color(0x87a4bc);
      this.scene.fog = new THREE.Fog(0x87a4bc, 16, 40);
      this.ui.boot(0.42, 'Constructing room…');
      this.room = new Room(this.scene, this.materials);
      this.factory = new ObjectFactory(this.materials);
      this.lighting = new LightingSystem(this.scene);
      this.time = new TimeSystem();
      this.collision = new CollisionSystem(this.room);
      this.ui.boot(0.55, 'Installing cameras…');
      this.cameras = new CameraSystem(this.renderer, this.collision);
      this.selection = new SelectionSystem(this.scene, this.cameras.camera, this.renderer, this.collision, this.history, this.bus);
      this.interact = new InteractionSystem(this.bus);
      this.grid = new GridSystem(this.scene);
      this.minimap = new Minimap(document.getElementById('minimap'));
      this.blueprint = new BlueprintSystem(this.scene, document.getElementById('hud'));
      this.perf = new PerformanceMonitor(this.renderer);
      this.installEnvironment();
      this.ui.boot(0.72, 'Furnishing bedroom…');
      this.loadDefault(false);
      this.setupAO();
      this.bindUI();
      this.bindPointer();
      this.bindKeys();
      this.bindJoystick();
      this.applyTime();
      this.ui.setMobile(this.mobile && this.cameras.mode === 'fps');
      this.ui.boot(1, 'Ready');
      this.ui.ready();
      this.ui.toast('Atrium ready — drag to orbit, double-click to use objects.');
      this.refreshLists();
      this.loop();
      this.selfCheck();
    } catch (err) {
      console.error(err);
      this.ui.fatal(err?.message || 'Failed to start the studio.');
    }
  }

  hasWebGL() {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch {
      return false;
    }
  }

  initRenderer() {
    const canvas = document.getElementById('viewport');
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: false,
    });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.05;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    window.addEventListener('resize', () => this.resize());
  }

  setupAO() {
    try {
      this.composer = new EffectComposer(this.renderer);
      this.renderPass = new RenderPass(this.scene, this.cameras.camera);
      this.composer.addPass(this.renderPass);
      this.gtao = new GTAOPass(this.scene, this.cameras.camera, innerWidth, innerHeight);
      this.gtao.output = GTAOPass.OUTPUT.Default;
      this.gtao.enabled = false;
      this.composer.addPass(this.gtao);
      this.composer.addPass(new OutputPass());
    } catch (err) {
      console.warn('[atrium] AO unavailable', err);
      this.composer = null;
    }
  }

  setAO(on) {
    this.ao = !!(on && this.composer && this.gtao);
    if (this.gtao) this.gtao.enabled = this.ao;
  }

  installEnvironment() {
    try {
      const env = new RoomEnvironment();
      const pmrem = new THREE.PMREMGenerator(this.renderer);
      this.scene.environment = pmrem.fromScene(env, 0.04).texture;
      env.dispose();
      pmrem.dispose();
    } catch (err) {
      console.warn('[atrium] environment map skipped', err);
    }
  }

  loadDefault(record) {
    this.clearObjects();
    for (const spec of DEFAULT_OBJECTS) {
      try {
        const obj = this.factory.create(spec.type, spec);
        this.scene.add(obj);
        this.objects.push(obj);
      } catch (err) {
        console.warn('[atrium] skipped object', spec.type, err);
      }
    }
    document.getElementById('room-name').value = DEFAULT_NAME;
    this.roomId = uid('room');
    this.lighting.restore(structuredClone(DEFAULT_LIGHTS));
    this.ui.renderLights(this.lighting.state);
    this.time.setMinutes(14 * 60);
    if (document.getElementById('time-slider')) document.getElementById('time-slider').value = '840';
    this.room.applyWalls('paint', '#d8cfc2');
    this.room.applyFloor('wood', '#8a623e');
    this.room.applyCeiling('#efe8dc');
    if (document.getElementById('wall-mat')) this.syncRoomFields();
    this.syncSystems();
    if (record) this.history.clear();
    this.refreshLists();
    if (this.lighting && this.time) this.applyTime();
  }

  clearObjects() {
    this.selection.clear();
    for (const obj of this.objects) {
      this.scene.remove(obj);
      this.disposeObject(obj);
    }
    this.objects = [];
  }

  disposeObject(obj) {
    obj.traverse((ch) => {
      if (ch.geometry) ch.geometry.dispose?.();
    });
  }

  syncSystems() {
    this.collision.setObjects(this.objects);
    this.selection.setObjects(this.objects);
    this.interact.setTargets(this.objects, this.room.interactables);
    this.minimap.setObjects(this.objects);
  }

  addObject(type, transform, record = true) {
    let obj;
    try {
      obj = this.factory.create(type, transform || {});
    } catch (err) {
      this.ui.toast('Could not create that object.');
      return null;
    }
    this.scene.add(obj);
    this.objects.push(obj);
    this.syncSystems();
    if (!this.collision.placementValid(obj, this.objects)) {
      this.collision.clampToRoom(obj);
    }
    if (record) {
      this.history.push({
        label: 'Add',
        undo: () => this.removeObject(obj, false),
        redo: () => {
          if (!this.objects.includes(obj)) {
            this.scene.add(obj);
            this.objects.push(obj);
            this.syncSystems();
          }
        },
      });
    }
    this.refreshLists();
    return obj;
  }

  removeObject(obj, record = true) {
    if (!obj || obj.userData.deletable === false) {
      this.ui.toast('That object cannot be deleted.');
      return;
    }
    const idx = this.objects.indexOf(obj);
    if (idx >= 0) this.objects.splice(idx, 1);
    this.scene.remove(obj);
    if (this.selection.selected === obj) this.selection.clear();
    this.syncSystems();
    if (record) {
      this.history.push({
        label: 'Delete',
        undo: () => {
          this.scene.add(obj);
          this.objects.push(obj);
          this.syncSystems();
          this.refreshLists();
        },
        redo: () => this.removeObject(obj, false),
      });
    }
    this.refreshLists();
  }

  duplicate(obj) {
    if (!obj || obj.userData.deletable === false) return;
    const data = this.factory.serialize(obj);
    delete data.id;
    data.position.x += 0.35;
    data.position.z += 0.35;
    const copy = this.addObject(data.type, data, true);
    if (copy) this.selection.select(copy);
  }

  resetObject(obj) {
    if (!obj?.userData.home) return;
    const before = this.selection.snapshot(obj);
    obj.position.copy(obj.userData.home.position);
    obj.rotation.copy(obj.userData.home.rotation);
    obj.scale.copy(obj.userData.home.scale);
    const after = this.selection.snapshot(obj);
    this.history.push({
      label: 'Reset',
      undo: () => this.selection.applySnapShot(obj, before),
      redo: () => this.selection.applySnapShot(obj, after),
    });
    this.ui.inspect(obj);
  }

  bindUI() {
    const $ = (id) => document.getElementById(id);
    $('btn-undo').addEventListener('click', () => this.undo());
    $('btn-redo').addEventListener('click', () => this.redo());
    $('btn-save').addEventListener('click', () => this.save());
    $('btn-load').addEventListener('click', () => this.openLoad());
    $('btn-new').addEventListener('click', () => {
      this.loadDefault(true);
      this.ui.toast('New room created.');
    });
    $('btn-reset').addEventListener('click', () => {
      this.loadDefault(true);
      this.ui.toast('Room reset to the default bedroom.');
    });
    $('btn-settings').addEventListener('click', () => this.ui.openModal('modal-settings'));
    $('btn-day').addEventListener('click', () => this.setTime(14 * 60));
    $('btn-night').addEventListener('click', () => this.setTime(21 * 60 + 20));
    $('time-slider').addEventListener('input', (e) => this.setTime(Number(e.target.value)));
    $('exposure').addEventListener('input', (e) => {
      const v = Number(e.target.value) / 100;
      this.renderer.toneMappingExposure = v;
      this.ui.setExposureLabel(v);
    });
    $('tog-grid').addEventListener('change', (e) => this.grid.setVisible(e.target.checked));
    $('tog-snap').addEventListener('change', (e) => this.selection.setSnap(e.target.checked));
    $('grid-size').addEventListener('change', (e) => {
      const v = Number(e.target.value);
      this.grid.setSize(v);
      this.selection.gridSize = v;
      this.selection.applySnap();
    });
    $('rot-snap').addEventListener('change', (e) => {
      this.selection.rotSnap = Number(e.target.value);
      this.selection.applySnap();
    });
    document.querySelectorAll('[data-cam]').forEach((b) => b.addEventListener('click', () => this.setCamera(b.dataset.cam)));
    $('btn-cam-reset').addEventListener('click', () => this.cameras.reset());
    document.querySelectorAll('[data-gizmo]').forEach((b) => {
      b.addEventListener('click', () => {
        this.selection.setMode(b.dataset.gizmo);
        this.ui.setGizmo(b.dataset.gizmo);
      });
    });
    this.ui.setGizmo('translate');

    const applyIns = () => this.applyInspector();
    ['ins-px', 'ins-py', 'ins-pz', 'ins-rx', 'ins-ry', 'ins-rz', 'ins-sx', 'ins-sy', 'ins-sz'].forEach((id) => {
      $(id).addEventListener('change', applyIns);
    });
    $('ins-name').addEventListener('change', () => {
      const obj = this.selection.selected;
      if (!obj) return;
      obj.userData.displayName = $('ins-name').value;
      this.refreshLists();
    });
    $('ins-mat').addEventListener('change', () => this.recolorSelected(true));
    $('ins-color').addEventListener('input', () => this.recolorSelected(false));
    $('ins-color').addEventListener('change', () => this.recolorSelected(true));
    $('ins-vis').addEventListener('change', (e) => {
      const obj = this.selection.selected;
      if (!obj) return;
      obj.visible = e.target.checked;
    });
    $('ins-lock').addEventListener('change', (e) => {
      const obj = this.selection.selected;
      if (!obj) return;
      obj.userData.locked = e.target.checked;
      this.selection.select(obj);
    });
    $('ins-dup').addEventListener('click', () => this.duplicate(this.selection.selected));
    $('ins-del').addEventListener('click', () => this.removeObject(this.selection.selected));
    $('ins-reset').addEventListener('click', () => this.resetObject(this.selection.selected));

    const liveRoom = () => this.previewRoom();
    const commitRoom = () => this.commitRoom();
    $('wall-mat').addEventListener('change', commitRoom);
    $('floor-mat').addEventListener('change', commitRoom);
    $('wall-color').addEventListener('input', liveRoom);
    $('floor-color').addEventListener('input', liveRoom);
    $('ceil-color').addEventListener('input', liveRoom);
    $('wall-color').addEventListener('change', commitRoom);
    $('floor-color').addEventListener('change', commitRoom);
    $('ceil-color').addEventListener('change', commitRoom);
    $('wall-mat').value = this.room.wallMatType;
    $('wall-color').value = this.room.wallColor;
    $('floor-mat').value = this.room.floorMatType;
    $('floor-color').value = this.room.floorColor;
    $('ceil-color').value = this.room.ceilingColor;

    $('set-sens').addEventListener('input', (e) => {
      this.cameras.sensitivity = Number(e.target.value) / 10000;
    });
    $('set-fov').addEventListener('input', (e) => {
      this.cameras.walkFov = Number(e.target.value);
      if (this.cameras.mode === 'fps') {
        this.cameras.perspective.fov = this.cameras.walkFov;
        this.cameras.perspective.updateProjectionMatrix();
      }
    });
    $('set-shadows').addEventListener('change', (e) => {
      const v = e.target.value;
      this.renderer.shadowMap.enabled = v !== 'off';
      this.lighting.setShadowQuality(v);
    });
    $('set-ao').checked = false;
    $('set-ao').addEventListener('change', (e) => {
      this.setAO(e.target.checked);
      if (e.target.checked && !this.composer) this.ui.toast('Ambient occlusion is not available here.');
    });

    this.bus.on('library-pick', (type) => this.beginPlace(type));
    this.bus.on('scene-pick', (id) => {
      const obj = this.objects.find((o) => o.userData.id === id);
      if (obj) this.selection.select(obj);
    });
    this.bus.on('select', (obj) => {
      this.ui.inspect(obj);
      this.ui.sceneList(this.objects, obj?.userData.id);
      this.updateHint(obj);
      if (obj && innerWidth < 980) document.getElementById('rightbar').classList.add('open');
    });
    this.bus.on('transform', (obj) => this.ui.inspect(obj));
    this.bus.on('gizmo-drag', (dragging) => {
      this.cameras.orbit.enabled = !dragging && this.cameras.mode === 'orbit';
    });
    this.bus.on('invalid-placement', () => this.ui.toast('Invalid placement — object returned to last valid pose.'));
    this.bus.on('toggle-light', (id) => {
      const on = this.lighting.toggle(id);
      this.ui.renderLights(this.lighting.state);
      this.ui.toast(`${this.lighting.state[id]?.name || 'Light'} ${on ? 'on' : 'off'}`);
    });
    this.bus.on('light-edit', (patch) => {
      this.lighting.setLight(patch.id, patch);
    });
    this.bus.on('open-ui', (payload) => {
      if (payload.type === 'book') this.ui.showBook(payload.book);
      if (payload.type === 'clock') this.ui.showClock(this.time.label());
      if (payload.type === 'computer') {
        this.ui.showComputer(
          {
            name: document.getElementById('room-name').value,
            time: this.time.label(),
            count: this.objects.length,
            lights: this.lighting.state,
          },
          { toggle: (id) => this.bus.emit('toggle-light', id) }
        );
      }
    });
    this.bus.on('acted', ({ obj, kind, open, spinning }) => {
      if (kind === 'fan') this.ui.toast(spinning ? 'Ceiling fan started.' : 'Ceiling fan stopped.');
      else if (open != null) this.ui.toast(`${obj.userData.displayName || kind} ${open ? 'opened' : 'closed'}.`);
    });

    const canvas = this.renderer.domElement;
    canvas.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    });
    canvas.addEventListener('drop', (e) => {
      e.preventDefault();
      const type = e.dataTransfer.getData('text/plain');
      if (type) this.placeAtEvent(type, e);
    });
  }

  previewRoom() {
    if (!this.roomBefore) this.roomBefore = this.room.serialize();
    this.room.applyWalls(document.getElementById('wall-mat').value, document.getElementById('wall-color').value);
    this.room.applyFloor(document.getElementById('floor-mat').value, document.getElementById('floor-color').value);
    this.room.applyCeiling(document.getElementById('ceil-color').value);
  }

  commitRoom() {
    const before = this.roomBefore || this.room.serialize();
    this.previewRoom();
    const after = this.room.serialize();
    this.roomBefore = null;
    if (JSON.stringify(before) === JSON.stringify(after)) return;
    this.history.push({
      label: 'Room',
      undo: () => {
        this.room.restore(before);
        this.syncRoomFields();
      },
      redo: () => {
        this.room.restore(after);
        this.syncRoomFields();
      },
    });
    this.ui.setUndo(this.history.canUndo, this.history.canRedo);
  }

  syncRoomFields() {
    document.getElementById('wall-mat').value = this.room.wallMatType;
    document.getElementById('wall-color').value = this.room.wallColor;
    document.getElementById('floor-mat').value = this.room.floorMatType;
    document.getElementById('floor-color').value = this.room.floorColor;
    document.getElementById('ceil-color').value = this.room.ceilingColor;
  }

  recolorSelected(record) {
    const obj = this.selection.selected;
    if (!obj) return;
    if (record && !this._matBefore) this._matBefore = { mat: obj.userData.matType, color: obj.userData.color };
    if (!record && !this._matBefore) this._matBefore = { mat: obj.userData.matType, color: obj.userData.color };
    const mat = document.getElementById('ins-mat').value;
    const color = document.getElementById('ins-color').value;
    obj.userData.matType = mat;
    obj.userData.color = color;
    this.materials.applySlot(obj, 'body', mat, color);
    if (!record) return;
    const before = this._matBefore;
    this._matBefore = null;
    const after = { mat, color };
    if (before.mat === after.mat && before.color === after.color) return;
    this.history.push({
      label: 'Material',
      undo: () => {
        obj.userData.matType = before.mat;
        obj.userData.color = before.color;
        this.materials.applySlot(obj, 'body', before.mat, before.color);
        this.ui.inspect(obj);
      },
      redo: () => {
        obj.userData.matType = after.mat;
        obj.userData.color = after.color;
        this.materials.applySlot(obj, 'body', after.mat, after.color);
        this.ui.inspect(obj);
      },
    });
    this.ui.setUndo(this.history.canUndo, this.history.canRedo);
  }

  applyInspector() {
    const obj = this.selection.selected;
    if (!obj || obj.userData.locked) return;
    const before = this.selection.snapshot(obj);
    obj.position.set(
      num('ins-px', obj.position.x),
      num('ins-py', obj.position.y),
      num('ins-pz', obj.position.z)
    );
    obj.rotation.set(rad(num('ins-rx', 0)), rad(num('ins-ry', 0)), rad(num('ins-rz', 0)));
    obj.scale.set(num('ins-sx', 1), num('ins-sy', 1), num('ins-sz', 1));
    this.collision.clampToRoom(obj);
    if (!this.collision.placementValid(obj, this.objects)) {
      this.selection.applySnapShot(obj, before);
      this.ui.toast('That transform would collide.');
      this.ui.inspect(obj);
      return;
    }
    const after = this.selection.snapshot(obj);
    this.history.push({
      label: 'Inspect',
      undo: () => {
        this.selection.applySnapShot(obj, before);
        this.ui.inspect(obj);
      },
      redo: () => {
        this.selection.applySnapShot(obj, after);
        this.ui.inspect(obj);
      },
    });
    this.ui.inspect(obj);
    this.ui.setUndo(this.history.canUndo, this.history.canRedo);
  }

  beginPlace(type) {
    this.cancelPlace();
    this.placing = type;
    this.ui.setPlacing(type);
    try {
      this.ghost = this.factory.create(type, { id: 'tmp-ghost' });
      this.ghost.traverse((ch) => {
        if (ch.isMesh) {
          ch.material = ch.material.clone();
          ch.material.transparent = true;
          ch.material.opacity = 0.45;
          ch.castShadow = false;
        }
      });
      this.ghost.userData.selectable = false;
      this.scene.add(this.ghost);
    } catch {
      this.ghost = null;
    }
  }

  cancelPlace() {
    this.placing = null;
    this.ui.setPlacing(null);
    if (this.ghost) {
      this.scene.remove(this.ghost);
      this.disposeObject(this.ghost);
      this.ghost = null;
    }
  }

  placeAtEvent(type, event) {
    if (!type) return;
    const obj = this.addObject(type, {}, false);
    if (!obj) return;
    this.positionFromEvent(obj, event);
    if (!this.collision.placementValid(obj, this.objects)) {
      this.ui.toast('Cannot place there — blocked or outside the room.');
      this.removeObject(obj, false);
      return;
    }
    obj.userData.home = {
      position: obj.position.clone(),
      rotation: obj.rotation.clone(),
      scale: obj.scale.clone(),
    };
    this.history.push({
      label: 'Add',
      undo: () => this.removeObject(obj, false),
      redo: () => {
        if (!this.objects.includes(obj)) {
          this.scene.add(obj);
          this.objects.push(obj);
          this.syncSystems();
        }
      },
    });
    this.selection.select(obj);
    this.cancelPlace();
    this.ui.setUndo(this.history.canUndo, this.history.canRedo);
    if (innerWidth < 980) document.getElementById('leftbar').classList.remove('open');
  }

  positionFromEvent(obj, event) {
    const mount = obj.userData.mount;
    if (mount === 'wall') {
      const walls = [];
      this.room.root.traverse((ch) => {
        if (ch.isMesh && ch.parent?.name === 'wall') walls.push(ch);
      });
      const hit = this.selection.wallPoint(event, walls);
      if (hit) {
        obj.position.copy(hit.point);
        const n = hit.face.normal.clone().transformDirection(hit.object.matrixWorld);
        obj.position.add(n.multiplyScalar(0.04));
        obj.lookAt(obj.position.clone().add(n));
        obj.rotateY(Math.PI);
      }
      return;
    }
    const p = this.selection.floorPoint(event);
    if (!p) return;
    this.selection.snapVec(p);
    obj.position.x = p.x;
    obj.position.z = p.z;
    obj.position.y = mount === 'ceiling' ? ROOM.height : 0;
  }

  bindPointer() {
    const el = this.renderer.domElement;
    el.addEventListener('pointerdown', (e) => {
      if (e.button !== 0) return;
      this.pointerDown = { x: e.clientX, y: e.clientY, t: performance.now() };
    });
    el.addEventListener('pointermove', (e) => {
      if (this.placing && this.ghost) {
        this.positionFromEvent(this.ghost, e);
        const valid = this.collision.placementValid(this.ghost, this.objects);
        this.ghost.traverse((ch) => {
          if (ch.isMesh) ch.material.color?.set(valid ? 0x88aa77 : 0xc45c4a);
        });
      }
    });
    el.addEventListener('pointerup', (e) => {
      if (!this.pointerDown || e.button !== 0) return;
      const dx = e.clientX - this.pointerDown.x;
      const dy = e.clientY - this.pointerDown.y;
      const dt = performance.now() - this.pointerDown.t;
      this.pointerDown = null;
      if (Math.hypot(dx, dy) > 6) return;
      if (this.selection.transform.dragging) return;
      if (this.placing) {
        this.placeAtEvent(this.placing, e);
        return;
      }
      if (this.cameras.mode === 'fps' && dt > 180) return;
      const picked = this.selection.pick(e, this.room.interactables);
      if (this.cameras.mode === 'fps') {
        if (dt < 280 && this._lastClick && performance.now() - this._lastClick < 320) {
          const target = this.interact.findInteractable(picked?.hit?.object) || picked?.root;
          if (target) this.interact.toggle(target);
          this._lastClick = 0;
        } else {
          this._lastClick = performance.now();
        }
        return;
      }
      if (dt < 280 && this._lastClick && performance.now() - this._lastClick < 320) {
        const target = this.interact.findInteractable(picked?.hit?.object) || picked?.root;
        if (target) this.interact.toggle(target);
        this._lastClick = 0;
        return;
      }
      this._lastClick = performance.now();
      if (picked?.root && this.objects.includes(picked.root)) this.selection.select(picked.root);
      else if (picked?.root && picked.root.userData.structural) {
        this.selection.clear();
        this.updateHint(picked.root);
      } else {
        this.selection.clear();
      }
    });
  }

  bindKeys() {
    window.addEventListener('keydown', (e) => {
      if (this.cameras.isTyping(e)) return;
      const cmd = e.ctrlKey || e.metaKey;
      if (cmd && e.code === 'KeyZ') {
        e.preventDefault();
        if (e.shiftKey) this.redo();
        else this.undo();
      } else if (cmd && e.code === 'KeyY') {
        e.preventDefault();
        this.redo();
      } else if (cmd && e.code === 'KeyS') {
        e.preventDefault();
        this.save();
      } else if (cmd && e.code === 'KeyD') {
        e.preventDefault();
        this.duplicate(this.selection.selected);
      } else if (e.code === 'Escape') {
        this.cancelPlace();
        this.selection.clear();
        this.ui.closeModals();
      } else if (e.code === 'Delete' || e.code === 'Backspace') {
        if (this.selection.selected) this.removeObject(this.selection.selected);
      } else if (e.code === 'KeyW' && this.cameras.mode !== 'fps') {
        this.selection.setMode('translate');
        this.ui.setGizmo('translate');
      } else if (e.code === 'KeyE' && this.cameras.mode !== 'fps') {
        this.selection.setMode('rotate');
        this.ui.setGizmo('rotate');
      } else if (e.code === 'KeyR' && this.cameras.mode !== 'fps') {
        this.selection.setMode('scale');
        this.ui.setGizmo('scale');
      } else if (e.code === 'KeyF') {
        this.cameras.focus(this.selection.selected);
      } else if (e.code === 'Digit1') this.setCamera('orbit');
      else if (e.code === 'Digit2') this.setCamera('fps');
      else if (e.code === 'Digit3') this.setCamera('top');
      else if (e.code === 'Digit4') this.setCamera('front');
      else if (e.code === 'Digit5') this.setCamera('side');
      else if (e.code === 'Digit6') this.setCamera('blueprint');
      else if (e.code === 'KeyL') {
        const obj = this.selection.selected;
        if (obj?.userData.lightBind) this.bus.emit('toggle-light', obj.userData.lightBind);
      } else if (e.code === 'KeyQ' || (e.code === 'KeyE' && this.cameras.mode === 'fps')) {
        this.useCentered();
      }
    });
  }

  useCentered() {
    const cam = this.cameras.camera;
    const ray = new THREE.Raycaster();
    ray.setFromCamera(new THREE.Vector2(0, 0), cam);
    const hits = ray.intersectObjects([...this.objects, ...this.room.interactables], true);
    if (!hits.length) return;
    const target = this.interact.findInteractable(hits[0].object);
    if (target) this.interact.toggle(target);
  }

  bindJoystick() {
    const root = document.getElementById('joystick');
    const knob = root.querySelector('.joy-knob');
    const base = root.querySelector('.joy-base');
    let active = false;
    const apply = (cx, cy) => {
      const r = base.getBoundingClientRect();
      const x = cx - (r.left + r.width / 2);
      const y = cy - (r.top + r.height / 2);
      const max = r.width / 2 - 18;
      const len = Math.hypot(x, y);
      const s = len > max ? max / len : 1;
      const kx = x * s;
      const ky = y * s;
      knob.style.left = `${32 + kx}px`;
      knob.style.top = `${32 + ky}px`;
      this.cameras.setJoystick(kx / max, ky / max);
    };
    const end = () => {
      active = false;
      knob.style.left = '32px';
      knob.style.top = '32px';
      this.cameras.setJoystick(0, 0);
    };
    base.addEventListener('pointerdown', (e) => {
      active = true;
      base.setPointerCapture(e.pointerId);
      apply(e.clientX, e.clientY);
    });
    base.addEventListener('pointermove', (e) => {
      if (active) apply(e.clientX, e.clientY);
    });
    base.addEventListener('pointerup', end);
    base.addEventListener('pointercancel', end);
  }

  setCamera(mode) {
    const cam = this.cameras.setMode(mode);
    this.selection.setCamera(cam);
    this.selection.hideGizmo(mode === 'fps');
    this.blueprint.set(mode === 'blueprint', this.objects, this.room);
    if (this.renderPass) this.renderPass.camera = cam;
    if (this.gtao) this.gtao.camera = cam;
    if (mode !== 'blueprint' && this.room.ceiling) this.room.ceiling.visible = mode !== 'top';
    this.ui.setMode(mode);
    this.ui.setMobile(this.mobile && mode === 'fps');
    this.grid.setVisible(document.getElementById('tog-grid').checked && mode !== 'fps');
    if (mode === 'fps') this.ui.hint('Drag to look · WASD or joystick to walk · E to use');
  }

  setTime(minutes) {
    this.time.setMinutes(minutes);
    document.getElementById('time-slider').value = String(this.time.minutes);
    this.applyTime();
  }

  applyTime() {
    const env = this.time.evaluate();
    if (!this.blueprint.active) this.lighting.applyTime(env);
    else {
      this.lighting.sun.intensity = env.sunIntensity;
      this.lighting.hemi.intensity = env.hemiIntensity;
    }
    this.room.setSky(env.bg);
    this.ui.setTimeLabel(env.label);
    this.updateClockHands();
  }

  updateClockHands() {
    const hours = this.time.hours;
    for (const obj of this.objects) {
      if (obj.userData.type !== 'clock') continue;
      const hour = obj.getObjectByName('hourHand');
      const minute = obj.getObjectByName('minuteHand');
      const h = hours % 12;
      const m = (hours * 60) % 60;
      if (hour) hour.rotation.z = -((h / 12) * Math.PI * 2);
      if (minute) minute.rotation.z = -((m / 60) * Math.PI * 2);
    }
  }

  serialize() {
    return {
      id: this.roomId,
      name: document.getElementById('room-name').value || DEFAULT_NAME,
      time: this.time.minutes,
      exposure: this.renderer.toneMappingExposure,
      room: this.room.serialize(),
      lights: this.lighting.serialize(),
      objects: this.objects.map((o) => this.factory.serialize(o)),
      actuators: this.room.interactables.map((o) => ({
        name: o.name,
        goals: (o.userData.actuators || []).map((a) => a.goal),
        spinning: !!o.userData.spinning,
      })),
    };
  }

  hydrate(payload) {
    if (!payload || typeof payload !== 'object') throw new Error('Invalid room file');
    this.clearObjects();
    this.roomId = payload.id || uid('room');
    document.getElementById('room-name').value = payload.name || DEFAULT_NAME;
    if (payload.room) this.room.restore(payload.room);
    this.syncRoomFields();
    if (payload.lights) this.lighting.restore(payload.lights);
    this.ui.renderLights(this.lighting.state);
    if (payload.time != null) this.setTime(payload.time);
    if (payload.exposure != null) {
      this.renderer.toneMappingExposure = payload.exposure;
      document.getElementById('exposure').value = String(Math.round(payload.exposure * 100));
      this.ui.setExposureLabel(payload.exposure);
    }
    for (const spec of payload.objects || []) {
      try {
        const obj = this.factory.create(spec.type, spec);
        this.scene.add(obj);
        this.objects.push(obj);
      } catch (err) {
        console.warn('[atrium] skipped saved object', spec, err);
      }
    }
    if (Array.isArray(payload.actuators)) {
      for (const rec of payload.actuators) {
        const obj = this.room.interactables.find((o) => o.name === rec.name);
        if (!obj) continue;
        obj.userData.spinning = !!rec.spinning;
        (obj.userData.actuators || []).forEach((a, i) => {
          if (rec.goals && rec.goals[i] != null) {
            a.goal = rec.goals[i];
            a.current = rec.goals[i];
            if (a.type === 'rotate') a.target.rotation[a.axis] = a.current;
            else if (a.type === 'slide') a.target.position[a.axis] = a.current;
          }
        });
      }
    }
    this.syncSystems();
    this.history.clear();
    this.refreshLists();
  }

  save() {
    const rec = this.persist.save(this.serialize());
    if (rec) this.ui.toast(`Saved “${rec.name}”.`);
    else this.ui.toast('Could not save — storage may be full.');
  }

  openLoad() {
    this.ui.openModal('modal-saves');
    this.ui.renderSaves(
      this.persist.list(),
      (id) => {
        const rec = this.persist.load(id);
        if (!rec) {
          this.ui.toast('That save is unreadable.');
          return;
        }
        try {
          this.hydrate(rec.data);
          this.ui.closeModals();
          this.ui.toast(`Loaded “${rec.name}”.`);
        } catch (err) {
          console.warn(err);
          this.ui.toast('Save file was corrupted.');
        }
      },
      (id) => {
        this.persist.remove(id);
        this.openLoad();
      },
      (id, name) => {
        this.persist.rename(id, name);
        if (id === this.roomId) document.getElementById('room-name').value = name;
        this.openLoad();
      }
    );
  }

  undo() {
    if (this.history.undo()) this.ui.toast('Undo');
    this.ui.setUndo(this.history.canUndo, this.history.canRedo);
    this.refreshLists();
  }

  redo() {
    if (this.history.redo()) this.ui.toast('Redo');
    this.ui.setUndo(this.history.canUndo, this.history.canRedo);
    this.refreshLists();
  }

  refreshLists() {
    this.ui.sceneList(this.objects, this.selection.selected?.userData.id);
    this.ui.setStats(this.objects.length);
    this.ui.setUndo(this.history.canUndo, this.history.canRedo);
  }

  updateHint(obj) {
    if (this.placing) return;
    if (!obj) {
      this.ui.hint('');
      return;
    }
    const kind = obj.userData.interact;
    const map = {
      door: 'Double-click to open / close the door',
      window: 'Double-click to slide the window',
      fan: 'Double-click to start / stop the fan',
      lamp: 'Double-click to toggle this lamp',
      switch: 'Double-click to toggle the bound light',
      computer: 'Double-click to use the computer',
      clock: 'Double-click to read the room time',
      book: 'Double-click to read this book',
    };
    this.ui.hint(map[kind] || obj.userData.displayName || '');
  }

  resize() {
    this.renderer.setSize(window.innerWidth, window.innerHeight, false);
    this.cameras.resize();
  }

  loop() {
    const step = () => {
      requestAnimationFrame(step);
      const dt = Math.min(0.05, this.clock.getDelta());
      this.cameras.update(dt);
      this.interact.update(dt);
      this.selection.update();
      this.updateCeiling();
      this.blueprint.update(this.cameras.camera, this.renderer);
      this.minimap.draw(this.cameras.getPlayerXZ(), this.room);
      this.perf.update(dt);
      this.renderer.info.reset();
      if (this.ao && this.composer) {
        this.renderPass.camera = this.cameras.camera;
        this.composer.render();
      } else {
        this.renderer.render(this.scene, this.cameras.camera);
      }
      if (this.perf.frames === 0) {
        this.ui.perf(this.perf.snapshot({ objects: this.objects.length, mode: this.cameras.mode }));
      }
    };
    requestAnimationFrame(step);
  }

  updateCeiling() {
    if (!this.room.ceiling) return;
    if (this.cameras.mode === 'top' || this.cameras.mode === 'blueprint') {
      this.room.ceiling.visible = false;
      return;
    }
    if (this.cameras.mode === 'orbit') {
      this.room.ceiling.visible = this.cameras.camera.position.y < ROOM.height + 0.15;
    } else if (this.cameras.mode === 'fps') {
      this.room.ceiling.visible = true;
    }
  }

  selfCheck() {
    const report = [];
    const ok = (name, cond) => report.push({ name, ok: !!cond });
    ok('renderer', !!this.renderer);
    ok('room', !!this.room?.floor);
    ok('furniture', this.objects.length >= 10);
    ok('door', !!this.room.door);
    ok('windows', this.room.windows.length >= 2);
    ok('lights', !!this.lighting.ceiling);
    ok('camera', !!this.cameras.camera);
    window.__atrium = {
      app: this,
      report,
      test: () => this.runTests(),
    };
    console.info('[atrium] self-check', report);
  }

  runTests() {
    const results = [];
    const check = (name, fn) => {
      try {
        const v = fn();
        results.push({ name, ok: !!v, detail: v });
      } catch (err) {
        results.push({ name, ok: false, detail: String(err) });
      }
    };
    check('renders objects', () => this.objects.length > 0);
    check('select bed', () => {
      const bed = this.objects.find((o) => o.userData.type === 'bed');
      this.selection.select(bed);
      return this.selection.selected === bed;
    });
    check('move clamped', () => {
      const bed = this.selection.selected;
      const x = bed.position.x;
      bed.position.x = 40;
      this.collision.clampToRoom(bed);
      const clamped = Math.abs(bed.position.x) < 6;
      bed.position.x = x;
      return clamped;
    });
    check('door actuator', () => this.interact.toggle(this.room.door));
    check('window actuator', () => this.interact.toggle(this.room.windows[0]));
    const fan = this.objects.find((o) => o.userData.type === 'ceilingFan');
    check('fan toggle', () => {
      this.interact.toggle(fan);
      return fan.userData.spinning === true;
    });
    check('day/night', () => {
      this.setTime(2 * 60);
      const night = this.time.evaluate().night;
      this.setTime(14 * 60);
      return night === true;
    });
    check('save/load', () => {
      const data = this.serialize();
      return Array.isArray(data.objects) && data.objects.length === this.objects.length;
    });
    check('undo stack', () => {
      this.history.push({ label: 't', undo: () => {}, redo: () => {} });
      const u = this.history.undo();
      return u === true;
    });
    check('catalog types', () => MATERIAL_TYPES.length >= 10);
    console.table(results);
    return results;
  }
}

function num(id, fallback) {
  const v = Number(document.getElementById(id).value);
  return Number.isFinite(v) ? v : fallback;
}
