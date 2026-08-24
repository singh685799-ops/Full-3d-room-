import * as THREE from 'three';
import { box, rbox, cyl, sphere, torus, plane, group, add, at, leafShape, lathe } from './geom.js';
import { getTexture } from '../gfx/textures.js';

function tag(root, extra) {
  Object.assign(root.userData, extra);
  return root;
}

function actuator(target, type, axis, closed, open, speed = 5) {
  return { target, type, axis, closed, open, current: closed, goal: closed, speed };
}

export function buildBed(mats) {
  const g = group('Platform Bed');
  const wood = mats.inst('wood', 0x4a2f22);
  const woodLight = mats.inst('wood', 0x7a5134);
  const linen = mats.inst('fabric', 0xe6dfd2);
  const duvet = mats.inst('fabric', 0xb7c3b0);
  const throwM = mats.inst('fabric', 0x8a4e3a);
  const metal = mats.inst('metal', 0x8d8680);

  add(g, at(box(1.72, 0.1, 2.18, wood, 'body'), 0, 0.16, 0.04));
  for (const [x, z] of [[-0.78, -0.96], [0.78, -0.96], [-0.78, 0.96], [0.78, 0.96]]) {
    add(g, at(cyl(0.035, 0.04, 0.12, metal, 'accent'), x, 0.06, z));
  }
  const head = at(rbox(1.72, 0.92, 0.08, 0.02, wood, 'body'), 0, 0.68, -1.08);
  add(g, head);
  add(g, at(rbox(1.56, 0.62, 0.04, 0.02, mats.inst('fabric', 0xcfc3b0), 'accent'), 0, 0.7, -1.03));
  add(g, at(rbox(1.54, 0.22, 2.02, 0.04, linen), 0, 0.32, 0.06));
  add(g, at(rbox(0.52, 0.13, 0.36, 0.04, linen), -0.38, 0.5, -0.78));
  add(g, at(rbox(0.52, 0.13, 0.36, 0.04, linen), 0.38, 0.5, -0.78));
  add(g, at(rbox(1.5, 0.07, 1.55, 0.03, duvet), 0, 0.46, 0.22));
  add(g, at(rbox(1.42, 0.045, 0.42, 0.02, throwM), 0, 0.5, 0.82));
  add(g, at(box(1.7, 0.02, 0.06, woodLight), 0, 0.22, 1.12));
  return tag(g, { type: 'bed', category: 'bedroom', mount: 'floor', solid: true, placeSolid: true });
}

export function buildNightstand(mats) {
  const g = group('Nightstand');
  const wood = mats.inst('wood', 0x5b3a24);
  const metal = mats.inst('metal', 0xc2b8a5);
  add(g, at(rbox(0.48, 0.42, 0.4, 0.012, wood, 'body'), 0, 0.33, 0));
  add(g, at(box(0.5, 0.03, 0.42, wood, 'body'), 0, 0.55, 0));
  const d1 = at(box(0.42, 0.12, 0.02, mats.inst('wood', 0x6a452c), 'body'), 0, 0.42, 0.2);
  const d2 = at(box(0.42, 0.12, 0.02, mats.inst('wood', 0x6a452c), 'body'), 0, 0.26, 0.2);
  add(g, d1, d2);
  add(g, at(box(0.08, 0.01, 0.02, metal), 0, 0.42, 0.215));
  add(g, at(box(0.08, 0.01, 0.02, metal), 0, 0.26, 0.215));
  for (const [x, z] of [[-0.18, -0.14], [0.18, -0.14], [-0.18, 0.14], [0.18, 0.14]]) {
    add(g, at(cyl(0.015, 0.015, 0.12, metal), x, 0.06, z));
  }
  d2.userData.part = 'drawer';
  return tag(g, {
    type: 'nightstand',
    category: 'bedroom',
    mount: 'floor',
    solid: true,
    placeSolid: true,
    actuators: [actuator(d2, 'slide', 'z', 0.2, 0.38)],
  });
}

export function buildDresser(mats) {
  const g = group('Dresser');
  const wood = mats.inst('wood', 0x6a4530);
  const metal = mats.inst('metal', 0xb9b0a2);
  add(g, at(rbox(1.2, 0.78, 0.46, 0.015, wood, 'body'), 0, 0.45, 0));
  add(g, at(box(1.24, 0.03, 0.5, wood, 'body'), 0, 0.86, 0));
  const drawers = [];
  for (let i = 0; i < 3; i++) {
    const y = 0.7 - i * 0.22;
    const face = at(box(1.08, 0.18, 0.02, mats.inst('wood', 0x7a553c), 'body'), 0, y, 0.23);
    add(g, face, at(box(0.16, 0.012, 0.02, metal), 0, y, 0.245));
    drawers.push(actuator(face, 'slide', 'z', 0.23, 0.42));
  }
  return tag(g, { type: 'dresser', category: 'bedroom', mount: 'floor', solid: true, placeSolid: true, actuators: drawers });
}

