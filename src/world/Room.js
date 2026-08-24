import * as THREE from 'three';
import { ROOM } from '../core/constants.js';
import { box, at, add, group, cyl } from './geom.js';

function wallPieces(width, height, thick, holes, mat) {
  const g = group('wall');
  const parts = [{ x: 0, y: height / 2, w: width, h: height }];
  for (const hole of holes) {
    const next = [];
    for (const p of parts) {
      const ax1 = p.x - p.w / 2;
      const ax2 = p.x + p.w / 2;
      const ay1 = p.y - p.h / 2;
      const ay2 = p.y + p.h / 2;
      const bx1 = hole.x - hole.w / 2;
      const bx2 = hole.x + hole.w / 2;
      const by1 = hole.y - hole.h / 2;
      const by2 = hole.y + hole.h / 2;
      const ix = ax1 < bx2 && ax2 > bx1 && ay1 < by2 && ay2 > by1;
      if (!ix) {
        next.push(p);
        continue;
      }
      if (ay1 < by1) next.push({ x: p.x, y: (ay1 + by1) / 2, w: p.w, h: by1 - ay1 });
      if (ay2 > by2) next.push({ x: p.x, y: (ay2 + by2) / 2, w: p.w, h: ay2 - by2 });
      const midY1 = Math.max(ay1, by1);
      const midY2 = Math.min(ay2, by2);
      const midH = midY2 - midY1;
      const midY = (midY1 + midY2) / 2;
      if (midH > 0.001) {
        if (ax1 < bx1) next.push({ x: (ax1 + bx1) / 2, y: midY, w: bx1 - ax1, h: midH });
        if (ax2 > bx2) next.push({ x: (ax2 + bx2) / 2, y: midY, w: ax2 - bx2, h: midH });
      }
    }
    parts.length = 0;
    parts.push(...next.filter((p) => p.w > 0.01 && p.h > 0.01));
  }
  for (const p of parts) {
    const m = box(p.w, p.h, thick, mat, 'body');
    m.position.set(p.x, p.y, 0);
    m.userData.structural = true;
    g.add(m);
  }
  return g;
}

export class Room {
  constructor(scene, materials) {
    this.scene = scene;
    this.materials = materials;
    this.root = group('Room');
    this.colliders = [];
    this.windows = [];
    this.interactables = [];
    this.wallMatType = 'paint';
    this.wallColor = '#d8cfc2';
    this.floorMatType = 'wood';
    this.floorColor = '#8a623e';
    this.ceilingColor = '#efe8dc';
    this.build();
    scene.add(this.root);
  }

  build() {
    while (this.root.children.length) this.root.remove(this.root.children[0]);
    this.colliders = [];
    this.windows = [];
    this.interactables = [];

    const { width: W, depth: D, height: H, wall: T } = ROOM;
    const wallMat = this.materials.inst(this.wallMatType, this.wallColor);
    wallMat.side = THREE.DoubleSide;
    const floorMat = this.materials.inst(this.floorMatType, this.floorColor);
    const ceilMat = this.materials.inst('paint', this.ceilingColor);

    const floor = box(W + T * 2, 0.08, D + T * 2, floorMat, 'body');
    floor.position.y = -0.04;
    floor.userData.structural = true;
    floor.receiveShadow = true;
    floor.castShadow = false;
    this.floor = floor;
    this.root.add(floor);

    this.ceiling = box(W + T * 2, 0.08, D + T * 2, ceilMat, 'body');
    this.ceiling.position.y = H + 0.04;
    this.ceiling.userData.structural = true;
    this.ceiling.castShadow = false;
    this.root.add(this.ceiling);

    const doorW = 0.96;
    const doorH = 2.12;
    const doorX = 1.55;
    const winW = 1.15;
    const winH = 1.15;
    const winY = 1.45;

    const northHoles = [
      { x: -1.7, y: winY, w: winW, h: winH },
      { x: 1.5, y: winY, w: winW, h: winH },
    ];
    const southHoles = [{ x: doorX, y: doorH / 2, w: doorW, h: doorH }];
    const eastHoles = [{ x: 1.15, y: winY, w: winW, h: winH }];

    const north = wallPieces(W, H, T, northHoles, wallMat);
    north.position.set(0, 0, -D / 2 - T / 2);
    this.root.add(north);

    const south = wallPieces(W, H, T, southHoles, wallMat);
    south.position.set(0, 0, D / 2 + T / 2);
    this.root.add(south);

    const west = wallPieces(D, H, T, [], wallMat);
    west.rotation.y = Math.PI / 2;
    west.position.set(-W / 2 - T / 2, 0, 0);
    this.root.add(west);

    const east = wallPieces(D, H, T, eastHoles, wallMat);
    east.rotation.y = Math.PI / 2;
    east.position.set(W / 2 + T / 2, 0, 0);
    this.root.add(east);

    this.baseboards(W, D, H, T, wallMat);
    this.buildDoor(doorX, doorW, doorH, D, T);
    this.buildWindow(-1.7, winY, winW, winH, -D / 2, 0, 'northA');
    this.buildWindow(1.5, winY, winW, winH, -D / 2, 0, 'northB');
    this.buildWindow(W / 2, winY, winW, winH, -0.4, Math.PI / 2, 'eastA');
    this.buildSwitch(doorX - 0.7, 1.15, D / 2 - 0.02);
    add(this.root, at(cyl(0.16, 0.16, 0.02, this.materials.inst('paint', this.ceilingColor)), 0, H - 0.02, 0));
    this.buildOutside(W, D, H);

    this.colliders.push(
      { name: 'north', min: { x: -W / 2 - T, y: 0, z: -D / 2 - T }, max: { x: W / 2 + T, y: H, z: -D / 2 } },
      { name: 'south', min: { x: -W / 2 - T, y: 0, z: D / 2 }, max: { x: W / 2 + T, y: H, z: D / 2 + T } },
      { name: 'west', min: { x: -W / 2 - T, y: 0, z: -D / 2 }, max: { x: -W / 2, y: H, z: D / 2 } },
      { name: 'east', min: { x: W / 2, y: 0, z: -D / 2 }, max: { x: W / 2 + T, y: H, z: D / 2 } }
    );

    this.doorOpening = {
      min: { x: doorX - doorW / 2, z: D / 2 - 0.2 },
      max: { x: doorX + doorW / 2, z: D / 2 + T + 0.2 },
    };
  }

