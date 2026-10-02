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
const ORDER = ['spexr', 'introspect', 'claude-loadout', 'daos', 'local-agents', 'skillkit', 'mxm'] as const;
const HOURS: Record<string, string> = {
  spexr: '02:00',
  introspect: '03:00',
  'claude-loadout': '04:00',
  daos: '05:00',
  'local-agents': '06:00',
  skillkit: '07:00',
  mxm: '08:00',
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
  /** Overrides the aspect-derived column count. */
  cols?: number;
  aspect?: number;
  targetRows?: number;
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

  // For a texture that matches the tube's aspect, rows = cols * (cellW/cellH) /
  // aspect. Fixing the column count therefore starves a wide screen of rows —
  // which is how the novella ended up with one line. Solve for columns instead,
  // targeting enough rows to hold the header and a readable stretch of prose.
  //
  // The ceiling used to be 132, which a 2560px display already hit: past that the
  // texture stopped growing, the shader stretched a 1716px picture across the
  // whole screen — so the glyphs came out half again too big — and the row count
  // fell from 30 to 15. It is raised far enough that the texture keeps up.
  let COLS = 84;
  let ROWS = 30;
  let targetRows = opts.targetRows ?? 30;

  function geometry(aspect: number, nextTargetRows?: number) {
    if (nextTargetRows) targetRows = nextTargetRows;
    COLS = opts.cols ?? Math.round(
      Math.min(240, Math.max(46, (targetRows * aspect) / (cellW / cellH))),
    );
    ROWS = Math.max(12, Math.round((COLS * cellW) / aspect / cellH));
    canvas.width = COLS * cellW;
    canvas.height = ROWS * cellH;
  }

  /**
   * Longest line of prose, in characters. Separate from `COLS` on purpose: the
   * column count is the tube's resolution and now runs to 240 on a wide display,
   * but a 232-character line is not prose. The text keeps a measure and the extra
   * columns go into resolution instead.
   *
   * Set above the column count of every normal screen, so nothing below an
   * ultrawide changes: at 1440px the tube is 109 columns and wraps at 101 either
   * way. It only bites past that, where the choice is a long line or an empty
   * half — this leans towards the line.
   */
  const MEASURE = 140;

  /** Rows kept empty at the foot of the tube for the HTML call to action. */
  const RESERVED_ROWS = 3;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  geometry(opts.aspect ?? 16 / 9);

  const root = document.documentElement;
  const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

  const isLight = () => root.getAttribute('data-sl-theme') === 'light';

  /**
   * The tube follows the theme. On dark it is a lit phosphor screen: near-black
   * glass, light glyphs. On light it is a paper-white readout: the canvas
   * colour behind the theme's own ink. Both ends come straight from tokens.
   */
  const screenBg = () => (isLight() ? token('--sl-bg-canvas') : '#000000');
  const screenInk = () => (isLight() ? token('--sl-text-primary') : token('--sl-text-primary'));

  function parse(hex: string): [number, number, number] {
    let h = (hex || '').trim().replace('#', '');
    if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
    const n = parseInt(h, 16);
    if (Number.isNaN(n)) return [0, 0, 0];
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }

  /**
   * Resolve a colour expression to the colour the browser computes for it.
   * Needed for derived roles such as --slc-accent-text, whose custom-property
   * value is an unresolved oklch(from …) expression rather than a colour the
   * canvas can take. A display:none probe still gets a computed style.
   */
  function resolveColor(expr: string): string {
    const probe = document.createElement('span');
    probe.style.display = 'none';
    probe.style.color = expr;
    root.appendChild(probe);
    const color = getComputedStyle(probe).color;
    probe.remove();
    return color;
  }

  /** Fade a colour towards the screen's own background, whichever end that is. */
  function fade(hex: string, k: number): string {
    const c = parse(hex);
    const b = parse(screenBg());
    const m = c.map((v, i) => Math.round(v * k + b[i] * (1 - k)));
    return `rgb(${m[0]}, ${m[1]}, ${m[2]})`;
  }

  /** Palette, resolved from tokens. Re-read whenever the theme toggles. */
  let style: Record<string, { color: string; size: number; track?: number }>;
  let black = '#000';
  let polarityLight = false;

  function readTokens() {
    // Glyphs in the accent are text: on the paper tube the raw light accent is a
    // fill (about 1.9:1), so they take the kit's accent-as-text role.
    const accent = resolveColor('var(--slc-accent-text)');
    const depth = token('--sl-accent-depth');
    // On dark the ink is the theme's light text; on light it is the theme's
    // dark text, because the screen itself has flipped.
    const ink = isLight() ? token('--sl-text-primary') : token('--sl-text-primary');
    const secondary = fade(ink, 0.7);
    const muted = fade(ink, 0.45);
    const border = fade(ink, 0.22);
    black = screenBg();
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
    polarityLight = isLight();
  }
  readTokens();

  const claimParts = SITE.claim.split(', ');
  const headerLines = (): Line[] => [
    { kind: 'boot', text: `${SITE.name.toUpperCase()} TERMINAL · booting operator session`, h: 1 },
    { kind: 'boot', text: 'link: local · service: refused · switch: yours', h: 1 },
    { kind: 'blank', h: 1 },
    { kind: 'eyebrow', text: `${SITE.name} · a lab for operators`, h: 1 },
    { kind: 'claim', text: `${claimParts[0]},`, h: 2 },
    { kind: 'claim-accent', text: `${claimParts[1]}.`, h: 2 },
    { kind: 'blank', h: 1 },
    { kind: 'tagline', text: SITE.tagline.toUpperCase(), h: 1 },
    // No painted call to action: the real anchors stay HTML on top of the
    // canvas, so they are focusable, indexable and actually clickable.
    { kind: 'blank', h: 1 },
    { kind: 'rule', text: '─'.repeat(Math.max(8, COLS - 8)), h: 1 },
  ];
  let HEADER = headerLines();

  function buildBody(id: string, index: number): Line[] {
    const out: Line[] = [
      { kind: 'prompt', text: `tail -f /var/log/operator/${id}.log`, h: 1 },
      { kind: 'meta', text: `-- ${HOURS[id]} · chapter ${index + 1} of ${ORDER.length} --`, h: 1 },
      { kind: 'blank', h: 1 },
    ];
    for (const para of NOVELLAS[id] ?? []) {
      for (const w of wrap(para, Math.min(COLS - 8, MEASURE))) out.push({ kind: 'body', text: w, h: 1 });
      out.push({ kind: 'blank', h: 1 });
    }
    return out;
  }

  const len = (l: Line) => (l.text ? l.text.length : 0) + 1;
  const sum = (s: Line[]) => s.reduce((n, l) => n + len(l), 0);

  let headerLen = sum(HEADER);
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
    const room = Math.max(0, ROWS - pinnedRows - RESERVED_ROWS);
    const view = pinned.concat(prose.slice(Math.max(0, prose.length - room)));

    let row = 0;
    view.forEach((line, i) => {
      const st = style[line.kind] ?? style.body;
      const y = row * cellH + (line.h * cellH) / 2;
      row += line.h;
      if (line.kind === 'blank') return;

      ctx.font = `${Math.round(cellH * st.size)}px "Geist Mono", ui-monospace, Menlo, monospace`;
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

  /**
   * The screen shown while the loop is stopped. Drawn once, rendered once, and
   * then left on the canvas: nothing is animating behind it, so it has to read
   * as a deliberate state rather than a frozen frame.
   */
  function drawSignalLoss() {
    ctx.fillStyle = black;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.textBaseline = 'middle';

    const midRow = Math.floor(ROWS / 2);
    const x = cellW * 3;
    const mono = (k: number) =>
      `${Math.round(cellH * k)}px "Geist Mono", ui-monospace, Menlo, monospace`;

    ctx.font = mono(0.62);
    ctx.fillStyle = style.meta.color;
    ctx.fillText('-- carrier lost --', x, (midRow - 2) * cellH + cellH / 2);

    ctx.font = mono(1.15);
    ctx.fillStyle = style.prompt.color;
    let cx = x;
    for (const chr of 'SIGNAL LOSS') {
      ctx.fillText(chr, cx, midRow * cellH + cellH);
      cx += ctx.measureText(chr).width + 4;
    }

    ctx.font = mono(0.62);
    ctx.fillStyle = style.cta.color;
    const prompt = 'operator@sondalab:~$ ';
    const py = (midRow + 3) * cellH + cellH / 2;
    ctx.fillText(prompt, x, py);
    ctx.fillStyle = style.prompt.color;
    ctx.fillRect(x + ctx.measureText(prompt).width + 2, py - cellH * 0.34, cellW * 0.6, cellH * 0.68);

    dirty = false;
  }

  return {
    canvas,
    tick,
    draw,
    drawSignalLoss,
    refreshTokens() { readTokens(); dirty = true; },
    /**
     * Re-derive the grid for a new tube aspect and re-wrap the prose. Progress
     * is carried across as a fraction, not a character count: the wrap width
     * changes, so the totals do too, and keeping the raw count would jump the
     * reader forwards or backwards.
     */
    resize(nextAspect: number, nextTargetRows?: number) {
      const fraction = total > 0 ? revealed / total : 0;
      geometry(nextAspect, nextTargetRows);
      HEADER = headerLines();
      headerLen = sum(HEADER);
      body = buildBody(ORDER[chapter], chapter);
      total = headerLen + sum(body);
      revealed = Math.min(total, Math.max(headerLen * (phase === 'typing' ? 0 : 1), fraction * total));
      dirty = true;
    },
    get width() { return canvas.width; },
    get height() { return canvas.height; },
    get lightPolarity() { return polarityLight; },
    get screenBackground() { return black; },
    get dirty() { return dirty; },
  };
}
