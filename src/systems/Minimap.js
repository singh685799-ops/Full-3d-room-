import { ROOM } from '../core/constants.js';
import { worldBox } from '../world/geom.js';

export class Minimap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.objects = [];
  }

  setObjects(list) {
    this.objects = list;
  }

  draw(player, room) {
    const ctx = this.ctx;
    const w = this.canvas.width;
    const h = this.canvas.height;
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#14181c';
    ctx.fillRect(0, 0, w, h);

    const pad = 10;
    const { width: W, depth: D } = ROOM;
    const sx = (w - pad * 2) / W;
    const sz = (h - pad * 2) / D;
    const mapX = (x) => pad + (x + W / 2) * sx;
    const mapZ = (z) => pad + (z + D / 2) * sz;

    ctx.strokeStyle = '#c9a36a';
    ctx.lineWidth = 2;
    ctx.strokeRect(pad, pad, w - pad * 2, h - pad * 2);

    ctx.fillStyle = 'rgba(201,163,106,0.18)';
    for (const obj of this.objects) {
      if (!obj.visible) continue;
      const box = worldBox(obj);
      const x1 = mapX(box.min.x);
      const y1 = mapZ(box.min.z);
      const x2 = mapX(box.max.x);
      const y2 = mapZ(box.max.z);
      ctx.fillRect(x1, y1, Math.max(2, x2 - x1), Math.max(2, y2 - y1));
    }

    if (room?.doorOpening) {
      ctx.fillStyle = '#7d9b84';
      const d = room.doorOpening;
      ctx.fillRect(mapX(d.min.x), mapZ(d.min.z) - 2, mapX(d.max.x) - mapX(d.min.x), 4);
    }

    ctx.save();
    ctx.translate(mapX(player.x), mapZ(player.z));
    ctx.rotate(-player.yaw);
    ctx.fillStyle = '#eee8df';
    ctx.beginPath();
    ctx.moveTo(0, -7);
    ctx.lineTo(5, 6);
    ctx.lineTo(0, 3);
    ctx.lineTo(-5, 6);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
}
