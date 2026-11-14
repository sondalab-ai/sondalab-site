/**
 * The /ads/ session tube's content: the real ADS session from ads-page.ts,
 * drawn on a 2D canvas that the shared CRT shader samples as a texture.
 *
 * One cycle: the request is typed, the plan and the steps print line by line,
 * the approval block prints, its code re-resolves (the terminal glitch, a
 * decode, tui-patterns.md § Effects), and a cursor waits on the reply line.
 * Hold, wipe, again.
 *
 * Two halves. The pure half — wrapping, the reveal and the cycle — takes its
 * lines as arguments and touches no DOM, so scripts/crt-session.test.mjs runs
 * it in Node. The drawing half reads every colour from a design-system token
 * at construction and on theme change: scripts/audit.mjs only inspects <style>
 * blocks, so a literal colour here would pass the gate while breaking the
 * contract.
 */
import { DECODE, decodeFrames } from '@sondalab/ui-kit/term.js';
import type { TranscriptLine } from './ads-page';
import type { CrtSource } from './crt-surface';

type Role = NonNullable<TranscriptLine['role']> | 'ink';

/** One screen row: part of one source line, with its hanging indent. */
export interface Row {
  /** Index of the source line in the script. */
  line: number;
  role: Role;
  /** Columns of indent drawn before the content; not typed. */
  indent: number;
  /** Offset of this row's content within the source line's text. */
  start: number;
  text: string;
}

/**
 * How far a continuation row is indented under its first row. The live lines
 * hang under their message, after `#13  Step   `; anything else hangs under
 * its own leading spaces, plus two.
 */
export function hangingIndent(text: string): number {
  const live = /^#\d+ {2}\w+ +/.exec(text);
  if (live) return live[0].length;
  return (/^ */.exec(text)?.[0].length ?? 0) + 2;
}

/**
 * Word-wrap the script into rows of at most `width` columns, indent included.
 * The space a row breaks on is dropped, so `start` + `text` of every row of a
 * line, rejoined with single spaces, is the line itself. A word longer than a
 * row is cut. An empty line is one empty row.
 */
export function layoutRows(lines: readonly TranscriptLine[], width: number): Row[] {
  const rows: Row[] = [];
  lines.forEach((l, line) => {
    const role: Role = l.role ?? 'ink';
    const text = l.text;
    if (!text) { rows.push({ line, role, indent: 0, start: 0, text: '' }); return; }
    const hang = Math.min(hangingIndent(text), Math.max(0, width - 12));
    let start = 0;
    let indent = 0;
    while (start < text.length) {
      const room = Math.max(1, width - indent);
      if (text.length - start <= room) {
        rows.push({ line, role, indent, start, text: text.slice(start) });
        break;
      }
      let cut = text.lastIndexOf(' ', start + room);
      if (cut <= start) cut = start + room;
      rows.push({ line, role, indent, start, text: text.slice(start, cut) });
      start = cut;
      while (text[start] === ' ' && start < text.length) start++;
      indent = hang;
    }
  });
  return rows;
}

export interface CycleTimings {
  /** Characters per second for the request, typed by a person. */
  promptCps: number;
  /** Characters per second for ADS's own output. */
  outputCps: number;
  /** Seconds between two output lines: each is a step finishing. */
  linePause: number;
  /** Seconds between the session's end and the approval block. */
  gapSeconds: number;
  /** Seconds between two lines of the approval block, which prints at once. */
  blockLineSeconds: number;
  /** Seconds the cursor waits on the reply line before the wipe. */
  holdSeconds: number;
  /** Characters per second the wipe takes back. */
  eraseCps: number;
}

export const SESSION_TIMINGS: CycleTimings = {
  promptCps: 11,
  outputCps: 140,
  linePause: 0.6,
  gapSeconds: 1.2,
  blockLineSeconds: 0.05,
  holdSeconds: 9,
  eraseCps: 900,
};

export type Phase = 'typing' | 'gap' | 'block' | 'decode' | 'waiting' | 'erasing';

/**
 * The cycle as a state machine over the script: `session` lines are typed,
 * `approval` lines print whole. `shown(i)` says how many characters of source
 * line `i` are on screen; `decodeFrame` is the decode's frame while it runs,
 * -1 otherwise.
 */
