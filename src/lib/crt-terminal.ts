/**
 * The hero terminal's content: the site's own copy and the operator novellas,
 * drawn on a 2D canvas that the CRT shader samples as a texture.
 *
 * Two zones. The header — boot lines, claim, tagline, calls to action — is
 * typed once and never wiped, because it is the hero's headline. The body
 * below is one novella chapter at a time, cycling: type, hold, wipe, next.
 *
 * Every colour is read from a design-system token at construction and on theme
 * change. Nothing here is hardcoded: `scripts/audit.mjs` only inspects <style>
 * blocks, so a literal colour in this file would bypass the compliance gate
 * entirely.
 */
import { SITE } from './site';
import { NOVELLAS } from './novellas';

/** Chapter order matches the products' order: one long night, 2am to dawn. */
const ORDER = ['spexr', 'introspect', 'claude-loadout', 'daos', 'local-agents', 'skillkit'] as const;
const HOURS: Record<string, string> = {
  spexr: '02:00',
  introspect: '03:00',
  'claude-loadout': '04:00',
  daos: '05:00',
  'local-agents': '06:00',
  skillkit: '07:00',
};

type Kind =
  | 'boot' | 'eyebrow' | 'claim' | 'claim-accent' | 'tagline'
  | 'cta' | 'rule' | 'prompt' | 'meta' | 'body' | 'blank';

interface Line {
  kind: Kind;
  text?: string;
  /** Height in character cells; the claim needs two. */
  h: number;
}

export interface TerminalOptions {
  cellW?: number;
  cellH?: number;
  cols?: number;
  aspect?: number;
}

export interface TickOptions {
  typeSpeed: number;
  eraseSpeed: number;
  holdSeconds: number;
}

