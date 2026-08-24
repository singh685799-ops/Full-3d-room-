export class PerformanceMonitor {
  constructor(renderer) {
    this.renderer = renderer;
    this.frames = 0;
    this.fps = 0;
    this.acc = 0;
    this.info = renderer.info;
  }

  update(dt) {
    this.frames += 1;
    this.acc += dt;
    if (this.acc >= 0.4) {
      this.fps = Math.round(this.frames / this.acc);
      this.frames = 0;
      this.acc = 0;
    }
  }

  snapshot(extra = {}) {
    const info = this.info;
    const gl = this.renderer.getContext();
    const dbg = gl.getExtension?.('WEBGL_debug_renderer_info');
    const gpu = dbg ? gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL) : gl.getParameter(gl.RENDERER);
    return {
      fps: this.fps,
      calls: info.render.calls,
      triangles: info.render.triangles,
      objects: extra.objects ?? 0,
      mode: extra.mode ?? '',
      gpu: String(gpu || 'WebGL'),
    };
  }
}
