/**
 * Cut each numeral's glass to its own letterforms.
 *
 * A mask clips a backdrop-filter's output, so masking a pane to the glyphs
 * leaves glass in the shape of the number rather than a box containing one.
 * The mask has to be an SVG `<text>` living in the document: a data URI has no
 * access to the page's webfonts and falls back to a system mono, which is a
 * different shape from the one the element measured itself from.
 *
 * The geometry is measured rather than declared. `maskContentUnits="objectBoundingBox"`
 * was tried and is a trap — an SVG font-size in bounding-box units scales by the
 * NORMALISED DIAGONAL, not by the height, so on a box that is not square the
 * glyphs come out stretched and oversized, and the mask renders as a slab.
 * userSpaceOnUse with real pixels has no such surprise, and the pixels come from
 * the element itself, so the face and the size can change without touching this.
 */

/** Build (or refresh) the mask for one numeral. */
function cut(el: HTMLElement, id: string) {
  const cs = getComputedStyle(el);
  const box = el.getBoundingClientRect();
  if (!box.width || !box.height) return;

  // The baseline, from the face itself rather than from a guessed ratio: a
  // canvas reports the real ascent for this font at this size.
  const canvas = cut.canvas ?? (cut.canvas = document.createElement('canvas'));
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  ctx.font = `${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
  const m = ctx.measureText(el.textContent ?? '');
  const ascent = m.actualBoundingBoxAscent;
  const width = m.width;

  const svg = document.getElementById('glass-numeral-masks');
  if (!svg) return;
  let mask = document.getElementById(id) as SVGMaskElement | null;
  if (!mask) {
    mask = document.createElementNS('http://www.w3.org/2000/svg', 'mask') as SVGMaskElement;
    mask.id = id;
    mask.setAttribute('maskUnits', 'userSpaceOnUse');
    mask.setAttribute('maskContentUnits', 'userSpaceOnUse');
    mask.append(document.createElementNS('http://www.w3.org/2000/svg', 'text'));
    svg.querySelector('defs')?.append(mask);
  }
  for (const [k, v] of [['x', 0], ['y', 0], ['width', box.width], ['height', box.height]] as const) {
    mask.setAttribute(k, String(v));
  }
  const text = mask.querySelector('text')!;
  text.textContent = el.textContent;
  // Centred on the box the element measured, so the mask sits on the glyphs the
  // element would have painted rather than beside them.
  text.setAttribute('x', String((box.width - width) / 2));
  text.setAttribute('y', String((box.height - (m.actualBoundingBoxAscent + m.actualBoundingBoxDescent)) / 2 + ascent));
  text.setAttribute('fill', 'white');
  for (const [k, v] of [
    ['font-family', cs.fontFamily],
    ['font-weight', cs.fontWeight],
    ['font-size', cs.fontSize],
    ['letter-spacing', cs.letterSpacing],
  ] as const) text.setAttribute(k, v);

  el.style.setProperty('-webkit-mask-image', `url(#${id})`);
  el.style.setProperty('mask-image', `url(#${id})`);
}
cut.canvas = undefined as HTMLCanvasElement | undefined;

/** @param selector the numerals to cut */
export function glassNumerals(selector: string) {
  const apply = () => {
    document.querySelectorAll<HTMLElement>(selector).forEach((el, i) => cut(el, `glass-num-${i}`));
  };
  // The face has to have arrived, or the ascent is a fallback font's.
  document.fonts?.ready.then(apply);
  apply();
  // A resize changes the clamped font size, and with it every measurement here.
  if (typeof ResizeObserver === 'function') {
    const ro = new ResizeObserver(apply);
    for (const el of document.querySelectorAll(selector)) ro.observe(el);
  }
  // And so does the TEXT. A product row decode-scrambles its numeral on hover,
  // which swaps the digits a dozen times a second; a mask cut from the old
  // string would leave the glass in the shape of a figure no longer there.
  if (typeof MutationObserver === 'function') {
    const mo = new MutationObserver(apply);
    for (const el of document.querySelectorAll(selector)) {
      mo.observe(el, { characterData: true, childList: true, subtree: true });
    }
  }
}