  baseboards(W, D, H, T, wallMat) {
    const trim = this.materials.inst('wood', 0x6a4a32);
    const h = 0.08;
    add(this.root, at(box(W, h, 0.03, trim), 0, h / 2, -D / 2 + 0.02));
    add(this.root, at(box(W, h, 0.03, trim), 0, h / 2, D / 2 - 0.02));
    add(this.root, at(box(0.03, h, D, trim), -W / 2 + 0.02, h / 2, 0));
    add(this.root, at(box(0.03, h, D, trim), W / 2 - 0.02, h / 2, 0));
    const crown = this.materials.inst('paint', this.ceilingColor);
    add(this.root, at(box(W, 0.04, 0.04, crown), 0, H - 0.03, -D / 2 + 0.03));
    add(this.root, at(box(W, 0.04, 0.04, crown), 0, H - 0.03, D / 2 - 0.03));
    add(this.root, at(box(0.04, 0.04, D, crown), -W / 2 + 0.03, H - 0.03, 0));
    add(this.root, at(box(0.04, 0.04, D, crown), W / 2 - 0.03, H - 0.03, 0));
    void wallMat;
    void T;
  }

  buildDoor(doorX, doorW, doorH, D, T) {
    const frameM = this.materials.inst('wood', 0x5a3d28);
    const doorM = this.materials.inst('wood', 0x6e4a30);
    const metal = this.materials.inst('metal', 0xc5b48a);
    const z = D / 2 + T / 2;
    add(this.root, at(box(0.08, doorH, 0.14, frameM), doorX - doorW / 2, doorH / 2, z));
    add(this.root, at(box(0.08, doorH, 0.14, frameM), doorX + doorW / 2, doorH / 2, z));
    add(this.root, at(box(doorW + 0.08, 0.08, 0.14, frameM), doorX, doorH + 0.02, z));

    const hinge = group('Door');
    hinge.position.set(doorX - doorW / 2 + 0.02, 0, z);
    const panel = at(box(doorW - 0.06, doorH - 0.04, 0.045, doorM, 'body'), (doorW - 0.06) / 2, doorH / 2, 0);
    add(hinge, panel);
    add(hinge, at(box(doorW - 0.18, 0.7, 0.01, this.materials.inst('wood', 0x7a5538)), (doorW - 0.06) / 2, 1.4, 0.025));
    add(hinge, at(box(doorW - 0.18, 0.7, 0.01, this.materials.inst('wood', 0x7a5538)), (doorW - 0.06) / 2, 0.55, 0.025));
    add(hinge, at(cyl(0.012, 0.012, 0.1, metal), doorW - 0.16, 1.0, 0.03));
    add(hinge, at(sphere(0.018, metal), doorW - 0.16, 1.0, 0.05));
    hinge.userData.interact = 'door';
    hinge.userData.displayName = 'Door';
    hinge.userData.selectable = true;
    hinge.userData.deletable = false;
    hinge.userData.structural = true;
    hinge.userData.actuators = [
      { target: hinge, type: 'rotate', axis: 'y', closed: 0, open: -1.85, current: 0, goal: 0, speed: 3.2 },
    ];
    this.door = hinge;
    this.root.add(hinge);
    this.interactables.push(hinge);
  }

