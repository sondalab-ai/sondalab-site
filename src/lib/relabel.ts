/** The structural subset of a DOM element relabel() needs, so it tests without a DOM. */
interface LabelHost {
  childNodes: ArrayLike<{ nodeType: number; textContent: string | null; remove(): void }>;
  append(text: string): void;
}

const TEXT_NODE = 3;

/**
 * Wraps a control's label in brackets by replacing only its text nodes, and
 * returns the new label. Writing `textContent` would also delete the layers the
 * kit injects into the control (the dither hover's span, ui-kit 0.39), while
 * the kit keeps pointing at the detached one and the hover goes dead.
 */
export function bracketLabel(host: LabelHost): string {
  const texts = Array.from(host.childNodes).filter((n) => n.nodeType === TEXT_NODE);
  const label = `[ ${texts.map((n) => n.textContent ?? '').join('').trim()} ]`;
  for (const n of texts) n.remove();
  host.append(label);
  return label;
}
