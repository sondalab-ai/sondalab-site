#!/usr/bin/env node
// Generates the real CRT scene plates by driving a ComfyUI instance running the
// open Ideogram 4 weights.
//
// The payloads are not duplicated here. They are read out of
// docs/scene-art-prompts.md, which is the brief a human edits — one copy, so
// the two cannot drift. The parser is deliberately strict: if the doc is
// restructured it fails at startup rather than generating the wrong pictures.
//
// The frame is set here and not in the payload, because Ideogram's JSON prompt
// does not control output dimensions. That is the whole reason the first hand
// attempts came back tall and narrow.
//
// Usage:
//   node scripts/make-scene-plates.mjs --host http://192.168.88.212:8188
//   node scripts/make-scene-plates.mjs --scene uprising --plate 02-mid --seed 21
//   node scripts/make-scene-plates.mjs --levels           # pull white points to budget
//   node scripts/make-scene-plates.mjs --from-raw --levels # redo the pass, no GPU
//   node scripts/make-scene-plates.mjs --resume --levels  # reuse whatever rendered already
//   node scripts/make-scene-plates.mjs --dry-run          # parse and report only
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/** Plate size. Native for the model: 256–2048 per side, multiples of 16. */
const W = 2048;
const H = 1152;

/**
 * The sampler presets the ComfyUI Ideogram 4 template carries, lifted out of
 * the JSON blob it feeds through JsonExtractString so the graph here stays flat.
 */
const PRESETS = {
  turbo: { steps: 12, mu: 0.5, std: 1.75 },
  default: { steps: 20, mu: 0.0, std: 1.75 },
  quality: { steps: 48, mu: 0.0, std: 1.5 },
};

/**
 * Peak luminance each plate is allowed, from the budget table in the brief.
 * Four plates at full value clip to white the moment two of them overlap.
 */
const BUDGET = { '01': 46, '02': 84, '03': 255, '04': 204 };

/**
 * Where the untouched render is kept. Rendering a plate costs about five
 * minutes, so the raw PNG is worth a few megabytes: a different Levels decision
 * is then a re-run of --from-raw rather than an hour of GPU.
 */
const RAW = '.scenes-raw';

/** Model files, as ComfyUI names them. Verified against /object_info on boot. */
const MODELS = {
  unet: 'ideogram4_fp8_scaled.safetensors',
  unetNegative: 'ideogram4_unconditional_fp8_scaled.safetensors',
  clip: 'qwen3vl_8b_fp8_scaled.safetensors',
  vae: 'flux2-vae.safetensors',
};

const args = new Map();
for (let i = 2; i < process.argv.length; i += 1) {
  const a = process.argv[i];
  if (!a.startsWith('--')) continue;
  const next = process.argv[i + 1];
  if (next && !next.startsWith('--')) {
    args.set(a.slice(2), next);
    i += 1;
  } else {
    args.set(a.slice(2), true);
  }
}

const HOST = (args.get('host') || process.env.COMFY_HOST || 'http://127.0.0.1:8188').replace(/\/$/, '');
const PRESET = String(args.get('preset') || 'quality').toLowerCase();
const DRY = Boolean(args.get('dry-run'));
const LEVELS = Boolean(args.get('levels'));
const FROM_RAW = Boolean(args.get('from-raw'));
const RESUME = Boolean(args.get('resume'));
const ONLY_SCENE = args.get('scene');
const ONLY_PLATE = args.get('plate');
const BASE_SEED = Number(args.get('seed') ?? 1);

if (!PRESETS[PRESET]) {
  console.error(`unknown preset: ${PRESET} (${Object.keys(PRESETS).join(' | ')})`);
  process.exit(2);
}

/**
 * Pulls every payload out of the brief, keyed `<scene>/<plate>`.
 *
 * Anchors on the two headings the doc uses: `### \`<scene>\` payloads` opens a
 * scene, and a bolded plate name opens a plate whose payload is the next fenced
 * json block. Anything else in between is prose and is skipped.
 */
