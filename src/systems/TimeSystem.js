import * as THREE from 'three';

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function lerpHex(a, b, t) {
  const ca = new THREE.Color(a);
  const cb = new THREE.Color(b);
  return ca.lerp(cb, t);
}

export class TimeSystem {
  constructor() {
    this.minutes = 14 * 60;
  }

  setMinutes(m) {
    this.minutes = ((m % 1440) + 1440) % 1440;
  }

  setHMS(h, min = 0) {
    this.setMinutes(h * 60 + min);
  }

  get hours() {
    return this.minutes / 60;
  }

  label() {
    const h = Math.floor(this.minutes / 60);
    const m = Math.floor(this.minutes % 60);
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  }

  evaluate() {
    const t = this.hours;
    const dawn = smooth(t, 5.2, 7.4);
    const dusk = 1 - smooth(t, 17.4, 20.2);
    const day = Math.min(dawn, dusk);
    const night = 1 - day;
    const sunset = smooth(t, 16.6, 18.2) * (1 - smooth(t, 19.2, 20.8)) + smooth(t, 5.4, 6.4) * (1 - smooth(t, 7.0, 8.0));

    const sunColor = lerpHex(lerpHex('#1a2740', '#ffb070', sunset), '#fff3d4', day * (1 - sunset * 0.5));
    const sky = lerpHex(lerpHex('#0b1018', '#c47850', sunset), '#87a4bc', day);
    const ground = lerpHex('#16120f', '#5a4a3a', day);
    const bg = sky.getHexString();
    const angle = ((t - 6) / 12) * Math.PI;
    const sunPos = new THREE.Vector3(Math.cos(angle) * 10, Math.sin(angle) * 9 + 1.2, 4.5);

    return {
      minutes: this.minutes,
      label: this.label(),
      day,
      night,
      sunset,
      sunIntensity: lerp(0.02, 1.65, Math.pow(Math.max(0, day), 0.85)),
      hemiIntensity: lerp(0.08, 0.55, day),
      windowIntensity: lerp(0.15, 9.5, day),
      sunColor,
      skyColor: sky,
      groundColor: ground,
      windowColor: lerpHex('#6a80a8', '#e8f2ff', day),
      bg: `#${bg}`,
      sunPos,
      night: night > 0.55,
    };
  }
}

function smooth(x, a, b) {
  const t = THREE.MathUtils.clamp((x - a) / Math.max(0.0001, b - a), 0, 1);
  return t * t * (3 - 2 * t);
}
