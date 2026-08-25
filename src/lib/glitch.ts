/**
 * Client-side glitch driver. The visual is pure CSS (.is-glitching, looping);
 * JS owns *timing* so bursts have random, capped length and hover fires
 * intermittent bursts with random pauses rather than glitching continuously.
 */
const CAP_MS = 1500; // hard ceiling on any single burst
const rand = (a: number, b: number) => a + Math.random() * (b - a);
const motionOK = () =>
  matchMedia('(prefers-reduced-motion: no-preference)').matches;

type BurstOpts = { burstMin?: number; burstMax?: number };
type AutoOpts = BurstOpts & { waitMin?: number; waitMax?: number };
type HoverOpts = BurstOpts & { pauseMin?: number; pauseMax?: number };

/**
 * Randomise the two ghost channels for this burst: each gets its own pulse
 * duration and a negative phase delay (so they start mid-cycle and drift apart),
 * plus a shared amplitude multiplier. Re-rolled before every burst.
 */
function randomizeGhosts(el: HTMLElement) {
  const dur = () => `${(0.11 + Math.random() * 0.12).toFixed(3)}s`; // 0.11–0.23s
  const phase = () => `-${(Math.random() * 0.22).toFixed(3)}s`; // enter mid-cycle
  el.style.setProperty('--gda', dur());
  el.style.setProperty('--gdb', dur());
  el.style.setProperty('--gdj', dur());
  el.style.setProperty('--gpha', phase());
  el.style.setProperty('--gphb', phase());
  el.style.setProperty('--gmul', (0.75 + Math.random() * 0.7).toFixed(2)); // 0.75–1.45

  // Per-band sideways offset for the shatter variant (both directions).
  const shards = el.querySelectorAll<HTMLElement>('.glitch__shard');
  shards.forEach((s) => {
    const px = (5 + Math.random() * 13) * (Math.random() < 0.5 ? -1 : 1);
    s.style.setProperty('--sx', `${px.toFixed(1)}px`);
  });
}

/** One burst of random length (<= CAP_MS). */
export function fireBurst(el: Element, { burstMin = 200, burstMax = 500 }: BurstOpts = {}) {
  if (!motionOK()) return;
  const dur = Math.min(CAP_MS, rand(burstMin, burstMax));
  randomizeGhosts(el as HTMLElement);
  el.classList.add('is-glitching');
  window.setTimeout(() => el.classList.remove('is-glitching'), dur);
}

/** Wait a random gap, burst, repeat — for ambient elements like the hero word. */
export function autoBurst(
  el: Element,
  { waitMin = 6000, waitMax = 11000, burstMin = 200, burstMax = 500 }: AutoOpts = {},
) {
  if (!motionOK()) return;
  const loop = () => {
    window.setTimeout(() => {
      fireBurst(el, { burstMin, burstMax });
      loop();
    }, rand(waitMin, waitMax));
  };
  loop();
}

/**
 * While `hoverEl` is hovered, glitch `targetEl` in bursts separated by random
 * pauses. Stops immediately on leave.
 */
export function hoverBurst(
  hoverEl: Element,
  targetEl: Element,
  { burstMin = 200, burstMax = 500, pauseMin = 500, pauseMax = 1600 }: HoverOpts = {},
) {
  if (!motionOK()) return;
  let active = false;
  const timers: number[] = [];
  const clear = () => {
    while (timers.length) window.clearTimeout(timers.pop());
  };
  const cycle = () => {
    if (!active) return;
    const dur = Math.min(CAP_MS, rand(burstMin, burstMax));
    randomizeGhosts(targetEl as HTMLElement);
    targetEl.classList.add('is-glitching');
    timers.push(
      window.setTimeout(() => {
        targetEl.classList.remove('is-glitching');
        if (active) timers.push(window.setTimeout(cycle, rand(pauseMin, pauseMax)));
      }, dur),
    );
  };
  hoverEl.addEventListener('mouseenter', () => {
    if (active) return;
    active = true;
    cycle();
  });
  hoverEl.addEventListener('mouseleave', () => {
    active = false;
    clear();
    targetEl.classList.remove('is-glitching');
  });
}