function readPayloads(path) {
  const lines = readFileSync(path, 'utf8').split('\n');
  const out = new Map();
  let scene = null;
  let plate = null;
  for (let i = 0; i < lines.length; i += 1) {
    const sceneHead = lines[i].match(/^###\s+`([\w-]+)`\s+payloads/);
    if (sceneHead) {
      scene = sceneHead[1];
      plate = null;
      continue;
    }
    if (!scene) continue;
    const plateHead = lines[i].match(/^\*\*`([\w-]+)`\*\*/);
    if (plateHead) {
      plate = plateHead[1];
      continue;
    }
    if (plate && lines[i].trim() === '```json') {
      const body = [];
      for (i += 1; i < lines.length && lines[i].trim() !== '```'; i += 1) body.push(lines[i]);
      out.set(`${scene}/${plate}`, JSON.parse(body.join('\n')));
      plate = null;
    }
  }
  return out;
}

/**
 * The flat API-format graph. This is the ComfyUI template's "Text to Image
 * (Ideogram v4)" subgraph with the preset-lookup chain and the round-to-16 math
 * removed — both are UI conveniences, and the numbers they compute are constants
 * here.
 */
function graph(caption, seed) {
  const { steps, mu, std } = PRESETS[PRESET];
  return {
    unet: { class_type: 'UNETLoader', inputs: { unet_name: MODELS.unet, weight_dtype: 'default' } },
    unet_negative: {
      class_type: 'UNETLoader',
      inputs: { unet_name: MODELS.unetNegative, weight_dtype: 'default' },
    },
    clip: {
      class_type: 'CLIPLoader',
      inputs: { clip_name: MODELS.clip, type: 'ideogram4', device: 'default' },
    },
    vae: { class_type: 'VAELoader', inputs: { vae_name: MODELS.vae } },
    positive: { class_type: 'CLIPTextEncode', inputs: { clip: ['clip', 0], text: JSON.stringify(caption) } },
    negative: { class_type: 'ConditioningZeroOut', inputs: { conditioning: ['positive', 0] } },
    cfg: {
      class_type: 'CFGOverride',
      inputs: { model: ['unet', 0], cfg: 3, start_percent: 0.7, end_percent: 1 },
    },
    guider: {
      class_type: 'DualModelGuider',
      inputs: {
        model: ['cfg', 0],
        positive: ['positive', 0],
        cfg: 7,
        model_negative: ['unet_negative', 0],
        negative: ['negative', 0],
      },
    },
    latent: { class_type: 'EmptyFlux2LatentImage', inputs: { width: W, height: H, batch_size: 1 } },
    sigmas: { class_type: 'Ideogram4Scheduler', inputs: { steps, width: W, height: H, mu, std } },
    sampler: { class_type: 'KSamplerSelect', inputs: { sampler_name: 'euler' } },
    noise: { class_type: 'RandomNoise', inputs: { noise_seed: seed } },
    run: {
      class_type: 'SamplerCustomAdvanced',
      inputs: {
        noise: ['noise', 0],
        guider: ['guider', 0],
        sampler: ['sampler', 0],
        sigmas: ['sigmas', 0],
        latent_image: ['latent', 0],
      },
    },
    decode: { class_type: 'VAEDecode', inputs: { samples: ['run', 0], vae: ['vae', 0] } },
    save: { class_type: 'SaveImage', inputs: { images: ['decode', 0], filename_prefix: 'sondalab_plate' } },
  };
}

/**
 * One request, retried.
 *
 * ComfyUI serves HTTP from the same process that runs the sampler, so while a
 * 2048x1152 plate is on the GPU the server can simply stop answering for long
 * enough that the socket times out. A dropped poll is not a failed render — the
 * job is still queued — so every request backs off and tries again rather than
 * taking the run down with it.
 */
async function api(path, init, attempts = 6) {
  let last;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const res = await fetch(`${HOST}${path}`, { ...init, signal: AbortSignal.timeout(120_000) });
      if (res.status >= 500) throw new Error(`${path} → ${res.status}`);
      if (!res.ok) throw new Error(`${path} → ${res.status} ${(await res.text()).slice(0, 400)}`);
      return res;
    } catch (error) {
      last = error;
      if (String(error).includes('→ 4')) throw error;
      await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
    }
  }
  throw last;
}

/** Submits a graph and waits for it, polling history rather than holding a socket. */
async function render(caption, seed) {
  const queued = await api('/prompt', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: graph(caption, seed), client_id: 'sondalab-plates' }),
  }).then((r) => r.json());
  const id = queued.prompt_id;

  for (let waited = 0; waited < 1800; waited += 3) {
    await new Promise((r) => setTimeout(r, 3000));
    const history = await api(`/history/${id}`).then((r) => r.json());
    const entry = history[id];
    if (!entry) continue;
    if (entry.status?.status_str === 'error') {
      throw new Error(`render failed: ${JSON.stringify(entry.status.messages).slice(0, 900)}`);
    }
    const image = entry.outputs?.save?.images?.[0];
    if (image) return image;
  }
  throw new Error('render timed out after 30 minutes');
}

