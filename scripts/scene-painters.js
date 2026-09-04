/* eslint-env browser */
// Browser-side painters for the CRT scene placeholders. Loaded into a Chrome
// page by scripts/make-scene-placeholders.mjs via addScriptTag, so this file is
// plain script rather than a module and talks to the page through window.
//
// Every painter writes light on black: the value it puts down IS the emission
// the tube will show, so nothing here exceeds the luminance budget the finished
// artwork has to stay inside.

(function () {
  /** Deterministic noise, so a re-run reproduces the same placeholder. */
  function seeded(seed) {
    let s = seed || 1;
    return () => {
      s = (s * 1664525 + 1013904223) % 4294967296;
      return s / 4294967296;
    };
  }

  /** Far plane: a haze band and a low, dim skyline. */
  function farSkyline(ctx, w, h, a) {
    const rnd = seeded(a.seed);
    const horizon = h * 0.62;
    const g = ctx.createLinearGradient(0, horizon - h * 0.3, 0, horizon);
    g.addColorStop(0, 'rgba(255,255,255,0)');
    g.addColorStop(1, 'rgba(255,255,255,' + a.haze + ')');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, w, horizon);

    ctx.fillStyle = 'rgba(255,255,255,' + a.value + ')';
    let x = -40;
    while (x < w + 40) {
      const bw = 40 + rnd() * 130;
      const bh = (0.06 + rnd() * 0.22) * h;
      ctx.fillRect(x, horizon - bh, bw - 6, bh);
      x += bw;
    }
  }

  /** Mid plane: taller towers carrying lit window grids. */
  function midTowers(ctx, w, h, a) {
    const rnd = seeded(a.seed);
    const base = h * 0.78;
    let x = -60;
    while (x < w + 60) {
      const bw = 90 + rnd() * 190;
      const bh = (0.2 + rnd() * 0.5) * h;
      const top = base - bh;
      ctx.fillStyle = 'rgba(255,255,255,' + a.value * 0.55 + ')';
      ctx.fillRect(x, top, bw - 10, bh);

      // The window grid is the only thing in the placeholder that reads as city.
      const cols = Math.max(2, Math.floor((bw - 10) / 22));
      const rows = Math.max(3, Math.floor(bh / 30));
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          if (rnd() > 0.42) continue;
          ctx.fillStyle = 'rgba(255,255,255,' + a.value * (0.5 + rnd() * 0.5) + ')';
          ctx.fillRect(x + 8 + c * 22, top + 12 + r * 30, 9, 14);
        }
      }
      x += bw;
    }
  }

  /**
   * Far plane for a street-level scene: no skyline at all, just what is burning
   * beyond the end of the road. Wide, low and soft — the light the foreground is
   * silhouetted against.
   */
  function fireGlow(ctx, w, h, a) {
    const rnd = seeded(a.seed);
    const horizon = h * 0.74;

    // Three overlapping blooms rather than one, so the glow has a shape.
    for (let i = 0; i < 3; i++) {
      const cx = w * (0.2 + rnd() * 0.6);
      const r = w * (0.18 + rnd() * 0.22);
      const g = ctx.createRadialGradient(cx, horizon, 0, cx, horizon, r);
      g.addColorStop(0, 'rgba(255,255,255,' + a.value + ')');
      g.addColorStop(0.45, 'rgba(255,255,255,' + a.value * 0.35 + ')');
      g.addColorStop(1, 'rgba(255,255,255,0)');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    }

    // A haze layer above the fire: smoke catching the light from underneath.
    const sm = ctx.createLinearGradient(0, horizon - h * 0.42, 0, horizon);
    sm.addColorStop(0, 'rgba(255,255,255,0)');
    sm.addColorStop(1, 'rgba(255,255,255,' + a.haze + ')');
    ctx.fillStyle = sm;
    ctx.fillRect(0, 0, w, horizon);
  }

  /**
   * Mid plane for a street-level scene: the things standing between the viewer
   * and the fire. Barricade slabs at ground level, and tall bipedal machines —
   * two legs, a torso and a head — which is what makes it read as a street with
   * machines in it rather than as a skyline.
   */
  function barricade(ctx, w, h, a) {
    const rnd = seeded(a.seed);
    const ground = h * 0.86;

    // Debris: irregular slabs at angles, low and broken.
    for (let i = 0; i < a.slabs; i++) {
      const bw = w * (0.03 + rnd() * 0.09);
      const bh = h * (0.04 + rnd() * 0.13);
      const x = rnd() * w;
      ctx.save();
      ctx.translate(x, ground - bh * 0.5);
      ctx.rotate((rnd() - 0.5) * 0.7);
      ctx.fillStyle = 'rgba(255,255,255,' + a.value * (0.5 + rnd() * 0.5) + ')';
      ctx.fillRect(-bw / 2, -bh / 2, bw, bh);
      ctx.restore();
    }

    // Machines: a head and a half taller than the crowd in front of them, and
    // thinner. Any larger and they stop being figures in a street and become
    // architecture, which is the other scene's job.
    for (let i = 0; i < a.machines; i++) {
      const s = 0.8 + rnd() * 0.5;
      const cx = w * (0.06 + rnd() * 0.88);
      const legH = h * 0.15 * s;
      const torsoH = h * 0.1 * s;
      const bw = h * 0.036 * s;
      ctx.fillStyle = 'rgba(255,255,255,' + a.value + ')';
      // Two legs, splayed.
      ctx.fillRect(cx - bw * 0.5, ground - legH, bw * 0.22, legH);
      ctx.fillRect(cx + bw * 0.3, ground - legH, bw * 0.22, legH);
      // Torso.
      ctx.fillRect(cx - bw * 0.55, ground - legH - torsoH, bw * 1.1, torsoH);
      // Head, offset to one side: nothing symmetrical reads as alive.
      ctx.fillRect(cx - bw * 0.1, ground - legH - torsoH - bw * 0.5, bw * 0.62, bw * 0.5);
      // One arm, out.
      ctx.fillRect(cx + bw * 0.5, ground - legH - torsoH * 0.8, bw * 0.75, bw * 0.16);
    }
  }

  /** Near plane: a hard silhouette edge — a rooftop, or the backs of a crowd. */
  function nearEdge(ctx, w, h, a) {
    const rnd = seeded(a.seed);
    ctx.fillStyle = 'rgba(255,255,255,' + a.value + ')';
    ctx.beginPath();
    ctx.moveTo(0, h);
    let x = 0;
    let y = h * (0.72 + rnd() * 0.08);
    ctx.lineTo(0, y);
    while (x < w) {
      const step = 60 + rnd() * 160;
      y += (rnd() - 0.5) * h * 0.09;
      y = Math.min(h * 0.92, Math.max(h * 0.6, y));
      ctx.lineTo(x, y);
      ctx.lineTo(x + step, y);
      x += step;
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fill();

    for (let i = 0; i < a.spikes; i++) {
      const px = rnd() * w;
      const ph = h * (0.05 + rnd() * 0.14);
      ctx.fillRect(px, h * 0.72 - ph, 4, ph);
    }
  }

  /** A crowd of back-lit capsule figures — the stand-in for people. */
  function crowd(ctx, w, h, a) {
    const rnd = seeded(a.seed);
    const base = h * 0.95;
    for (let i = 0; i < a.count; i++) {
      const s = 0.55 + rnd() * 0.75;
      const cx = rnd() * w;
      const bodyH = h * 0.2 * s;
      const bodyW = bodyH * 0.34;
      ctx.fillStyle = 'rgba(255,255,255,' + a.value * (0.6 + rnd() * 0.4) + ')';
      ctx.beginPath();
      ctx.roundRect(cx - bodyW / 2, base - bodyH, bodyW, bodyH, bodyW * 0.4);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(cx, base - bodyH - bodyW * 0.42, bodyW * 0.38, 0, Math.PI * 2);
      ctx.fill();
      // One arm up in three, which is what makes a crowd read as a crowd.
      if (rnd() > 0.66) {
        ctx.fillRect(cx + bodyW * 0.3, base - bodyH - bodyH * 0.45, bodyW * 0.16, bodyH * 0.5);
      }
    }
  }

  /** Sparse highlights: embers, or rain. Drawn last, and brightest. */
  function sparks(ctx, w, h, a) {
    const rnd = seeded(a.seed);
    for (let i = 0; i < a.count; i++) {
      const x = rnd() * w;
      const y = rnd() * h * 0.9;
      const len = a.streak ? 18 + rnd() * 46 : 2;
      ctx.strokeStyle = 'rgba(255,255,255,' + a.value * (0.3 + rnd() * 0.7) + ')';
      ctx.lineWidth = 1 + rnd() * 1.6;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (a.streak ? -6 : 0), y + len);
      ctx.stroke();
    }
  }

  window.PAINTERS = { farSkyline, midTowers, fireGlow, barricade, nearEdge, crowd, sparks };

  /** Paint one layer onto the shared canvas and hand back an encoded WebP. */
  window.paintLayer = function (painter, w, h, a, quality) {
    const c = document.getElementById('c');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    window.PAINTERS[painter](ctx, w, h, a);
    return c.toDataURL('image/webp', quality);
  };

  /** Luminance lifted into alpha, on a white plate. What tinting works against. */
  function toMask(img, w, h) {
    const m = document.createElement('canvas');
    m.width = w;
    m.height = h;
    const mc = m.getContext('2d', { willReadFrequently: true });
    mc.drawImage(img, 0, 0, w, h);
    const d = mc.getImageData(0, 0, w, h);
    const px = d.data;
    for (let i = 0; i < px.length; i += 4) {
      const a = (px[i] * 0.2126 + px[i + 1] * 0.7152 + px[i + 2] * 0.0722) | 0;
      px[i] = 255;
      px[i + 1] = 255;
      px[i + 2] = 255;
      px[i + 3] = a;
    }
    mc.putImageData(d, 0, 0);
    return m;
  }

  /**
   * Stack already-encoded layers the way the runtime compositor does, so the file
   * a visitor without WebGPU sees is the same picture the tube would have shown
   * rather than a different arrangement of the same parts.
   *
   * Two polarities, and they are not the same operation. On glass the emissive
   * planes add — black contributes nothing under `lighter`, which is why the
   * plates need no alpha channel — and an occluder subtracts, because it is the
   * shape standing in front of the light. On paper every plane is ink laid over
   * what is already there, the occluder included, and plate luminance becomes ink
   * coverage rather than emission.
   *
   * The background goes on last in both cases, underneath, filling the holes the
   * occluders opened.
   *
   * `layers` is [{ src, occluder }]. `paperInk` is `{ ground, ink, wash }` and
   * passing it is what selects the paper path — this runs in a page with none of
   * the site's CSS, so it cannot resolve a token for itself and the caller reads
   * them out of the theme instead.
   */
  window.flatten = async function (layers, w, h, quality, paperInk) {
    const paper = Boolean(paperInk);
    const c = document.getElementById('c');
    c.width = w;
    c.height = h;
    const ctx = c.getContext('2d');
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, w, h);

    for (const layer of layers) {
      const img = new Image();
      img.src = layer.src;
      await img.decode();

      if (paper) {
        // Ink: the mask carries the coverage and the fill carries the value.
        // Held under full strength for the same reason crt-scene.ts holds it —
        // several planes of solid ink stacked on paper reach the value of the
        // type that has to be read over them.
        const m = toMask(img, w, h);
        const mc = m.getContext('2d');
        mc.globalCompositeOperation = 'source-in';
        mc.fillStyle = layer.occluder ? paperInk.ink : paperInk.wash;
        mc.fillRect(0, 0, w, h);
        ctx.globalCompositeOperation = 'source-over';
        ctx.drawImage(m, 0, 0, w, h);
        continue;
      }

      if (layer.occluder) {
        // The plates are opaque, so the alpha `destination-out` needs has to be
        // lifted out of the luminance first, exactly as crt-scene.ts does.
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(toMask(img, w, h), 0, 0, w, h);
        continue;
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(img, 0, 0, w, h);
    }

    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = paper ? paperInk.ground : '#000';
    ctx.fillRect(0, 0, w, h);
    return c.toDataURL('image/webp', quality);
  };
})();
