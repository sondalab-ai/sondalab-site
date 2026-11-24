import { test } from 'node:test';
import assert from 'node:assert/strict';
import { codeSpan, createCycle, fitHeight, hangingIndent, layoutRows, SESSION_TIMINGS } from '../src/lib/crt-session.ts';
import { ADS_APPROVAL, ADS_SESSION } from '../src/lib/ads-page.ts';

const SCRIPT = [...ADS_SESSION, { text: '' }, ...ADS_APPROVAL];

/** Rejoin a line's rows the way a reader would: the break spaces come back. */
function rejoin(rows, line) {
  return rows.filter((r) => r.line === line).map((r) => r.text).join(' ');
}

test('a live line hangs under its message, anything else under its indent plus two', () => {
  assert.equal(hangingIndent('#13  Step   checks: test pass'), '#13  Step   '.length);
  assert.equal(hangingIndent('#13  End    ready'), '#13  End    '.length);
  assert.equal(hangingIndent('    - Makefile (+4 −0)'), 6);
  assert.equal(hangingIndent('ads needs your approval'), 2);
});

for (const width of [44, 52, 104]) {
  test(`wrapping at ${width} columns invents nothing and drops nothing`, () => {
    const rows = layoutRows(SCRIPT, width);
    SCRIPT.forEach((l, i) => assert.equal(rejoin(rows, i), l.text, `line ${i}`));
    for (const r of rows) {
      assert.ok(r.indent + r.text.length <= width, `row "${r.text}" is ${r.indent + r.text.length} wide`);
      assert.equal(SCRIPT[r.line].text.slice(r.start, r.start + r.text.length), r.text);
    }
  });
}

test('rows keep the line role, and an unpainted line is ink', () => {
  const rows = layoutRows(SCRIPT, 44);
  assert.equal(rows[0].role, 'prompt');
  assert.ok(rows.filter((r) => r.line === 2).every((r) => r.role === 'accent'));
  assert.equal(rows.find((r) => r.line === 4).role, 'ink');
});

test('at desktop width the session and the approval fit one screen unwrapped', () => {
  assert.equal(layoutRows(SCRIPT, 104).length, SCRIPT.length);
});

test('the decode runs on the code alone', () => {
  const reply = ADS_APPROVAL.at(-1).text;
  const [a, b] = codeSpan(reply);
  assert.equal(reply.slice(a, b), '4f2a');
  assert.equal(codeSpan('no code here'), null);
});

const lens = (ls) => ls.map((l) => l.text.length);
const cycle = () => createCycle(lens(ADS_SESSION), [0, ...lens(ADS_APPROVAL)]);

/** Advance in display frames, recording each phase change. */
function oneCycle(c, step = 1 / 60) {
  const seen = [c.phase];
  let t = 0;
  for (; t < 120 && !(seen.length > 1 && c.phase === 'typing'); t += step) {
    c.tick(step);
    if (seen.at(-1) !== c.phase) seen.push(c.phase);
  }
  return { seen, seconds: t };
}

test('one cycle types, waits, prints the block, decodes the code, holds, wipes and starts over', () => {
  const c = cycle();
  const { seen, seconds } = oneCycle(c);
  assert.deepEqual(seen, ['typing', 'gap', 'block', 'decode', 'waiting', 'erasing', 'typing']);
  // Long enough to read, short enough that a visitor sees it loop.
  assert.ok(seconds > 15 && seconds < 40, `cycle took ${seconds.toFixed(1)} s`);
});

test('the request is typed character by character before any output', () => {
  const c = cycle();
  c.tick(0.3);
  assert.ok(c.shown(0) > 0 && c.shown(0) < ADS_SESSION[0].text.length);
  assert.equal(c.shown(1), 0);
  assert.equal(c.present(1), false);
});

test('the approval block appears only after the session has ended', () => {
  const c = cycle();
  const S = ADS_SESSION.length;
  for (let t = 0; c.phase === 'typing'; t++) {
    c.tick(1 / 60);
    assert.equal(c.present(S + 1), false);
  }
  assert.equal(c.phase, 'gap');
  for (let i = 0; i < S; i++) assert.equal(c.shown(i), ADS_SESSION[i].text.length);
});

test('the decode has the kit\'s frames, once, and then the reply waits with everything shown', () => {
  const c = cycle();
  const frames = [];
  while (c.phase !== 'waiting') {
    c.tick(1 / 120);
    if (c.phase === 'decode' && frames.at(-1) !== c.decodeFrame) frames.push(c.decodeFrame);
  }
  assert.deepEqual(frames, [0, 1, 2, 3]);
  assert.equal(c.decodeFrame, -1);
  SCRIPT.forEach((l, i) => assert.equal(c.shown(i), l.text.length));
});

test('the wipe empties the screen from the end before the next cycle', () => {
  const c = cycle();
  while (c.phase !== 'erasing') c.tick(1 / 60);
  c.tick(0.05);
  const last = SCRIPT.length - 1;
  assert.ok(c.shown(last) < SCRIPT[last].text.length || !c.present(last));
  assert.equal(c.shown(0), ADS_SESSION[0].text.length);
  while (c.phase === 'erasing') c.tick(1 / 60);
  assert.equal(c.phase, 'typing');
  SCRIPT.forEach((_, i) => assert.equal(c.shown(i), 0));
});

test('a stopped tube resumes on the finished exchange, holding before the wipe', () => {
  const c = cycle();
  c.tick(1);
  c.finish();
  assert.equal(c.phase, 'waiting');
  SCRIPT.forEach((l, i) => assert.equal(c.shown(i), l.text.length));
  c.tick(SESSION_TIMINGS.holdSeconds - 0.1);
  assert.equal(c.phase, 'waiting');
  c.tick(0.2);
  assert.equal(c.phase, 'erasing');
});

test('a long frame spends its time across several phases in order', () => {
  const c = cycle();
  c.tick(30);
  assert.ok(['waiting', 'erasing', 'typing'].includes(c.phase));
});

test('on a phone-width tube a wrapped line keeps most of the row, not a ribbon', () => {
  const rows = layoutRows(SCRIPT, 30);
  for (const r of rows) assert.ok(r.indent <= 6, `indent ${r.indent} on "${r.text}"`);
  SCRIPT.forEach((l, i) => assert.equal(rejoin(rows, i), l.text));
});

test('the screen grows with the buffer, so every row fits inside the curved edge', () => {
  const lineH = 39;
  const h = fitHeight(25, lineH);
  assert.ok(h * (1 - 2 * 0.075) >= 25 * lineH);
  assert.ok(fitHeight(40, lineH) > h);
  assert.equal(fitHeight(40, lineH, 1000), 1000);
});