/**
 * Forces the plate into the shape the compositor expects and reports what it
 * found: grayscale, and — for an occluder — white-on-black rather than the
 * black-on-white silhouette a model tends to produce.
 *
 * The white point is measured and printed but deliberately not corrected. A
 * plate over its budget is a prompt problem or a Levels decision, and silently
 * pulling it down would hide a picture that came back wrong.
 */
async function normalise(page, pngBase64, occluder, budget) {
  return page.evaluate(
    async (b64, isOccluder, w, h, ceiling) => {
      const img = new Image();
      img.src = `data:image/png;base64,${b64}`;
      await img.decode();
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(img, 0, 0, w, h);
      const data = ctx.getImageData(0, 0, w, h);
      const px = data.data;

      let sum = 0;
      let min = 255;
      let max = 0;
      for (let i = 0; i < px.length; i += 4) {
        const luma = Math.round(0.2126 * px[i] + 0.7152 * px[i + 1] + 0.0722 * px[i + 2]);
        px[i] = luma;
        px[i + 1] = luma;
        px[i + 2] = luma;
        px[i + 3] = 255;
        sum += luma;
        if (luma < min) min = luma;
        if (luma > max) max = luma;
      }
      const mean = sum / (px.length / 4);

      // An occluder is a mask, and a model asked for a silhouette will usually
      // answer with the conventional dark shape on a light ground. Mean
      // luminance says which way round it came back.
      const inverted = isOccluder && mean > 127;
      if (inverted) {
        for (let i = 0; i < px.length; i += 4) {
          px[i] = 255 - px[i];
          px[i + 1] = px[i];
          px[i + 2] = px[i];
        }
      }
      // Levels: scale the plate so its brightest pixel lands on its budget.
      // Linear and monotonic, so nothing in the picture moves relative to
      // anything else — it is the editor step from the checklist, done to
      // twelve files instead of by hand.
      const peak = inverted ? 255 - min : max;
      const scale = ceiling && peak > ceiling ? ceiling / peak : 1;
      if (scale !== 1) {
        for (let i = 0; i < px.length; i += 4) {
          const v = Math.round(px[i] * scale);
          px[i] = v;
          px[i + 1] = v;
          px[i + 2] = v;
        }
      }

      ctx.putImageData(data, 0, 0);

      // The model signs its work. Four of the first twelve plates came back with
      // a fabricated artist's monogram in the bottom-right corner — the brief
      // forbids it, but Ideogram 4 takes no negative prompt and the positive
      // wording did not cover it. A uniform feathered wipe beats a list of
      // affected plates, which would rot on the next re-render: corner luminance
      // does not separate the signed from the clean (a signed plate measured 2.6
      // against a clean one at 4.0), so there is nothing to detect.
      //
      // After putImageData, so it lands on the finished greyscale rather than on
      // pixels that are about to be overwritten. Emissive plates only: the
      // extreme corner carries no scene here — the tube vignettes and the
      // parallax slides past it — but punching one into an occluder would cut a
      // notch in the silhouette.
      if (!isOccluder) {
        const reach = Math.round(h * 0.17);
        ctx.save();
        ctx.translate(w, h);
        ctx.scale(1.7, 1);
        const wipe = ctx.createRadialGradient(0, 0, reach * 0.5, 0, 0, reach);
        wipe.addColorStop(0, 'rgba(0,0,0,1)');
        wipe.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = wipe;
        ctx.beginPath();
        ctx.arc(0, 0, reach, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      return {
        dataUrl: canvas.toDataURL('image/webp', 0.92),
        min,
        max,
        mean: Math.round(mean),
        inverted,
        scaled: scale !== 1 ? Math.round(peak * scale) : null,
      };
    },
    pngBase64,
    occluder,
    W,
    H,
    ceilingFor(budget),
  );
}

/** Levels only runs when asked; without --levels the plate is reported, not changed. */
function ceilingFor(budget) {
  return LEVELS ? budget : 0;
}

const payloads = readPayloads('docs/scene-art-prompts.md');
const scenes = JSON.parse(readFileSync('src/lib/scenes.json', 'utf8'));

/** Where a plate lands. Scenes the site knows about own their paths; others get a folder. */
const targets = [];
for (const [key, caption] of payloads) {
  const [scene, plate] = key.split('/');
  if (ONLY_SCENE && scene !== ONLY_SCENE) continue;
  if (ONLY_PLATE && plate !== ONLY_PLATE) continue;
  const layer = scenes[scene]?.layers.find((l) => l.src.endsWith(`/${plate}.webp`));
  targets.push({
    key,
    scene,
    plate,
    caption,
    occluder: layer ? layer.tone === 'occluder' : /^03-/.test(plate),
    budget: BUDGET[plate.slice(0, 2)] ?? 255,
    path: layer ? `public${layer.src}` : `public/scenes/${scene}/${plate}.webp`,
    raw: `${RAW}/${scene}/${plate}.png`,
  });
}

if (!targets.length) {
  console.error(`nothing to do — ${payloads.size} payloads parsed, none matched the filters`);
  process.exit(1);
}

console.log(`${payloads.size} payloads in the brief, ${targets.length} selected`);
console.log(
  `${W}x${H}, preset ${PRESET} (${PRESETS[PRESET].steps} steps)` +
    `${LEVELS ? ', levels on' : ''}${FROM_RAW ? ', from raw' : `, host ${HOST}`}\n`,
);

if (DRY) {
  for (const t of targets) {
    console.log(
      `${t.key.padEnd(22)} ${t.occluder ? 'occluder' : 'emissive'}  budget ${String(t.budget).padStart(3)}  → ${t.path}`,
    );
  }
  process.exit(0);
}

if (!FROM_RAW) {
const info = await api('/object_info/UNETLoader').then((r) => r.json());
const available = info.UNETLoader.input.required.unet_name[0];
for (const name of [MODELS.unet, MODELS.unetNegative]) {
  if (!available.includes(name)) {
    console.error(`ComfyUI has no ${name} — the open Ideogram 4 weights are not installed`);
    process.exit(1);
  }
}
}

const browser = await puppeteer.launch({ executablePath: CHROME, headless: 'new', args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setContent('<body></body>');

/** One seed per scene, so the plates of a scene are at least related. */
const seedFor = (scene) => BASE_SEED + [...new Set([...payloads.keys()].map((k) => k.split('/')[0]))].indexOf(scene) * 1000;

for (const t of targets) {
  const started = Date.now();
  process.stdout.write(`${t.key.padEnd(22)} `);
  let png;
  const kept = RESUME && existsSync(t.raw);
  if (FROM_RAW || kept) {
    if (!existsSync(t.raw)) {
      console.log('no raw render kept — run it without --from-raw first');
      continue;
    }
    png = readFileSync(t.raw);
  } else {
    const image = await render(t.caption, seedFor(t.scene));
    const params = new URLSearchParams({
      filename: image.filename,
      subfolder: image.subfolder ?? '',
      type: image.type ?? 'output',
    });
    png = Buffer.from(await (await api(`/view?${params}`)).arrayBuffer());
    mkdirSync(dirname(t.raw), { recursive: true });
    writeFileSync(t.raw, png);
  }
  const { dataUrl, min, max, mean, inverted, scaled } = await normalise(
    page,
    png.toString('base64'),
    t.occluder,
    t.budget,
  );
  const webp = Buffer.from(dataUrl.split(',')[1], 'base64');
  mkdirSync(dirname(t.path), { recursive: true });
  writeFileSync(t.path, webp);
  const seconds = Math.round((Date.now() - started) / 1000);
  console.log(
    (kept ? 'kept ' : '     ') +
    `${String(seconds).padStart(4)}s  black ${String(min).padStart(3)}  white ${String(max).padStart(3)}` +
      `${scaled === null ? '' : ` → ${String(scaled).padStart(3)}`}  mean ${String(mean).padStart(3)}` +
      `  budget ${String(t.budget).padStart(3)}${inverted ? '  inverted' : ''}` +
      `  ${(webp.length / 1024).toFixed(1)}KB`,
  );
}

await browser.close();

console.log(
  LEVELS
    ? `
Every plate is inside its budget. Next: npm run scenes:flats && npm run build`
    : `
White points above are what the model produced; the budget beside each is what
the compositor wants. The renders are kept in ${RAW}/, so pulling them into
budget costs no GPU:

  node scripts/make-scene-plates.mjs --from-raw --levels`,
);
