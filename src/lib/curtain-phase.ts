/**
 * Scatter the curtains' phase, one seed per card.
 *
 * The kit starts every pillars animation the moment its rule begins matching,
 * which for a page that lights all its cards at once is the same instant for
 * all of them: measured here, twelve glows at `currentTime: 0`, drifting in
 * formation. A row of panes marching together reads as one pattern printed
 * twelve times, which is what the owner saw.
 *
 * A phase offset is the whole fix, and CSS cannot roll a die — so the seed is
 * written here and the delays are derived from it in site.css. Negative
 * delays, so every card starts already somewhere inside its cycle rather than
 * waiting to enter one.
 *
 * The seed is deterministic per position, not random per load: a card that
 * jumped to a different phase on every reload would flicker on any navigation
 * that re-renders the page, and there is nothing to gain from it. The golden
 * ratio is the usual choice for spreading a small integer index over [0, 1)
 * without two neighbours landing close together.
 */

const GOLDEN = 0.618033988749895;

/** @param selector the hosts whose seated glows should be scattered */
export function scatterCurtains(selector: string) {
  const apply = () => {
    const hosts = [...document.querySelectorAll(selector)];
    hosts.forEach((host, i) => {
      const glow = host.previousElementSibling;
      if (!(glow instanceof HTMLElement)) return;
      if (!glow.classList.contains('sl-fx-aurora__glow')) return;
      glow.style.setProperty('--slfx-seed', String(((i + 1) * GOLDEN) % 1));
    });
  };

  // The glows are INJECTED by mount(), so they do not exist when this module
  // runs. One pass now for anything already dressed, and an observer for the
  // rest — the same reason mount() keeps one of its own.
  apply();
  if (typeof MutationObserver === 'function') {
    const mo = new MutationObserver(apply);
    mo.observe(document.body, { childList: true, subtree: true });
    // The injection is a single burst at mount; stop watching once it is done
    // rather than re-running on every DOM change for the life of the page.
    setTimeout(() => mo.disconnect(), 4000);
  }
}