export function buildWardrobe(mats) {
  const g = group('Wardrobe');
  const wood = mats.inst('wood', 0x4e3424);
  const inner = mats.inst('wood', 0x6a4a32);
  const metal = mats.inst('metal', 0xc0b6a4);
  add(g, at(box(1.22, 2.16, 0.54, wood, 'body'), 0, 1.1, 0));
  add(g, at(box(1.14, 2.02, 0.02, inner), 0, 1.1, 0.1));
  add(g, at(box(1.1, 0.02, 0.4, inner), 0, 1.55, 0.02));
  add(g, at(box(1.1, 0.02, 0.4, inner), 0, 0.55, 0.02));
  add(g, at(cyl(0.012, 0.012, 1.05, metal), 0, 1.85, 0.02, 0, 0, Math.PI / 2));
  const left = group('doorL');
  left.position.set(-0.3, 1.1, 0.28);
  add(left, at(box(0.58, 2.08, 0.03, wood, 'body'), 0.29, 0, 0));
  add(left, at(cyl(0.01, 0.01, 0.12, metal), 0.5, 0, 0.03));
  const right = group('doorR');
  right.position.set(0.3, 1.1, 0.28);
  add(right, at(box(0.58, 2.08, 0.03, wood, 'body'), -0.29, 0, 0));
  add(right, at(cyl(0.01, 0.01, 0.12, metal), -0.5, 0, 0.03));
  add(g, left, right);
  return tag(g, {
    type: 'wardrobe',
    category: 'bedroom',
    mount: 'floor',
    solid: true,
    placeSolid: true,
    actuators: [
      actuator(left, 'rotate', 'y', 0, -1.9),
      actuator(right, 'rotate', 'y', 0, 1.9),
    ],
  });
}

export function buildVanity(mats) {
  const g = group('Vanity');
  const wood = mats.inst('wood', 0x8a6a48);
  const marble = mats.inst('marble', 0xf0ebe3);
  const glass = mats.inst('glass', 0xdde7ee);
  const metal = mats.inst('metal', 0xc5b89a);
  add(g, at(rbox(1.05, 0.62, 0.44, 0.015, wood, 'body'), 0, 0.35, 0));
  add(g, at(box(1.1, 0.03, 0.48, marble), 0, 0.68, 0));
  add(g, at(box(0.72, 0.7, 0.03, glass), 0, 1.1, -0.18));
  add(g, at(box(0.78, 0.04, 0.04, wood, 'body'), 0, 1.46, -0.18));
  add(g, at(box(0.04, 0.7, 0.04, wood, 'body'), -0.37, 1.1, -0.18));
  add(g, at(box(0.04, 0.7, 0.04, wood, 'body'), 0.37, 1.1, -0.18));
  add(g, at(sphere(0.035, mats.inst('ceramic', 0xe8d8c8)), -0.38, 0.74, 0.1));
  add(g, at(cyl(0.015, 0.02, 0.08, metal), 0.32, 0.74, 0.08));
  return tag(g, { type: 'vanity', category: 'bedroom', mount: 'floor', solid: true, placeSolid: true });
}

export function buildSofa(mats) {
  const g = group('Sofa');
  const wood = mats.inst('wood', 0x4a3426);
  const cloth = mats.inst('fabric', 0x6d6a62);
  const cush = mats.inst('fabric', 0x7a766c);
  add(g, at(rbox(1.86, 0.28, 0.82, 0.03, cloth, 'body'), 0, 0.28, 0));
  add(g, at(rbox(1.86, 0.42, 0.18, 0.03, cloth, 'body'), 0, 0.62, -0.32));
  add(g, at(rbox(0.16, 0.38, 0.82, 0.03, cloth, 'body'), -0.86, 0.5, 0));
  add(g, at(rbox(0.16, 0.38, 0.82, 0.03, cloth, 'body'), 0.86, 0.5, 0));
  add(g, at(rbox(0.84, 0.12, 0.62, 0.03, cush), -0.38, 0.48, 0.04));
  add(g, at(rbox(0.84, 0.12, 0.62, 0.03, cush), 0.38, 0.48, 0.04));
  add(g, at(rbox(0.7, 0.28, 0.12, 0.04, cush), -0.36, 0.72, -0.22));
  add(g, at(rbox(0.7, 0.28, 0.12, 0.04, cush), 0.36, 0.72, -0.22));
  for (const [x, z] of [[-0.8, -0.3], [0.8, -0.3], [-0.8, 0.3], [0.8, 0.3]]) {
    add(g, at(cyl(0.03, 0.03, 0.12, wood), x, 0.06, z));
  }
  return tag(g, { type: 'sofa', category: 'living', mount: 'floor', solid: true, placeSolid: true });
}

