import { grantLive, revokeLive } from '@sondalab/ui-kit/effects.js';

/**
 * Walk the one ambient aurora across the page's card surfaces.
 *
 * The kit's curtains — `--pillars`, the aurora's default light — hang BEHIND a
 * pane, which is what puts the light *in* the glass rather than on it: the lens
 * bends them at the faces and dispersion parts them into their colours there.
 * They show only while their host is `:focus-within` or carries
 * `data-sl-fx-live="on"`, and `grantLive()` is a coordinator that allows
 * exactly one such host per document — granting it anywhere revokes it
 * everywhere else.
 *
 * No prefers-reduced-motion branch, and that is not an oversight:
 * scripts/motion-gate.mjs fails the build on one. The owner's decision of
 * 2026-08-26 is that this site never consults the query, because Windows
 * reports `reduce` by default under "adjust for best performance" and a whole
 * class of visitors was getting a site with nothing moving and nothing to
 * suggest anything was missing. The kit still keeps the curtains' own drift
 * inside a `no-preference` query of its own, so such a visitor gets them lit
 * and still — which is the material without the movement, and correct.
 *
 * So the light is not on every card; it VISITS them. That honours the cap
 * rather than writing the attribute by hand on a dozen surfaces, and it costs
 * one animated, blurred layer instead of a dozen.
 */

/** How long the light rests on one surface before moving on. */
const DWELL = 9000;

/**
 * @param selector what may hold the light
 * @param dwell milliseconds on each host
 * @returns a function that stops the rotation and puts the light out
 */
export function rotateAmbientLight(selector: string, { dwell = DWELL } = {}) {
  // The hosts are read on EVERY step, never once at the start. This module is
  // imported from a script in <head>, and in dev it runs before the body is
  // parsed — a list taken at construction was empty, the first step found
  // nothing to light, and the page sat dark for nine seconds before the first
  // tick found anything. Re-reading also picks up a host rendered later, which
  // is the same reason mount() keeps a MutationObserver.
  const onStage = new Set<Element>();
  const watched = new WeakSet<Element>();
  const io =
    typeof IntersectionObserver === 'function'
      ? new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) onStage.add(e.target);
              else onStage.delete(e.target);
            }
          },
          { rootMargin: '0px' },
        )
      : null;

  let at = 0;
  let current: Element | null = null;

  /** Move the light to the next host on screen, counting from where it is. */
  const step = () => {
    const hosts = [...document.querySelectorAll(selector)];
    for (const h of hosts) {
      if (watched.has(h)) continue;
      watched.add(h);
      // Fails open: a host counts as on stage from the moment it is seen, so
      // an environment that never delivers an entry lights cards rather than
      // none. The observer only ever takes them back off.
      onStage.add(h);
      io?.observe(h);
    }
    for (let n = 0; n < hosts.length; n++) {
      const next = hosts[(at + n) % hosts.length];
      if (!onStage.has(next)) continue;
      at = (at + n + 1) % hosts.length;
      current = next;
      grantLive(next);
      return;
    }
    // Nothing on screen: put it out rather than leave it burning off-page.
    if (current) revokeLive(current);
    current = null;
  };

  // Re-reading the hosts makes a first step before the body is parsed HARMLESS
  // but not useful: it finds nothing and the page then sits dark until the
  // first tick, a whole dwell later. So the opening step waits for the
  // document if it has to.
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', step, { once: true });
  } else {
    step();
  }
  const timer = setInterval(step, dwell);

  return () => {
    clearInterval(timer);
    io?.disconnect();
    if (current) revokeLive(current);
  };
}
