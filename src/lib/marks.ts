/**
 * The kit's eyebrow glyphs (ui-kit 0.42), in the order a page cycles through
 * them. '' is the bare `.sl-eyebrow--mark` (the quarter disc and bar); the
 * others name the modifier worn with it. Six glyphs, so a cycle never puts the
 * same one on two neighbouring section heads.
 */
export const MARK_GLYPHS = ['', 'square', 'tri', 'circle', 'half', 'stair'] as const;

/**
 * The eyebrow classes for the `i`-th section head of a page whose heads are
 * rendered in a loop: the eyebrow, the mark, and the glyph modifier when the
 * glyph is not the bare one.
 */
export function markClass(i: number): string {
  const glyph = MARK_GLYPHS[i % MARK_GLYPHS.length];
  return glyph ? `sl-eyebrow sl-eyebrow--mark sl-eyebrow--mark-${glyph}` : 'sl-eyebrow sl-eyebrow--mark';
}