export function buildArmchair(mats) {
  const g = group('Armchair');
  const cloth = mats.inst('fabric', 0x6b4a38);
  const wood = mats.inst('wood', 0x3d2a1e);
  add(g, at(rbox(0.78, 0.22, 0.74, 0.03, cloth, 'body'), 0, 0.32, 0));
  add(g, at(rbox(0.78, 0.48, 0.14, 0.03, cloth, 'body'), 0, 0.66, -0.3));
  add(g, at(rbox(0.1, 0.28, 0.7, 0.02, cloth, 'body'), -0.35, 0.48, 0));
  add(g, at(rbox(0.1, 0.28, 0.7, 0.02, cloth, 'body'), 0.35, 0.48, 0));
  add(g, at(rbox(0.62, 0.08, 0.56, 0.03, mats.inst('fabric', 0x7a5844)), 0, 0.46, 0.02));
  for (const [x, z] of [[-0.28, -0.26], [0.28, -0.26], [-0.28, 0.26], [0.28, 0.26]]) {
    add(g, at(cyl(0.025, 0.025, 0.2, wood), x, 0.1, z));
  }
  return tag(g, { type: 'armchair', category: 'living', mount: 'floor', solid: true, placeSolid: true });
}

export function buildCoffeeTable(mats) {
  const g = group('Coffee Table');
  const wood = mats.inst('wood', 0x6e4b30);
  const metal = mats.inst('metal', 0x888480);
  add(g, at(rbox(1.05, 0.04, 0.58, 0.01, wood, 'body'), 0, 0.38, 0));
  add(g, at(rbox(0.9, 0.02, 0.46, 0.008, wood, 'body'), 0, 0.18, 0));
  for (const [x, z] of [[-0.44, -0.22], [0.44, -0.22], [-0.44, 0.22], [0.44, 0.22]]) {
    add(g, at(cyl(0.016, 0.016, 0.38, metal, 'accent'), x, 0.19, z));
  }
  return tag(g, { type: 'coffeeTable', category: 'living', mount: 'floor', solid: true, placeSolid: true });
}

export function buildSideTable(mats) {
  const g = group('Side Table');
  const wood = mats.inst('wood', 0x8a623e);
  add(g, at(cyl(0.2, 0.2, 0.03, wood, 'body'), 0, 0.48, 0));
  add(g, at(cyl(0.025, 0.03, 0.46, wood, 'body'), 0, 0.24, 0));
  add(g, at(cyl(0.16, 0.16, 0.03, wood, 'body'), 0, 0.03, 0));
  return tag(g, { type: 'sideTable', category: 'living', mount: 'floor', solid: true, placeSolid: true });
}

export function buildTvStand(mats) {
  const g = group('TV Stand');
  const wood = mats.inst('wood', 0x3a322c);
  const metal = mats.inst('metal', 0x77736e);
  add(g, at(rbox(1.6, 0.42, 0.42, 0.012, wood, 'body'), 0, 0.27, 0));
  add(g, at(box(1.64, 0.03, 0.46, wood, 'body'), 0, 0.5, 0));
  add(g, at(box(0.01, 0.28, 0.36, metal), 0, 0.26, 0.02));
  add(g, at(box(0.46, 0.02, 0.36, wood), -0.5, 0.22, 0));
  add(g, at(box(0.46, 0.02, 0.36, wood), 0.5, 0.22, 0));
  return tag(g, { type: 'tvStand', category: 'living', mount: 'floor', solid: true, placeSolid: true });
}

export function buildDesk(mats) {
  const g = group('Desk');
  const wood = mats.inst('wood', 0x8b623d);
  const metal = mats.inst('metal', 0x6e7278);
  add(g, at(rbox(1.46, 0.04, 0.7, 0.01, wood, 'body'), 0, 0.74, 0));
  add(g, at(box(0.06, 0.72, 0.64, wood, 'body'), -0.68, 0.36, 0));
  add(g, at(box(0.06, 0.72, 0.64, wood, 'body'), 0.68, 0.36, 0));
  add(g, at(box(0.36, 0.4, 0.6, wood, 'body'), 0.46, 0.22, 0));
  const drawer = at(box(0.32, 0.1, 0.02, mats.inst('wood', 0x9a7048), 'body'), 0.46, 0.48, 0.31);
  add(g, drawer, at(box(0.08, 0.01, 0.015, metal), 0.46, 0.48, 0.325));
  add(g, at(box(1.2, 0.02, 0.02, metal, 'accent'), 0, 0.62, -0.32));
  return tag(g, {
    type: 'desk',
    category: 'office',
    mount: 'floor',
    solid: true,
    placeSolid: true,
    actuators: [actuator(drawer, 'slide', 'z', 0.31, 0.48)],
  });
}