export function createCycle(session: number[], approval: number[], t: CycleTimings = SESSION_TIMINGS) {
  // Lengths of every source line, session first. The approval block's first
  // line follows one blank line, which belongs to the block.
  const lens = [...session, ...approval];
  const firstBlock = session.length;
  const total = lens.reduce((n, l) => n + l, 0);

  let phase: Phase = 'typing';
  let line = 0;
  let chars = 0;
  let timer = 0;
  let decodeFrame = -1;
  let erased = 0;

  function reset() {
    phase = 'typing'; line = 0; chars = 0; timer = 0; decodeFrame = -1; erased = 0;
  }

  /** Jump to the finished frame, cursor waiting: where a stopped tube resumes. */
  function finish() {
    phase = 'waiting'; line = lens.length; chars = 0; timer = t.holdSeconds; decodeFrame = -1; erased = 0;
  }

  function tick(dt: number) {
    let left = dt;
    // A long frame can cross several boundaries; spend it in order.
    for (let guard = 0; left > 0 && guard < 64; guard++) {
      if (phase === 'typing') {
        if (timer > 0) { const s = Math.min(timer, left); timer -= s; left -= s; continue; }
        const cps = line === 0 ? t.promptCps : t.outputCps;
        const need = (lens[line] - chars) / cps;
        if (left < need) { chars += left * cps; left = 0; break; }
        left -= need;
        line++; chars = 0;
        if (line >= firstBlock) { phase = 'gap'; timer = t.gapSeconds; }
        else timer = line === 1 ? t.linePause * 2 : t.linePause;
      } else if (phase === 'gap') {
        const s = Math.min(timer, left); timer -= s; left -= s;
        if (timer > 0) break;
        // The block's first line (the blank before it) prints now.
        phase = 'block'; timer = t.blockLineSeconds;
      } else if (phase === 'block') {
        const s = Math.min(timer, left); timer -= s; left -= s;
        if (timer > 0) break;
        line++;
        // The reply line arrives with its code still resolving.
        if (line >= lens.length - 1) { phase = 'decode'; decodeFrame = 0; timer = DECODE.frameMs / 1000; }
        else timer = t.blockLineSeconds;
      } else if (phase === 'decode') {
        const s = Math.min(timer, left); timer -= s; left -= s;
        if (timer > 0) break;
        decodeFrame++;
        if (decodeFrame >= DECODE.frames) { finish(); }
        else timer = DECODE.frameMs / 1000;
      } else if (phase === 'waiting') {
        const s = Math.min(timer, left); timer -= s; left -= s;
        if (timer <= 0) { phase = 'erasing'; erased = 0; }
      } else {
        erased += left * t.eraseCps; left = 0;
        if (erased >= total) reset();
      }
    }
  }

  /** Characters of source line `i` on screen. */
  function shown(i: number): number {
    if (phase === 'erasing') {
      // The wipe takes characters back from the end, like the home tube's.
      let keep = Math.max(0, total - erased);
      for (let j = 0; j < i; j++) keep -= lens[j];
      return Math.max(0, Math.min(lens[i], keep));
    }
    if (i < line) return lens[i];
    if (i > line) return 0;
    if (phase === 'typing') return Math.floor(chars);
    // The block's current line is fully printed; the decode runs on the last.
    return phase === 'block' || phase === 'decode' ? lens[i] : 0;
  }

  /** True while source line `i` exists on screen at all, empty ones included. */
  function present(i: number): boolean {
    if (phase === 'erasing') return shown(i) > 0 || (lens[i] === 0 && shown(i + 1) > 0);
    if (i < line) return true;
    if (i > line) return false;
    return phase === 'typing' ? chars > 0 || lens[i] === 0 : phase === 'block' || phase === 'decode';
  }

  return {
    tick,
    shown,
    present,
    reset,
    finish,
    get phase() { return phase; },
    get decodeFrame() { return decodeFrame; },
    get total() { return total; },
  };
}

/** The changed token the decode runs on: the code at the end of the reply line. */
export function codeSpan(text: string): [number, number] | null {
  const m = /ok (\S+)$/.exec(text);
  return m ? [text.length - m[1].length, text.length] : null;
}

/* ---- drawing ----------------------------------------------------------- */

export interface SessionTubeOptions {
  session: readonly TranscriptLine[];
  approval: readonly TranscriptLine[];
  aspect: number;
  narrow: boolean;
}