  buildWindow(along, y, w, h, wallPos, rotY, id) {
    const frameM = this.materials.inst('wood', 0xefe8dc);
    const glassM = this.materials.inst('glass', 0xb9d4e6);
    const g = group(`Window-${id}`);
    if (rotY === 0) g.position.set(along, 0, wallPos);
    else g.position.set(wallPos, 0, along);
    g.rotation.y = rotY;

    add(g, at(box(w + 0.08, 0.05, 0.08, frameM), 0, y - h / 2, 0));
    add(g, at(box(w + 0.08, 0.05, 0.08, frameM), 0, y + h / 2, 0));
    add(g, at(box(0.05, h, 0.08, frameM), -w / 2, y, 0));
    add(g, at(box(0.05, h, 0.08, frameM), w / 2, y, 0));
    add(g, at(box(0.03, h, 0.04, frameM), 0, y, 0));
    add(g, at(box(w + 0.12, 0.04, 0.12, this.materials.inst('wood', 0x6a4a32)), 0, y - h / 2 - 0.03, 0.02));

    const paneL = at(box(w / 2 - 0.04, h - 0.08, 0.012, glassM), -w / 4, y, 0.01);
    const paneR = at(box(w / 2 - 0.04, h - 0.08, 0.012, glassM), w / 4, y, 0.01);
    paneL.castShadow = false;
    paneR.castShadow = false;
    add(g, paneL, paneR);

    const cloth = this.materials.inst('fabric', 0xcfc3ae);
    add(g, at(box(w + 0.16, 0.04, 0.05, this.materials.inst('wood', 0x6a4a32)), 0, y + h / 2 + 0.04, 0.06));
    add(g, at(box(0.12, h + 0.08, 0.03, cloth), -w / 2 - 0.02, y - 0.02, 0.08));
    add(g, at(box(0.16, h + 0.04, 0.03, cloth), w / 2 + 0.02, y - 0.04, 0.08));

    g.userData.interact = 'window';
    g.userData.displayName = 'Window';
    g.userData.selectable = true;
    g.userData.deletable = false;
    g.userData.structural = true;
    g.userData.actuators = [
      { target: paneL, type: 'slide', axis: 'x', closed: -w / 4, open: -w / 2 + 0.08, current: -w / 4, goal: -w / 4, speed: 2.4 },
    ];
    this.root.add(g);
    this.windows.push(g);
    this.interactables.push(g);
  }

  buildSwitch(x, y, z) {
    const g = group('Switch');
    const plate = this.materials.inst('plastic', 0xe8e2d6);
    const rocker = this.materials.inst('plastic', 0xf4efe6);
    add(g, at(box(0.08, 0.12, 0.015, plate, 'body'), 0, 0, 0));
    add(g, at(box(0.03, 0.05, 0.012, rocker), 0, 0.01, 0.01));
    g.position.set(x, y, z);
    g.userData.interact = 'switch';
    g.userData.displayName = 'Light switch';
    g.userData.selectable = true;
    g.userData.deletable = false;
    g.userData.lightBind = 'ceiling';
    this.switch = g;
    this.root.add(g);
    this.interactables.push(g);
  }

  buildOutside(W, D, H) {
    const sky = this.materials.inst('paint', 0x8aa7c0);
    sky.roughness = 1;
    sky.side = THREE.BackSide;
    const dome = new THREE.Mesh(new THREE.SphereGeometry(28, 24, 16), sky);
    dome.position.y = 4;
    dome.userData.sky = true;
    dome.castShadow = false;
    dome.receiveShadow = false;
    this.sky = dome;
    this.root.add(dome);

    const ground = this.materials.inst('concrete', 0x6a7468);
    const yard = box(40, 0.05, 40, ground);
    yard.position.y = -0.12;
    yard.receiveShadow = true;
    yard.castShadow = false;
    this.root.add(yard);
    void H;
    void W;
    void D;
  }

  applyWalls(type, color) {
    this.wallMatType = type;
    this.wallColor = color;
    this.root.traverse((ch) => {
      if (ch.isMesh && ch.parent?.name === 'wall' && ch.userData.slot === 'body') {
        this.materials.applyToMesh(ch, type, color);
        ch.material.side = THREE.DoubleSide;
      }
    });
  }

  applyFloor(type, color) {
    this.floorMatType = type;
    this.floorColor = color;
    this.materials.applyToMesh(this.floor, type, color);
    this.floor.receiveShadow = true;
  }

  applyCeiling(color) {
    this.ceilingColor = color;
    this.materials.applyToMesh(this.ceiling, 'paint', color);
  }

  setSky(color) {
    if (this.sky) this.sky.material.color.set(color);
  }

  serialize() {
    return {
      wallMatType: this.wallMatType,
      wallColor: this.wallColor,
      floorMatType: this.floorMatType,
      floorColor: this.floorColor,
      ceilingColor: this.ceilingColor,
    };
  }

  restore(data) {
    if (!data) return;
    this.applyWalls(data.wallMatType || 'paint', data.wallColor || this.wallColor);
    this.applyFloor(data.floorMatType || 'wood', data.floorColor || this.floorColor);
    this.applyCeiling(data.ceilingColor || this.ceilingColor);
  }

  innerBounds() {
    const { width: W, depth: D, height: H } = ROOM;
    return { minX: -W / 2, maxX: W / 2, minZ: -D / 2, maxZ: D / 2, minY: 0, maxY: H };
  }
}