export function buildOfficeChair(mats) {
  const g = group('Office Chair');
  const cloth = mats.inst('fabric', 0x3e4248);
  const metal = mats.inst('metal', 0x9aa0a6);
  const plastic = mats.inst('plastic', 0x2a2c2e);
  add(g, at(rbox(0.46, 0.07, 0.46, 0.02, cloth, 'body'), 0, 0.5, 0));
  add(g, at(rbox(0.44, 0.5, 0.08, 0.02, cloth, 'body'), 0, 0.82, -0.2));
  add(g, at(cyl(0.03, 0.03, 0.28, metal), 0, 0.32, 0));
  add(g, at(cyl(0.08, 0.08, 0.04, plastic), 0, 0.18, 0));
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    const arm = at(box(0.28, 0.03, 0.04, metal), Math.cos(a) * 0.14, 0.16, Math.sin(a) * 0.14, 0, -a, 0);
    add(g, arm);
    add(g, at(sphere(0.03, plastic), Math.cos(a) * 0.28, 0.05, Math.sin(a) * 0.28));
  }
  add(g, at(box(0.06, 0.04, 0.28, plastic), -0.26, 0.64, 0));
  add(g, at(box(0.06, 0.04, 0.28, plastic), 0.26, 0.64, 0));
  return tag(g, { type: 'officeChair', category: 'office', mount: 'floor', solid: true, placeSolid: true });
}

export function buildBookshelf(mats) {
  const g = group('Bookshelf');
  const wood = mats.inst('wood', 0x5a3d28);
  add(g, at(box(0.92, 1.82, 0.3, wood, 'body'), 0, 0.92, 0));
  add(g, at(box(0.86, 1.74, 0.02, mats.inst('wood', 0x6c4a30)), 0, 0.92, -0.12));
  const ys = [0.18, 0.54, 0.9, 1.26, 1.62];
  for (const y of ys) add(g, at(box(0.86, 0.025, 0.26, wood, 'body'), 0, y, 0.01));
  const colors = [0x8a3b2a, 0x2f4a68, 0xc4a36a, 0x3d5a3c, 0x5a3d68, 0xb8733a, 0x2b2b2e, 0x7a5a32];
  const titles = [
    ['The Quiet Room', 'I. Moreau', 'A novella about light falling across an empty apartment at four in the afternoon.'],
    ['Joinery', 'P. Lang', 'Measured essays on making furniture that lasts longer than fashion.'],
    ['Night Windows', 'A. Chen', 'Short stories collected from city rooms after midnight.'],
    ['Grain', 'S. Okada', 'Photographs of timber, paper, and cloth.'],
    ['Atlas of Interiors', 'M. Voss', 'Floor plans and notes from houses the author never lived in.'],
    ['Soft Geometry', 'L. Hart', 'On cushions, corners, and the politics of comfort.'],
    ['Circuit & Dust', 'R. Patel', 'A technician’s diary from a decade of repairing old machines.'],
    ['House Plants', 'E. Nair', 'How living things change a room that was designed to be still.'],
  ];
  let bi = 0;
  for (let shelf = 0; shelf < 4; shelf++) {
    let x = -0.36;
    while (x < 0.36) {
      const w = 0.045 + (bi % 3) * 0.012;
      const h = 0.2 + (bi % 4) * 0.03;
      const book = at(box(w, h, 0.18, mats.inst('fabric', colors[bi % colors.length])), x, ys[shelf] + 0.025 + h / 2, 0.02);
      const info = titles[bi % titles.length];
      book.userData.interact = 'book';
      book.userData.book = { title: info[0], author: info[1], blurb: info[2] };
      book.userData.solid = false;
      add(g, book);
      x += w + 0.012;
      bi += 1;
    }
  }
  add(g, at(cyl(0.05, 0.06, 0.07, mats.inst('ceramic', 0xd9c6ae)), 0.28, 1.7, 0.02));
  return tag(g, { type: 'bookshelf', category: 'office', mount: 'floor', solid: true, placeSolid: true });
}

export function buildFilingCabinet(mats) {
  const g = group('Filing Cabinet');
  const metal = mats.inst('metal', 0x8a9096);
  const dark = mats.inst('metal', 0x5c6166);
  add(g, at(rbox(0.42, 1.05, 0.48, 0.01, metal, 'body'), 0, 0.54, 0));
  const acts = [];
  for (let i = 0; i < 3; i++) {
    const y = 0.84 - i * 0.3;
    const face = at(box(0.36, 0.24, 0.02, dark, 'body'), 0, y, 0.24);
    add(g, face, at(box(0.1, 0.012, 0.02, mats.inst('metal', 0xcac4b6)), 0, y, 0.255));
    acts.push(actuator(face, 'slide', 'z', 0.24, 0.42));
  }
  return tag(g, { type: 'filing', category: 'office', mount: 'floor', solid: true, placeSolid: true, actuators: acts });
}

export function buildCeilingPendant(mats) {
  const g = group('Pendant Light');
  const metal = mats.inst('metal', 0xc5b48a);
  const glass = mats.inst('glass', 0xf2e6c8);
  add(g, at(cyl(0.06, 0.06, 0.03, metal, 'accent'), 0, 0.02, 0));
  add(g, at(cyl(0.008, 0.008, 0.42, metal, 'accent'), 0, -0.2, 0));
  const shade = at(cyl(0.18, 0.12, 0.16, glass), 0, -0.48, 0);
  shade.userData.emissive = 0xffe6b0;
  shade.userData.emissiveIntensity = 0.35;
  add(g, shade);
  return tag(g, { type: 'pendant', category: 'lighting', mount: 'ceiling', solid: false, placeSolid: false, lightBind: 'ceiling' });
}

