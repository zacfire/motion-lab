/**
 * RippleDotHeart — shared lattice + ripple math
 *
 * Inspired by Rocorgi's Dot Matrix Heart / RippleHeartAnimation
 * (lovethinking.vercel.app · Akureyri heart-shaped traffic lights).
 *
 * Same geometry as Roseau iOS `RoseauHeartbeatView` / HeartLattice.
 */
(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.RippleDotHeart = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  const LOGICAL_W = 20;
  const LOGICAL_H = 17;
  const CENTER = { x: 10, y: 8.5 };

  const RAW_DOTS = [
    [10.25, 15],
    [7.25, 12], [10.25, 12], [13.25, 12],
    [4.25, 9], [7.25, 9], [10.25, 9], [13.25, 9], [16.25, 9],
    [1.25, 6], [4.25, 6], [7.25, 6], [10.25, 6], [13.25, 6], [16.25, 6], [19.25, 6],
    [1.25, 3], [4.25, 3], [7.25, 3], [10.25, 3], [13.25, 3], [16.25, 3], [19.25, 3],
    [4.25, 0], [7.25, 0], [13.25, 0], [16.25, 0],
  ];

  const withDistance = RAW_DOTS.map(([x, y]) => {
    const dx = x - CENTER.x;
    const dy = y - CENTER.y;
    return { x, y, distance: Math.hypot(dx, dy) };
  });
  const maxDistance = Math.max(...withDistance.map((d) => d.distance));
  const DOTS = withDistance.map((d) => ({
    x: d.x,
    y: d.y,
    normalizedDistance: d.distance / maxDistance,
  }));

  function phase(progress, normalizedDistance) {
    let value = (progress - 0.5 * normalizedDistance + 1) % 1;
    if (value < 0) value += 1;
    return value;
  }

  function radiusAndAlpha(p) {
    if (p < 0.5) return { radius: 0.5 + 3 * p, alpha: 2 * p };
    return { radius: 2 - (p - 0.5) * 3, alpha: 1 - (p - 0.5) * 2 };
  }

  /**
   * @param {HTMLCanvasElement} canvas
   * @param {{
   *   dotColor?: string,
   *   duration?: number,
   *   interval?: number,
   *   cssWidth?: number,
   *   cssHeight?: number,
   *   reduceMotion?: boolean,
   *   alive?: boolean,
   * }} options
   */
  function mount(canvas, options = {}) {
    const ctx = canvas.getContext("2d");
    if (!ctx) return { destroy() {}, update() {} };

    let {
      dotColor = "#FF3366",
      duration = 1200,
      interval = 0,
      cssWidth = 20,
      cssHeight = 17,
      reduceMotion = false,
      alive = true,
    } = options;

    let raf = 0;
    const startedAt = performance.now();

    function resize() {
      const dpr = (typeof window !== "undefined" && window.devicePixelRatio) || 1;
      canvas.width = LOGICAL_W * dpr;
      canvas.height = LOGICAL_H * dpr;
      canvas.style.width = `${cssWidth}px`;
      canvas.style.height = `${cssHeight}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function drawAt(progressOrNull) {
      ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      if (!alive) {
        DOTS.forEach((dot) => {
          ctx.beginPath();
          ctx.globalAlpha = 0.28;
          ctx.fillStyle = dotColor;
          ctx.arc(dot.x, dot.y, 0.35, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
        return;
      }
      if (reduceMotion || progressOrNull == null) {
        DOTS.forEach((dot) => {
          ctx.beginPath();
          ctx.globalAlpha = 0.85;
          ctx.fillStyle = dotColor;
          ctx.arc(dot.x, dot.y, 0.85, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        });
        return;
      }
      DOTS.forEach((dot) => {
        const p = phase(progressOrNull, dot.normalizedDistance);
        const { radius, alpha } = radiusAndAlpha(p);
        ctx.beginPath();
        ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
        ctx.fillStyle = dotColor;
        ctx.arc(dot.x, dot.y, 0.5 * radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    function tick(now) {
      const cycle = duration + interval;
      const elapsed = (now - startedAt) % cycle;
      if (!alive || reduceMotion) {
        drawAt(null);
      } else if (elapsed <= duration) {
        drawAt(elapsed / duration);
      } else {
        ctx.clearRect(0, 0, LOGICAL_W, LOGICAL_H);
      }
      raf = requestAnimationFrame(tick);
    }

    resize();
    raf = requestAnimationFrame(tick);

    return {
      update(next = {}) {
        if (next.dotColor != null) dotColor = next.dotColor;
        if (next.duration != null) duration = next.duration;
        if (next.interval != null) interval = next.interval;
        if (next.cssWidth != null) cssWidth = next.cssWidth;
        if (next.cssHeight != null) cssHeight = next.cssHeight;
        if (next.reduceMotion != null) reduceMotion = next.reduceMotion;
        if (next.alive != null) alive = next.alive;
        resize();
      },
      /** Deterministic frame for export (progress in 0..1). */
      drawProgress(progress) {
        drawAt(progress);
      },
      destroy() {
        cancelAnimationFrame(raf);
      },
    };
  }

  return {
    LOGICAL_W,
    LOGICAL_H,
    DOTS,
    phase,
    radiusAndAlpha,
    mount,
  };
});
