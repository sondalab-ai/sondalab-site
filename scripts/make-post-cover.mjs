// Makes the cover print of one transmission on a ComfyUI server (Ideogram 4).
//
//   COMFYUI_URL=http://host:8188 node scripts/make-post-cover.mjs <slug> --subject "<one scene>" [--seeds 3]
//   node scripts/make-post-cover.mjs <slug> --pick <seed>
//
// The first form writes candidates to .covers/<slug>/<seed>.png. The second
// form copies one candidate to src/assets/art/post-<slug>.webp, which the post
// page shows. Exit code 2 means the server is not reachable or lacks a model:
// the post is then published without a cover, never with a substitute picture.
// Exit code 3 means the model's safety filter blocked every candidate: change
// the scene and run again.
import { mkdir, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import sharp from 'sharp';

const MODELS = {
  unet: 'ideogram4_fp8_scaled.safetensors',
  unetNegative: 'ideogram4_unconditional_fp8_scaled.safetensors',
  clip: 'qwen3vl_8b_fp8_scaled.safetensors',
  vae: 'flux2-vae.safetensors',
};
const WIDTH = 1536;
const HEIGHT = 1024;
const TAIL =
  ' Wide picture, the subject is large and centred. Violet and slate blue subject, black ink, small yellow lit marks.' +
  ' No text, no letters, no numbers. Unsigned: no signature, no monogram.';

const args = process.argv.slice(2);
const slug = args[0];
const opt = (name) => {
  const i = args.indexOf(`--${name}`);
  return i > 0 ? args[i + 1] : undefined;
};
const fail = (code, message) => {
  console.error(message);
  process.exit(code);
};
if (!slug || slug.startsWith('--')) fail(1, 'Usage: make-post-cover.mjs <slug> --subject "<one scene>" [--seeds 3] | --pick <seed>');

const dir = join('.covers', slug);
const pick = opt('pick');
if (pick) {
  const from = join(dir, `${pick}.png`);
  await access(from).catch(() => fail(1, `No candidate ${from}. Generate candidates first.`));
  const to = join('src', 'assets', 'art', `post-${slug}.webp`);
  // The source in the repo is WebP: about a tenth of the PNG, same picture.
  await sharp(from).webp({ quality: 90, effort: 5 }).toFile(to);
  console.log(`Cover set: ${to}`);
  process.exit(0);
}

const subject = opt('subject');
if (!subject) fail(1, 'Give the scene with --subject "<one scene>".');
const host = process.env.COMFYUI_URL?.replace(/\/$/, '');
if (!host) fail(2, 'COMFYUI_URL is not set. No cover is made.');

const api = async (path, body) => {
  const res = await fetch(host + path, {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`${path}: HTTP ${res.status} ${(await res.text()).slice(0, 300)}`);
  return res;
};

// Reachability and models first, so a missing server costs seconds, not a queue.
try {
  await api('/system_stats');
  const loaders = await (await api('/object_info/UNETLoader')).json();
  const have = loaders.UNETLoader.input.required.unet_name[0];
  for (const name of [MODELS.unet, MODELS.unetNegative]) {
    if (!have.includes(name)) fail(2, `ComfyUI at ${host} has no model ${name}. No cover is made.`);
  }
} catch (error) {
  fail(2, `ComfyUI at ${host} is not reachable (${error.message}). No cover is made.`);
}

/** The scene as the structured prompt that the Ideogram 4 text encoder expects. */
const prompt = JSON.stringify(
  {
    high_level_description: `An inked cyberpunk comic poster illustration on a flat orange background. ${subject}${TAIL}`,
    style_description: {
      aesthetics:
        'Hand-inked comic poster, confident black ink outlines of varying weight, fine hatching, flat cel colours with no gradients, screen-print look.',
      lighting: 'Flat graphic lighting, no gradients, shadows as solid black ink and hatching.',
      medium: 'Ink drawing with flat colour, screen print',
      color_palette: ['#F57C00', '#6A4FA3', '#4E6E9E', '#111014', '#F2C9C9', '#F5E400'],
    },
    compositional_deconstruction: {
      background: 'A flat single solid orange background with no texture, no border, no text and no signature.',
      elements: [{ type: 'obj', desc: subject + TAIL }],
    },
  },
  null,
  2,
);

const graph = (seed) => ({
  9: { class_type: 'VAELoader', inputs: { vae_name: MODELS.vae } },
  14: { class_type: 'CLIPLoader', inputs: { clip_name: MODELS.clip, type: 'ideogram4', device: 'default' } },
  24: { class_type: 'CLIPTextEncode', inputs: { clip: ['14', 0], text: prompt } },
  10: { class_type: 'ConditioningZeroOut', inputs: { conditioning: ['24', 0] } },
  23: { class_type: 'UNETLoader', inputs: { unet_name: MODELS.unet, weight_dtype: 'default' } },
  154: { class_type: 'UNETLoader', inputs: { unet_name: MODELS.unetNegative, weight_dtype: 'default' } },
  157: { class_type: 'CFGOverride', inputs: { model: ['23', 0], cfg: 3.0, start_percent: 0.7, end_percent: 1.0 } },
  155: {
    class_type: 'DualModelGuider',
    inputs: { model: ['157', 0], positive: ['24', 0], cfg: 7.0, model_negative: ['154', 0], negative: ['10', 0] },
  },
  11: { class_type: 'EmptyFlux2LatentImage', inputs: { width: WIDTH, height: HEIGHT, batch_size: 1 } },
  17: { class_type: 'Ideogram4Scheduler', inputs: { steps: 20, width: WIDTH, height: HEIGHT, mu: 0.0, std: 1.75 } },
  16: { class_type: 'KSamplerSelect', inputs: { sampler_name: 'euler' } },
  18: { class_type: 'RandomNoise', inputs: { noise_seed: seed } },
  12: {
    class_type: 'SamplerCustomAdvanced',
    inputs: { noise: ['18', 0], guider: ['155', 0], sampler: ['16', 0], sigmas: ['17', 0], latent_image: ['11', 0] },
  },
  13: { class_type: 'VAEDecode', inputs: { samples: ['12', 0], vae: ['9', 0] } },
  158: { class_type: 'SaveImage', inputs: { filename_prefix: `sondalab/post_${slug}_${seed}`, images: ['13', 0] } },
});

const count = Math.max(1, Number(opt('seeds') ?? 3));
const seeds = Array.from({ length: count }, (_, i) => 801 + i * 101);
await mkdir(dir, { recursive: true });

const jobs = [];
for (const seed of seeds) {
  const { prompt_id: id } = await (await api('/prompt', { prompt: graph(seed) })).json();
  jobs.push({ seed, id });
}
console.log(`Queued ${jobs.length} candidates for ${slug}. About 60 seconds each.`);

let blocked = 0;
const deadline = Date.now() + (5 + count * 3) * 60000;
for (const { seed, id } of jobs) {
  for (;;) {
    if (Date.now() > deadline) fail(2, `Timed out while waiting for seed ${seed}.`);
    const entry = (await (await api(`/history/${id}`)).json())[id];
    if (entry?.status?.status_str === 'error') fail(2, `ComfyUI failed on seed ${seed}.`);
    const image = Object.values(entry?.outputs ?? {}).flatMap((o) => o.images ?? [])[0];
    if (image) {
      const bytes = await (await api(`/view?${new URLSearchParams(image)}`)).arrayBuffer();
      // The model answers a blocked prompt with a flat grey card, not an error.
      // A real print has strong colour variation, the card has almost none.
      const { channels } = await sharp(Buffer.from(bytes)).stats();
      if (Math.max(...channels.map((c) => c.stdev)) < 25) {
        blocked++;
        console.log(`Blocked by the model's safety filter: seed ${seed}. No file written.`);
        break;
      }
      const file = join(dir, `${seed}.png`);
      await writeFile(file, Buffer.from(bytes));
      console.log(`Candidate: ${file}`);
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 4000));
  }
}
if (blocked === jobs.length) fail(3, 'The safety filter blocked every candidate. Change the scene and run again.');
console.log(`Look at each candidate, then run: node scripts/make-post-cover.mjs ${slug} --pick <seed>`);