export function buildFloorLamp(mats) {
  const g = group('Floor Lamp');
  const metal = mats.inst('metal', 0xb7b0a4);
  const fabric = mats.inst('fabric', 0xe8dcc6);
  add(g, at(cyl(0.14, 0.16, 0.03, metal, 'accent'), 0, 0.02, 0));
  add(g, at(cyl(0.016, 0.016, 1.42, metal, 'accent'), 0, 0.73, 0));
  const shade = at(lathe([[0.2, 0], [0.18, 0.03], [0.14, 0.24], [0.16, 0.26]], fabric, 'body'), 0, 1.4, 0);
  shade.userData.emissive = 0xffe0b0;
  shade.userData.emissiveIntensity = 0.2;
  add(g, shade);
  return tag(g, { type: 'floorLamp', category: 'lighting', mount: 'floor', solid: true, placeSolid: true, lightBind: 'floor', interact: 'lamp' });
}

export function buildTableLamp(mats) {
  const g = group('Table Lamp');
  const ceramic = mats.inst('ceramic', 0xd9c4a8);
  const fabric = mats.inst('fabric', 0xf0e6d4);
  add(g, at(lathe([[0.08, 0], [0.09, 0.02], [0.06, 0.14], [0.03, 0.18]], ceramic, 'body'), 0, 0, 0));
  add(g, at(cyl(0.012, 0.012, 0.1, mats.inst('metal', 0xcfc6b4)), 0, 0.22, 0));
  const shade = at(lathe([[0.12, 0], [0.11, 0.02], [0.08, 0.14], [0.09, 0.15]], fabric), 0, 0.26, 0);
  shade.userData.emissive = 0xffd9a0;
  shade.userData.emissiveIntensity = 0.15;
  add(g, shade);
  return tag(g, { type: 'tableLamp', category: 'lighting', mount: 'floor', solid: false, placeSolid: false, lightBind: 'desk', interact: 'lamp' });
}

export function buildBedsideLamp(mats, bind = 'bedsideL') {
  const g = group('Bedside Lamp');
  const ceramic = mats.inst('ceramic', 0xe8d2b8);
  const fabric = mats.inst('fabric', 0xf4ead8);
  add(g, at(sphere(0.055, ceramic, 'body'), 0, 0.055, 0));
  add(g, at(cyl(0.012, 0.012, 0.1, mats.inst('metal', 0xcfc6b4)), 0, 0.13, 0));
  const shade = at(cyl(0.08, 0.1, 0.12, fabric), 0, 0.24, 0);
  shade.userData.emissive = 0xffd09a;
  add(g, shade);
  return tag(g, { type: 'bedsideLamp', category: 'lighting', mount: 'floor', solid: false, placeSolid: false, lightBind: bind, interact: 'lamp' });
}

export function buildSconce(mats) {
  const g = group('Wall Sconce');
  const metal = mats.inst('metal', 0xc5b48a);
  const glass = mats.inst('glass', 0xf3e6c4);
  add(g, at(box(0.08, 0.12, 0.03, metal, 'accent'), 0, 0.15, 0));
  add(g, at(cyl(0.01, 0.01, 0.1, metal), 0, 0.15, 0.06, Math.PI / 2, 0, 0));
  add(g, at(sphere(0.055, glass), 0, 0.15, 0.12));
  return tag(g, { type: 'sconce', category: 'lighting', mount: 'wall', solid: false, placeSolid: false });
}

let artSeed = 1;

export function buildPainting(mats, seed) {
  seed = seed ?? artSeed++;
  const g = group('Painting');
  const frame = mats.inst('wood', 0x5a4028);
  const art = mats.inst('paint', 0xffffff);
  art.map = getTexture('art', seed);
  art.roughness = 0.7;
  add(g, at(box(0.82, 0.58, 0.03, frame, 'body'), 0, 0.32, 0));
  add(g, at(box(0.7, 0.46, 0.01, art), 0, 0.32, 0.016));
  return tag(g, { type: 'painting', category: 'decoration', mount: 'wall', solid: false, placeSolid: false });
}

export function buildClock(mats) {
  const g = group('Clock');
  const metal = mats.inst('metal', 0xc5b48a);
  const faceM = mats.inst('paint', 0xf3eee4);
  add(g, at(cyl(0.16, 0.16, 0.04, metal, 'accent'), 0, 0.16, 0, Math.PI / 2, 0, 0));
  add(g, at(cyl(0.145, 0.145, 0.012, faceM), 0, 0.16, 0.018, Math.PI / 2, 0, 0));
  const hour = group('hourHand');
  hour.position.set(0, 0.16, 0.026);
  add(hour, at(box(0.016, 0.07, 0.006, mats.inst('metal', 0x2a2a2a)), 0, 0.028, 0));
  const minute = group('minuteHand');
  minute.position.set(0, 0.16, 0.03);
  add(minute, at(box(0.01, 0.1, 0.006, mats.inst('metal', 0x2a2a2a)), 0, 0.045, 0));
  add(g, hour, minute, at(sphere(0.012, metal), 0, 0.16, 0.032));
  return tag(g, { type: 'clock', category: 'decoration', mount: 'wall', solid: false, placeSolid: false, interact: 'clock' });
}

