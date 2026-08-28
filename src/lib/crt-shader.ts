/**
 * CRT faceplate shader for the hero terminal.
 *
 * The terminal's text is drawn on a 2D canvas and uploaded as a texture; this
 * shader turns that flat image into a tube: curvature, a refracting glass
 * faceplate, phosphor structure, and tape rot. Every colour it introduces on
 * its own is a neutral (room light, lamp white); everything with hue comes in
 * through the texture, whose colours are read from design-system tokens.
 */
export const CRT_SHADER = /* wgsl */ `
struct Params {
  resolution: vec2f,
  time: f32,
  curvature: f32,
  bezel: f32,
  overscan: f32,
  gain: f32,
  ior: f32,
  glassDepth: f32,
  rimPower: f32,
  reflectPower: f32,
  scanDepth: f32,
  scanCount: f32,
  maskDepth: f32,
  glowPower: f32,
  glowRadius: f32,
  splitAmount: f32,
  tearAmount: f32,
  tearRate: f32,
  trackingAmount: f32,
  dropoutAmount: f32,
  rollAmount: f32,
  noiseAmount: f32,
  glowTaps: f32,
  polarity: f32,
  vignette: f32,
  surround: vec3f,
  screenBg: vec3f,
}

@group(0) @binding(0) var<uniform> params: Params;
@group(0) @binding(1) var term_tex: texture_2d<f32>;
@group(0) @binding(2) var term_samp: sampler;

fn hash21(p: vec2f) -> f32 {
  var q = fract(p * vec2f(123.34, 456.21));
  q += dot(q, q + 45.32);
  return fract(q.x * q.y);
}

fn hash11(x: f32) -> f32 {
  return fract(sin(x * 78.233) * 43758.5453);
}

/** CRT bulge: push the sampling coordinate outward so the picture sits on a tube. */
fn curve(uv: vec2f, amount: f32) -> vec2f {
  let c = uv * 2.0 - 1.0;
  return (c * (1.0 + dot(c, c) * amount)) * 0.5 + 0.5;
}

/**
 * Horizontal band displacement. Bands are quantised in y and re-rolled over
 * time so they snap rather than slide, plus one wider tracking error sweeping
 * up the screen as on a worn tape.
 */
fn tear(uv: vec2f, t: f32) -> vec2f {
  var out = uv;
  let band = floor(uv.y * 28.0);
  let seed = floor(t * params.tearRate);
  if (hash21(vec2f(band, seed)) > 0.90) {
    out.x += (hash21(vec2f(band, seed + 7.0)) - 0.5) * params.tearAmount;
  }
  let sweep = fract(t * 0.12);
  let d = abs(uv.y - sweep);
  if (d < 0.045) {
    let k = 1.0 - d / 0.045;
    out.x += sin(uv.y * 180.0 + t * 30.0) * 0.012 * k * params.trackingAmount;
    out.y += k * 0.004 * params.trackingAmount;
  }
  return out;
}

/**
 * Everything below works in emission — how far a pixel is from the screen's own
 * background — rather than in colour. On the dark theme that is the pixel
 * itself; on the light theme the screen is paper and the glyphs are ink, so
 * emission is the distance back towards the paper. Scanlines, the phosphor
 * halo and the grain then behave the same way on both, and only the final
 * conversion differs.
 */
fn sampleTerm(uv: vec2f) -> vec3f {
  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return select(vec3f(0.0), vec3f(0.0), params.polarity > 0.5);
  }
  let c = textureSampleLevel(term_tex, term_samp, uv, 0.0).rgb;
  return select(c, max(params.screenBg - c, vec3f(0.0)), params.polarity > 0.5);
}

/** Misconvergence: the three guns drift apart towards the edge of the tube. */
fn sampleSplit(uv: vec2f, amount: f32) -> vec3f {
  let off = (uv - 0.5) * amount;
  return vec3f(sampleTerm(uv + off).r, sampleTerm(uv).g, sampleTerm(uv - off).b);
}

/** Phosphor halo. The tap count drops on small screens, where it dominates cost. */
fn phosphorGlow(uv: vec2f) -> vec3f {
  var acc = vec3f(0.0);
  let taps = i32(params.glowTaps);
  let aspect = params.resolution.x / max(params.resolution.y, 1.0);
  let step = 6.28318531 / f32(taps);
  for (var i = 0; i < taps; i++) {
    let a = f32(i) * step;
    let o = vec2f(cos(a) / aspect, sin(a)) * params.glowRadius;
    acc += sampleTerm(uv + o);
    acc += sampleTerm(uv + o * 0.45) * 1.4;
  }
  return acc / (f32(taps) * 2.4);
}

@fragment fn fs_main(@location(0) uv0: vec2f) -> @location(0) vec4f {
  let t = params.time;

  // The faceplate is a lens: refract the view ray through it before the picture
  // is ever sampled, so everything below sits behind real glass.
  var uv = curve((uv0 - 0.5) * params.overscan + 0.5, params.curvature);
  let c = uv * 2.0 - 1.0;
  let n = normalize(vec3f(c * params.glassDepth, -1.0));
  let refr = refract(-vec3f(0.0, 0.0, 1.0), n, 1.0 / max(params.ior, 1.001));
  uv += refr.xy * params.glassDepth * 0.35;

  uv = tear(uv, t);
  uv.y += sin(t * 0.7) * 0.0015 * params.rollAmount
        + step(0.985, hash11(floor(t * 3.0))) * 0.04 * params.rollAmount;

  var col = sampleSplit(uv, params.splitAmount);
  col += phosphorGlow(uv) * params.glowPower;

  let line = sin(uv.y * params.scanCount * 3.14159) * 0.5 + 0.5;
  col *= 1.0 - params.scanDepth * (1.0 - line);

  let phase = fract(uv0.x * params.resolution.x / 3.0);
  var mask = vec3f(0.72, 0.72, 1.0);
  if (phase < 0.333) { mask = vec3f(1.0, 0.72, 0.72); }
  else if (phase < 0.666) { mask = vec3f(0.72, 1.0, 0.72); }
  col *= mix(vec3f(1.0), mask, params.maskDepth);

  let grain = hash21(uv0 * params.resolution + vec2f(t * 91.7, t * 53.3));
  col += (grain - 0.5) * params.noiseAmount * (0.35 + 0.65 * length(col));

  let dl = floor(uv0.y * 240.0);
  if (hash21(vec2f(dl, floor(t * 12.0))) > 1.0 - params.dropoutAmount * 0.004) {
    col = mix(col, vec3f(0.75, 0.85, 0.83) * hash11(dl + t), 0.55);
  }

  col *= params.gain;

  col = vec3f(1.0) - exp(-col * 1.15);
  col = pow(max(col, vec3f(0.0)), vec3f(1.0 / 2.2));

  // Back to colour. The dark path is unchanged; the light path lays the
  // accumulated emission back onto the paper.
  col = select(col, max(params.screenBg - col, vec3f(0.0)), params.polarity > 0.5);

  // Room light smeared across the faceplate, plus the grazing Fresnel edge.
  // These are reflections off the glass, so they add light whichever way the
  // screen behind them is polarised.
  let cs = curve(uv0, params.curvature) * 2.0 - 1.0;
  let r2 = clamp(dot(cs, cs), 0.0, 1.0);
  let band = exp(-pow((uv0.y - 0.22 + uv0.x * 0.10) * 7.0, 2.0));
  col += vec3f(0.55, 0.72, 0.78) * band * 0.035 * params.reflectPower;
  col += vec3f(0.55, 0.85, 0.82) * pow(1.0 - clamp(1.0 - r2, 0.0, 1.0), 6.0)
       * params.rimPower * 0.5;
  col *= 1.0 - params.vignette * r2;

  // Outside the tube the page's own canvas colour shows through, so the CRT
  // reads as an object in the room rather than a black rectangle. This is what
  // makes the light theme work without a second palette.
  let edge = smoothstep(1.0, 1.0 - params.bezel, max(abs(cs.x), abs(cs.y)));
  col = mix(params.surround, col, edge);

  return vec4f(col, 1.0);
}
`;
