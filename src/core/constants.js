export const ROOM = {
  width: 8,
  depth: 6.2,
  height: 2.78,
  wall: 0.12,
};

export const PLAYER = {
  radius: 0.22,
  height: 1.7,
  eye: 1.58,
  speed: 2.35,
  sprint: 3.6,
};

export const LIMITS = {
  minScale: 0.5,
  maxScale: 1.8,
};

export const STORAGE_KEY = 'atrium.rooms.v1';
export const STORAGE_META = 'atrium.meta.v1';

export const MATERIAL_TYPES = [
  'wood',
  'metal',
  'glass',
  'fabric',
  'plastic',
  'ceramic',
  'concrete',
  'paint',
  'carpet',
  'marble',
];

export const MATERIAL_LABELS = {
  wood: 'Wood',
  metal: 'Metal',
  glass: 'Glass',
  fabric: 'Fabric',
  plastic: 'Plastic',
  ceramic: 'Ceramic',
  concrete: 'Concrete',
  paint: 'Painted',
  carpet: 'Carpet',
  marble: 'Marble',
};

export const CATEGORIES = [
  { id: 'bedroom', label: 'Bedroom' },
  { id: 'living', label: 'Living' },
  { id: 'office', label: 'Office' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'decoration', label: 'Decoration' },
  { id: 'electronics', label: 'Electronics' },
  { id: 'plants', label: 'Plants' },
];

export const DEFAULT_LIGHTS = {
  ceiling: { name: 'Ceiling', on: true, intensity: 1.15, color: '#fff4e0' },
  desk: { name: 'Desk lamp', on: true, intensity: 0.85, color: '#ffd7a1' },
  bedsideL: { name: 'Bedside L', on: false, intensity: 0.7, color: '#ffc98a' },
  bedsideR: { name: 'Bedside R', on: false, intensity: 0.7, color: '#ffc98a' },
  floor: { name: 'Floor lamp', on: true, intensity: 0.75, color: '#ffe4bc' },
  ambient: { name: 'Ambient', on: true, intensity: 0.35, color: '#c9d6e2' },
};