export function buildVase(mats) {
  const g = group('Vase');
  const cer = mats.inst('ceramic', 0xc9b49a);
  add(g, at(cyl(0.06, 0.08, 0.22, cer, 'body'), 0, 0.11, 0));
  add(g, at(cyl(0.05, 0.055, 0.04, cer, 'body'), 0, 0.24, 0));
  return tag(g, { type: 'vase', category: 'decoration', mount: 'floor', solid: false, placeSolid: false });
}

export function buildSculpture(mats) {
  const g = group('Sculpture');
  const stone = mats.inst('marble', 0xe6dfd4);
  add(g, at(box(0.16, 0.03, 0.16, stone, 'body'), 0, 0.02, 0));
  add(g, at(sphere(0.07, stone, 'body'), 0, 0.12, 0));
  add(g, at(box(0.04, 0.16, 0.04, stone, 'body'), 0, 0.24, 0, 0, 0, 0.4));
  add(g, at(box(0.14, 0.03, 0.03, stone, 'body'), 0.04, 0.3, 0, 0, 0.6, 0.2));
  return tag(g, { type: 'sculpture', category: 'decoration', mount: 'floor', solid: false, placeSolid: false });
}

export function buildRug(mats) {
  const g = group('Rug');
  const carpet = mats.inst('carpet', 0x6a4332);
  const m = at(rbox(2.4, 0.02, 1.6, 0.01, carpet, 'body'), 0, 0.012, 0);
  m.castShadow = false;
  add(g, m);
  add(g, at(box(2.2, 0.005, 0.04, mats.inst('fabric', 0xc9a36a)), 0, 0.02, 0));
  return tag(g, { type: 'rug', category: 'decoration', mount: 'floor', solid: false, placeSolid: false });
}

export function buildMirror(mats) {
  const g = group('Mirror');
  const wood = mats.inst('wood', 0x3e2c20);
  const glass = mats.inst('metal', 0xd5dee6);
  glass.roughness = 0.05;
  glass.metalness = 0.95;
  add(g, at(box(0.62, 0.92, 0.04, wood, 'body'), 0, 0.48, 0));
  add(g, at(box(0.5, 0.8, 0.01, glass), 0, 0.48, 0.02));
  return tag(g, { type: 'mirror', category: 'decoration', mount: 'wall', solid: false, placeSolid: false });
}

export function buildDesktop(mats) {
  const g = group('Desktop Computer');
  const plastic = mats.inst('plastic', 0x2b2e32);
  const metal = mats.inst('metal', 0x8b9096);
  add(g, at(rbox(0.18, 0.4, 0.38, 0.01, plastic, 'body'), 0, 0.22, 0));
  add(g, at(box(0.16, 0.08, 0.01, mats.inst('plastic', 0x1a1c1e)), 0, 0.28, 0.19));
  add(g, at(cyl(0.018, 0.018, 0.04, metal), 0, 0.08, 0.16, Math.PI / 2, 0, 0));
  return tag(g, { type: 'desktop', category: 'electronics', mount: 'floor', solid: true, placeSolid: true, interact: 'computer' });
}

export function buildLaptop(mats) {
  const g = group('Laptop');
  const metal = mats.inst('metal', 0xb7bcc2);
  const dark = mats.inst('plastic', 0x1c1e20);
  const screen = mats.inst('plastic', 0x0e141c);
  screen.emissive = new THREE.Color(0x1a3050);
  screen.emissiveIntensity = 0.35;
  add(g, at(rbox(0.34, 0.012, 0.22, 0.004, metal, 'body'), 0, 0.01, 0));
  add(g, at(box(0.3, 0.002, 0.16, dark), 0, 0.017, 0.01));
  const lid = group('lid');
  lid.position.set(0, 0.016, -0.11);
  add(lid, at(rbox(0.34, 0.22, 0.01, 0.004, metal, 'body'), 0, 0.11, 0));
  add(lid, at(box(0.3, 0.18, 0.004, screen), 0, 0.11, 0.008));
  lid.rotation.x = -0.2;
  add(g, lid);
  return tag(g, { type: 'laptop', category: 'electronics', mount: 'floor', solid: false, placeSolid: false, interact: 'computer' });
}