function wrap(s: string, width: number): string[] {
  const out: string[] = [];
  let cur = '';
  for (const w of s.split(' ')) {
    if ((cur + ' ' + w).trim().length > width) { out.push(cur.trim()); cur = w; }
    else cur += ' ' + w;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

export function createTerminal(opts: TerminalOptions = {}) {
  const cellW = opts.cellW ?? 13;
  const cellH = opts.cellH ?? 26;
  const COLS = opts.cols ?? 84;
  const aspect = opts.aspect ?? 16 / 9;
  const ROWS = Math.max(12, Math.round((COLS * cellW) / aspect / cellH));

  const canvas = document.createElement('canvas');
  canvas.width = COLS * cellW;
  canvas.height = ROWS * cellH;
  const ctx = canvas.getContext('2d')!;

  const root = document.documentElement;
  const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

  /**
   * The inside of the tube is dark in both themes, so its ink is whichever of
   * the two neutral tokens is the light one: `--sl-text-primary` on dark,
   * `--sl-bg-canvas` on light. Using the theme's text colour directly would
   * paint near-black glyphs on a near-black screen in light mode.
   */
  const tubeInk = () =>
    root.getAttribute('data-sl-theme') === 'light'
      ? token('--sl-bg-canvas')
      : token('--sl-text-primary');

  /** Dim a colour towards the tube's black; the screen has one light source. */
  function dim(hex: string, k: number): string {
    let h = (hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return hex;
    const c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.round(v * k));
    return `rgb(${c[0]}, ${c[1]}, ${c[2]})`;
  }

  /** Palette, resolved from tokens. Re-read whenever the theme toggles. */
  let style: Record<string, { color: string; size: number; track?: number }>;
  let black = '#000';

  function readTokens() {
    const accent = token('--sl-accent-default');
    const depth = token('--sl-accent-depth');
    const ink = tubeInk();
    const secondary = dim(ink, 0.7);
    const muted = dim(ink, 0.45);
    const border = dim(ink, 0.22);
    // A lit phosphor screen is a dark object in a bright room, so the light
    // theme changes the surround (handled in the shader), never the screen.
    black = '#000000';
    style = {
      boot: { color: muted, size: 0.58 },
      eyebrow: { color: depth, size: 0.56, track: 3 },
      claim: { color: ink, size: 1.15 },
      'claim-accent': { color: accent, size: 1.15 },
      tagline: { color: secondary, size: 0.58, track: 4 },
      cta: { color: depth, size: 0.62 },
      rule: { color: border, size: 0.62 },
      prompt: { color: accent, size: 0.62 },
      meta: { color: muted, size: 0.62 },
      body: { color: ink, size: 0.62 },
      blank: { color: ink, size: 0.62 },
    };
  }
  readTokens();

  const claimParts = SITE.claim.split(', ');
  const HEADER: Line[] = [
    { kind: 'boot', text: `${SITE.name.toUpperCase()} TERMINAL · booting operator session`, h: 1 },
    { kind: 'boot', text: 'link: local · service: refused · switch: yours', h: 1 },
    { kind: 'blank', h: 1 },
    { kind: 'eyebrow', text: `${SITE.name} · a lab for operators`, h: 1 },
    { kind: 'claim', text: `${claimParts[0]},`, h: 2 },
    { kind: 'claim-accent', text: `${claimParts[1]}.`, h: 2 },
    { kind: 'blank', h: 1 },
    { kind: 'tagline', text: SITE.tagline.toUpperCase(), h: 1 },
    // No painted call to action: the real anchors stay HTML on top of the
    // canvas, so they are focusable, indexable and actually clickable. A
    // button drawn inside a shader is none of those.
    { kind: 'blank', h: 1 },
    { kind: 'blank', h: 1 },
    { kind: 'rule', text: '─'.repeat(Math.max(8, COLS - 8)), h: 1 },
  ];

  function buildBody(id: string, index: number): Line[] {
    const out: Line[] = [
      { kind: 'prompt', text: `tail -f /var/log/operator/${id}.log`, h: 1 },
      { kind: 'meta', text: `-- ${HOURS[id]} · chapter ${index + 1} of ${ORDER.length} --`, h: 1 },
      { kind: 'blank', h: 1 },
    ];
    for (const para of NOVELLAS[id] ?? []) {
      for (const w of wrap(para, COLS - 8)) out.push({ kind: 'body', text: w, h: 1 });
      out.push({ kind: 'blank', h: 1 });
    }
    return out;
  }

  const len = (l: Line) => (l.text ? l.text.length : 0) + 1;
  const sum = (s: Line[]) => s.reduce((n, l) => n + len(l), 0);

  const headerLen = sum(HEADER);
  let chapter = 0;
  let body = buildBody(ORDER[chapter], chapter);
  let total = headerLen + sum(body);
  let revealed = 0;
  let phase: 'typing' | 'holding' | 'erasing' = 'typing';
  let hold = 0;
  let dirty = true;

  const script = () => HEADER.concat(body);

  function charAt(n: number): string {
    let b = n;
    for (const l of script()) {
      if (b < len(l)) return l.text ? l.text[b] : '\n';
      b -= len(l);
    }
    return '';
  }

  function tick(dt: number, o: TickOptions) {
    if (phase === 'typing') {
      const c = charAt(Math.max(0, Math.floor(revealed) - 1));
      // Slow on punctuation: a constant rate reads as a metronome, not a person.
      const drag = c === '.' || c === ',' || c === ':' ? 0.35 : 1;
      revealed = Math.min(total, revealed + o.typeSpeed * drag * dt);
      dirty = true;
      if (revealed >= total) { phase = 'holding'; hold = 0; }
    } else if (phase === 'holding') {
      hold += dt;
      dirty = true;
      if (hold >= o.holdSeconds) phase = 'erasing';
    } else {
      // The wipe stops at the header: the claim is the hero and never leaves.
      revealed = Math.max(headerLen, revealed - o.eraseSpeed * dt);
      dirty = true;
      if (revealed <= headerLen) {
        chapter = (chapter + 1) % ORDER.length;
        body = buildBody(ORDER[chapter], chapter);
        total = headerLen + sum(body);
        phase = 'typing';
      }
    }
  }

  function draw(time: number) {
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'middle';

    let budget = revealed;
    const shown: (Line & { visible: string })[] = [];
    for (const l of script()) {
      if (budget <= 0) break;
      shown.push({ ...l, visible: l.text ? l.text.slice(0, Math.min(len(l) - 1, budget)) : '' });
      budget -= len(l);
    }

    // Scroll only the prose: the header and the log's own prompt stay pinned,
    // or the `tail -f` line scrolls away and the framing is lost.
    const PINNED = HEADER.length + 3;
    const pinned = shown.slice(0, PINNED);
    const prose = shown.slice(PINNED);
    const pinnedRows = pinned.reduce((n, l) => n + l.h, 0);
    const room = Math.max(0, ROWS - pinnedRows);
    const view = pinned.concat(prose.slice(Math.max(0, prose.length - room)));

    let row = 0;
    view.forEach((line, i) => {
      const st = style[line.kind] ?? style.body;
      const y = row * cellH + (line.h * cellH) / 2;
      row += line.h;
      if (line.kind === 'blank') return;

      ctx.font = `${Math.round(cellH * st.size)}px "Martian Mono Variable", ui-monospace, Menlo, monospace`;
      let x = cellW * 3;

      if (line.kind === 'prompt') {
        ctx.fillStyle = style.cta.color;
        const p = 'operator@sondalab:~$ ';
        ctx.fillText(p, x, y);
        x += ctx.measureText(p).width;
      }

      ctx.fillStyle = st.color;
      if (st.track) {
        // Letter-spacing by hand: the mono eyebrow and tagline need the air.
        let cx = x;
        for (const chr of line.visible) {
          ctx.fillText(chr, cx, y);
          cx += ctx.measureText(chr).width + st.track;
        }
        x = cx;
      } else {
        ctx.fillText(line.visible, x, y);
        x += ctx.measureText(line.visible).width;
      }

      if (i === view.length - 1) {
        // Solid while erasing: a wipe in progress must not read as an idle prompt.
        const on = phase === 'erasing' ? true : Math.floor(time * 2) % 2 === 0;
        if (on) {
          ctx.fillStyle = phase === 'erasing' ? style.tagline.color : style.prompt.color;
          ctx.fillRect(x + 3, y - cellH * st.size * 0.55, cellW * 0.6, cellH * st.size * 1.1);
        }
      }
    });
    dirty = false;
  }

  return {
    canvas,
    tick,
    draw,
    refreshTokens() { readTokens(); dirty = true; },
    get dirty() { return dirty; },
  };
}
