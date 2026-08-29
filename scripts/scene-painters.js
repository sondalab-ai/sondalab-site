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

  window.PAINTERS = { farSkyline, midTowers, nearEdge, crowd, sparks };

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

  /**
   * Stack already-encoded layers the way the runtime compositor does on the dark
   * theme, so the file a visitor without WebGPU sees is the same picture the tube
   * would have shown rather than a different arrangement of the same parts.
   *
   * Emissive planes add — black contributes nothing under `lighter`, which is why
   * the plates need no alpha channel. An occluder subtracts instead: it is the
   * shape standing in front of the light, and adding it would turn a silhouette
   * into a slab. The background goes on last, underneath, filling the holes the
   * occluders opened.
   *
   * `layers` is [{ src, occluder }].
   */
  window.flatten = async function (layers, w, h, quality) {
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
      if (layer.occluder) {
        // The plates are opaque, so the alpha `destination-out` needs has to be
        // lifted out of the luminance first, exactly as crt-scene.ts does.
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
        ctx.globalCompositeOperation = 'destination-out';
        ctx.drawImage(m, 0, 0, w, h);
        continue;
      }
      ctx.globalCompositeOperation = 'lighter';
      ctx.drawImage(img, 0, 0, w, h);
    }

    ctx.globalCompositeOperation = 'destination-over';
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, w, h);
    return c.toDataURL('image/webp', quality);
  };
})();