export function buildMonitor(mats) {
  const g = group('Monitor');
  const plastic = mats.inst('plastic', 0x1e2124);
  const screen = mats.inst('plastic', 0x102030);
  screen.emissive = new THREE.Color(0x183044);
  screen.emissiveIntensity = 0.45;
  add(g, at(rbox(0.58, 0.34, 0.03, 0.006, plastic, 'body'), 0, 0.32, 0));
  add(g, at(box(0.54, 0.3, 0.01, screen), 0, 0.32, 0.016));
  add(g, at(box(0.08, 0.14, 0.04, plastic, 'body'), 0, 0.12, -0.01));
  add(g, at(box(0.2, 0.015, 0.12, plastic, 'body'), 0, 0.04, 0.01));
  return tag(g, { type: 'monitor', category: 'electronics', mount: 'floor', solid: false, placeSolid: false, interact: 'computer' });
}

export function buildKeyboard(mats) {
  const g = group('Keyboard');
  const plastic = mats.inst('plastic', 0x2a2d32);
  const key = mats.inst('plastic', 0x3a3e44);
  add(g, at(rbox(0.36, 0.016, 0.12, 0.004, plastic, 'body'), 0, 0.01, 0));
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 12; c++) {
      add(g, at(box(0.022, 0.006, 0.022, key), -0.15 + c * 0.027, 0.02, -0.03 + r * 0.028));
    }
  }
  return tag(g, { type: 'keyboard', category: 'electronics', mount: 'floor', solid: false, placeSolid: false });
}

export function buildMouse(mats) {
  const g = group('Mouse');
  add(g, at(rbox(0.036, 0.018, 0.058, 0.008, mats.inst('plastic', 0x2c3036), 'body'), 0, 0.012, 0));
  return tag(g, { type: 'mouse', category: 'electronics', mount: 'floor', solid: false, placeSolid: false });
}

export function buildTv(mats) {
  const g = group('Television');
  const plastic = mats.inst('plastic', 0x16181a);
  const screen = mats.inst('plastic', 0x101820);
  screen.emissive = new THREE.Color(0x152030);
  screen.emissiveIntensity = 0.3;
  add(g, at(rbox(1.22, 0.7, 0.05, 0.008, plastic, 'body'), 0, 0.42, 0));
  add(g, at(box(1.14, 0.62, 0.012, screen), 0, 0.42, 0.022));
  add(g, at(box(0.2, 0.04, 0.12, plastic), 0, 0.04, 0));
  return tag(g, { type: 'tv', category: 'electronics', mount: 'floor', solid: true, placeSolid: true, interact: 'computer' });
}

export function buildSpeaker(mats) {
  const g = group('Speaker');
  const wood = mats.inst('wood', 0x3a2c24);
  const cloth = mats.inst('fabric', 0x2a2624);
  add(g, at(rbox(0.16, 0.32, 0.16, 0.01, wood, 'body'), 0, 0.16, 0));
  add(g, at(cyl(0.045, 0.045, 0.01, cloth), 0, 0.22, 0.082, Math.PI / 2, 0, 0));
  add(g, at(cyl(0.03, 0.03, 0.01, cloth), 0, 0.1, 0.082, Math.PI / 2, 0, 0));
  return tag(g, { type: 'speaker', category: 'electronics', mount: 'floor', solid: false, placeSolid: false });
}

function makePlant(mats, name, height, potColor, leafColor, count) {
  const g = group(name);
  const pot = mats.inst('ceramic', potColor);
  const soil = mats.inst('concrete', 0x2c241c);
  const leafM = mats.inst('fabric', leafColor);
  leafM.side = THREE.DoubleSide;
  add(g, at(lathe([[0.09, 0], [0.1, 0.02], [0.085, 0.14], [0.07, 0.16]], pot, 'body'), 0, 0, 0));
  add(g, at(cyl(0.07, 0.07, 0.02, soil), 0, 0.155, 0));
  for (let i = 0; i < count; i++) {
    const a = (i / count) * Math.PI * 2;
    const stem = at(cyl(0.008, 0.012, height * 0.55, mats.inst('wood', 0x3d5a32)), Math.cos(a) * 0.03, 0.16 + height * 0.28, Math.sin(a) * 0.03);
    add(g, stem);
    for (let k = 0; k < 4; k++) {
      const lf = new THREE.Mesh(leafShape(), leafM);
      lf.castShadow = true;
      lf.position.set(Math.cos(a + k) * 0.08, 0.22 + k * (height * 0.18), Math.sin(a + k) * 0.08);
      lf.rotation.set(-0.8, a + k * 0.7, 0.2);
      lf.scale.setScalar(1.2 + (k % 3) * 0.3);
      g.add(lf);
    }
  }
  return tag(g, { type: name.toLowerCase().replace(/\s+/g, ''), category: 'plants', mount: 'floor', solid: false, placeSolid: true });
}

export function buildTallPlant(mats) {
  return makePlant(mats, 'Tall Plant', 0.9, 0xcfc0aa, 0x3f6b45, 6);
}

export function buildMediumPlant(mats) {
  return makePlant(mats, 'Medium Plant', 0.55, 0xd8c2a6, 0x4a7a4e, 5);
}