const MONO = '"Geist Mono", ui-monospace, Menlo, monospace';
const CELL_W = 13;
const CELL_H = 26;
/** Glyph size against the cell height; a phone needs it a touch larger. */
const fontScale = (narrow: boolean) => (narrow ? 0.7 : 0.62);
/** Rows the tube is laid out for. */
const rowsFor = (narrow: boolean) => (narrow ? 30 : 26);
/** Margins in cells: the curvature and overscan eat the edge of the picture. */
const MARGIN_X = 3.2;
const MARGIN_Y = 1.6;

/** Build the session tube as a CrtSource for mountCrtSurface. */
export function createSessionTube(o: SessionTubeOptions): CrtSource {
  const script = [...o.session, { text: '' }, ...o.approval];
  const sessionLens = o.session.map((l) => l.text.length);
  const approvalLens = [0, ...o.approval.map((l) => l.text.length)];
  const cycle = createCycle(sessionLens, approvalLens);
  const replyLine = script.length - 1;
  const code = codeSpan(script[replyLine].text);
  const rng = { choice: <T>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)] };
  let decoded = code ? decodeFrames(script[replyLine].text.slice(code[0], code[1]), rng) : [];
  let lastFrame = -1;

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;
  const root = document.documentElement;

  let narrow = o.narrow;
  let cols = 80;
  let rows = 25;
  let width = 80;
  let rowsLaid: Row[] = [];
  let charW = 9.6;

  const font = () => `${Math.round(CELL_H * fontScale(narrow))}px ${MONO}`;

  function geometry(aspect: number) {
    rows = rowsFor(narrow);
    cols = Math.round(Math.min(200, Math.max(36, (rows * aspect) / (CELL_W / CELL_H))));
    rows = Math.max(12, Math.round((cols * CELL_W) / aspect / CELL_H));
    canvas.width = cols * CELL_W;
    canvas.height = rows * CELL_H;
    ctx.font = font();
    charW = ctx.measureText('M').width || CELL_W * 0.75;
    // Columns of text, which the mono glyph's own width decides, not the grid.
    width = Math.max(24, Math.floor((canvas.width - 2 * MARGIN_X * CELL_W) / charW));
    rowsLaid = layoutRows(script, width);
  }

  const isLight = () => root.getAttribute('data-sl-theme') === 'light';
  const token = (name: string) => getComputedStyle(root).getPropertyValue(name).trim();

  /**
   * Resolve a colour expression to what the browser computes for it: the kit's
   * *-text roles are oklch(from …) expressions the canvas cannot take.
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

  /** Read a computed colour as bytes, whatever space it is written in. */
  const bytes = (() => {
    const c = document.createElement('canvas').getContext('2d', { willReadFrequently: true })!;
    return (css: string): number[] => {
      c.clearRect(0, 0, 1, 1); c.fillStyle = css; c.fillRect(0, 0, 1, 1);
      return [...c.getImageData(0, 0, 1, 1).data.slice(0, 3)];
    };
  })();

  let bg = '#000000';
  let light = false;
  let paint: Record<Role | 'cursor' | 'erase', string> = {} as never;

  function readTokens() {
    light = isLight();
    // The dark tube is the shader's zero emission, which its additive path
    // assumes is black; the paper tube is the page's own canvas, as on the home
    // hero.
    bg = light ? token('--sl-bg-canvas') : '#000000';
    const ink = resolveColor('var(--sl-text-primary)');
    const b = bytes(bg);
    const fade = (css: string, k: number) => {
      const c = bytes(css);
      return `rgb(${c.map((v, i) => Math.round(v * k + b[i] * (1 - k))).join(', ')})`;
    };
    // The kit's text-safe reading of each hue where the theme names one, the
    // status colour otherwise, as the kit's own badges resolve it; the
    // terminal roles map onto them as the transcripts' do.
    const role = (hue: string) => resolveColor(`var(--slc-${hue}-text, var(--slc-${hue}))`);
    paint = {
      ink,
      prompt: resolveColor('var(--slc-accent-text)'),
      ok: role('success'),
      warn: role('warning'),
      err: role('danger'),
      accent: role('info'),
      dim: fade(ink, 0.55),
      cursor: resolveColor('var(--slc-accent-text)'),
      erase: fade(ink, 0.7),
    };
  }

  readTokens();
  geometry(o.aspect);

  let time = 0;
  let dirty = true;
  let resumeFinished = false;
  let lastBlink = -1;

  function draw(now: number) {
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = font();
    ctx.textBaseline = 'middle';

    const visible = rowsLaid.filter((r) => cycle.present(r.line) && (r.text === '' || cycle.shown(r.line) > r.start));
    const room = rows - Math.ceil(MARGIN_Y * 2);
    // Scroll like a terminal: the newest row stays on screen.
    const view = visible.slice(Math.max(0, visible.length - room));
    const x0 = MARGIN_X * CELL_W;
    const y0 = MARGIN_Y * CELL_H;

    let cursor: [number, number] | null = null;
    view.forEach((r, i) => {
      const y = y0 + i * CELL_H + CELL_H / 2;
      const n = Math.max(0, Math.min(r.text.length, cycle.shown(r.line) - r.start));
      const x = x0 + r.indent * charW;
      let s = r.text.slice(0, n);
      ctx.fillStyle = paint[r.role];
      if (r.line === replyLine && code && cycle.decodeFrame >= 0) {
        // Only the changed token decodes; its unsettled glyphs take `prompt`.
        const frame = decoded[Math.min(cycle.decodeFrame, decoded.length - 1)];
        const a = code[0] - r.start;
        if (a >= 0 && a <= s.length) {
          ctx.fillText(s.slice(0, a), x, y);
          ctx.fillStyle = paint.prompt;
          [...frame].forEach((ch, k) => ctx.fillText(ch, x + (a + k) * charW, y));
          s = s.slice(0, a) + frame;
          cursor = [x + s.length * charW, y];
          return;
        }
      }
      // Draw per character on the mono grid, so the decode and the cursor land
      // on the same columns the text does.
      for (let k = 0; k < s.length; k++) ctx.fillText(s[k], x + k * charW, y);
      cursor = [x + s.length * charW, y];
    });

    if (!cursor) cursor = [x0, y0 + CELL_H / 2];
    // Solid while wiping: a wipe in progress must not read as an idle prompt.
    const on = cycle.phase === 'erasing' || Math.floor(now * 2) % 2 === 0;
    if (on) {
      const [cx, cy] = cursor;
      const h = CELL_H * fontScale(narrow);
      ctx.fillStyle = cycle.phase === 'erasing' ? paint.erase : paint.cursor;
      ctx.fillRect(cx + 2, cy - h * 0.55, charW * 0.7, h * 1.1);
    }
    dirty = false;
  }

  return {
    get canvas() { return canvas; },
    get width() { return canvas.width; },
    get height() { return canvas.height; },
    get dirty() { return dirty; },
    get lightPolarity() { return light; },
    get screenBackground() { return bg; },
    tick(dt: number) {
      if (resumeFinished) { cycle.finish(); resumeFinished = false; }
      time += dt;
      const before = `${cycle.phase}|${cycle.decodeFrame}`;
      cycle.tick(dt);
      if (cycle.decodeFrame === 0 && lastFrame !== 0 && code) {
        // A fresh scramble each cycle; the last frame is always the real code.
        decoded = decodeFrames(script[replyLine].text.slice(code[0], code[1]), rng);
      }
      lastFrame = cycle.decodeFrame;
      const blink = Math.floor(time * 2);
      // Redraw only when something on screen changed: typing, a phase, the cursor.
      if (cycle.phase !== 'waiting' && cycle.phase !== 'gap') dirty = true;
      if (before !== `${cycle.phase}|${cycle.decodeFrame}` || blink !== lastBlink) dirty = true;
      lastBlink = blink;
    },
    draw: (t: number) => draw(time || t),
    /**
     * The stopped state is the finished exchange, cursor solid: the session and
     * the approval waiting for its reply. No invented text, and it resumes from
     * there, so a visitor scrolling back finds the whole thing. A tube that has
     * hardly run yet — the surface starts its loop before the observer reports
     * a tube below the fold — keeps its empty prompt, so the first visit sees
     * the session typed rather than a finished one.
     */
    drawSignalLoss() {
      if (time < 1) { draw(0.25); return; }
      cycle.finish();
      resumeFinished = true;
      draw(0.25);
    },
    refreshTokens() { readTokens(); dirty = true; },
    resize(aspect: number, isNarrow: boolean) {
      narrow = isNarrow;
      geometry(aspect);
      dirty = true;
    },
  };
}