export function buildSucculent(mats) {
  const g = group('Succulent');
  add(g, at(cyl(0.055, 0.065, 0.08, mats.inst('ceramic', 0xe8d8c4), 'body'), 0, 0.04, 0));
  const leaf = mats.inst('fabric', 0x6a9a6e);
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2;
    add(g, at(sphere(0.025, leaf), Math.cos(a) * 0.035, 0.1, Math.sin(a) * 0.035));
  }
  add(g, at(sphere(0.03, leaf), 0, 0.13, 0));
  return tag(g, { type: 'succulent', category: 'plants', mount: 'floor', solid: false, placeSolid: false });
}

export function buildHangingPlant(mats) {
  const g = group('Hanging Plant');
  const pot = mats.inst('ceramic', 0xcbb79a);
  const leaf = mats.inst('fabric', 0x4d7a48);
  leaf.side = THREE.DoubleSide;
  add(g, at(cyl(0.07, 0.05, 0.1, pot, 'body'), 0, -0.12, 0));
  add(g, at(cyl(0.004, 0.004, 0.18, mats.inst('metal', 0xb0a890)), 0, 0.02, 0));
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    const lf = new THREE.Mesh(leafShape(), leaf);
    lf.position.set(Math.cos(a) * 0.08, -0.2 - (i % 3) * 0.05, Math.sin(a) * 0.08);
    lf.rotation.set(0.4, a, 0.3);
    g.add(lf);
  }
  return tag(g, { type: 'hangingPlant', category: 'plants', mount: 'ceiling', solid: false, placeSolid: false });
}

export function buildCeilingFan(mats) {
  const g = group('Ceiling Fan');
  const metal = mats.inst('metal', 0xb8b2a8);
  const wood = mats.inst('wood', 0x6a4e34);
  add(g, at(cyl(0.08, 0.08, 0.03, metal, 'accent'), 0, 0, 0));
  add(g, at(cyl(0.015, 0.015, 0.18, metal), 0, -0.1, 0));
  const motor = at(cyl(0.1, 0.12, 0.08, metal, 'accent'), 0, -0.22, 0);
  add(g, motor);
  const rotor = group('rotor');
  rotor.position.set(0, -0.22, 0);
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * Math.PI * 2;
    const blade = at(rbox(0.72, 0.015, 0.12, 0.006, wood, 'body'), Math.cos(a) * 0.38, 0, Math.sin(a) * 0.38, 0, -a, 0.05);
    rotor.add(blade);
  }
  add(g, rotor);
  const kit = at(cyl(0.08, 0.08, 0.04, mats.inst('glass', 0xf2e4c0)), 0, -0.28, 0);
  kit.userData.emissive = 0xffe6b8;
  add(g, kit);
  return tag(g, {
    type: 'ceilingFan',
    category: 'lighting',
    mount: 'ceiling',
    solid: false,
    placeSolid: false,
    interact: 'fan',
    rotor,
    spinning: false,
  });
}

export function buildOttoman(mats) {
  const g = group('Ottoman');
  const cloth = mats.inst('fabric', 0x7a4e3a);
  add(g, at(rbox(0.62, 0.28, 0.62, 0.04, cloth, 'body'), 0, 0.22, 0));
  add(g, at(box(0.5, 0.02, 0.5, mats.inst('wood', 0x4a3224)), 0, 0.07, 0));
  return tag(g, { type: 'ottoman', category: 'living', mount: 'floor', solid: true, placeSolid: true });
}

export function buildBook(mats) {
  const g = group('Book');
  const cover = mats.inst('fabric', 0x6a3030);
  add(g, at(box(0.16, 0.03, 0.22, cover, 'body'), 0, 0.016, 0));
  add(g, at(box(0.15, 0.022, 0.2, mats.inst('paint', 0xf3eee4)), 0, 0.016, 0.002));
  g.userData.interact = 'book';
  g.userData.book = {
    title: 'A Room of One’s Own',
    author: 'Studio Notes',
    blurb: 'A slim volume left on the table. The margins are full of measurements and little sketches of chairs.',
  };
  return tag(g, { type: 'book', category: 'decoration', mount: 'floor', solid: false, placeSolid: false, interact: 'book' });
}

export function buildDeskLamp(mats) {
  const g = group('Desk Lamp');
  const metal = mats.inst('metal', 0xb7c0c8);
  add(g, at(cyl(0.07, 0.08, 0.02, metal, 'accent'), 0, 0.01, 0));
  add(g, at(cyl(0.012, 0.012, 0.22, metal, 'accent'), 0, 0.12, 0, 0, 0, 0.5));
  add(g, at(cyl(0.012, 0.012, 0.18, metal, 'accent'), 0.08, 0.28, 0, 0, 0, -0.7));
  const head = at(cyl(0.045, 0.07, 0.08, metal, 'body'), 0.16, 0.34, 0, 0, 0, 1.2);
  add(g, head);
  return tag(g, { type: 'deskLamp', category: 'lighting', mount: 'floor', solid: false, placeSolid: false, lightBind: 'desk', interact: 'lamp' });
}
