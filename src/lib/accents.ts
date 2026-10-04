import registry from '@sondalab/ui-kit/agent/accent-registry.json';

export type AccentKey = 'default' | 'spexr' | 'introspect' | 'local-agents';

type Pair = { light: string; dark: string };
type Entry = { light?: string; dark?: string; inherits?: string; fill?: Partial<Pair> };

/**
 * Resolve a registered accent to its light/dark hex. Values come straight from
 * the design system's accent-registry.json, so pages can never drift from the
 * blessed hues. `inherits` (e.g. daos → default) is followed one level.
 *
 * `fill` is the colour a filled control carrying a label is painted with: the
 * product's registered `fill` where it has one (spexr's deeper indigo, which
 * its white label reads on), else the accent itself. It feeds the kit's
 * `--slc-accent-fill` role (ui-kit 0.32).
 */
export function accentVars(key: AccentKey): Pair & { fill: Pair } {
  const products = registry.products as Record<string, Entry>;
  let entry = products[key] ?? products.default;
  if (entry.inherits) entry = products[entry.inherits] ?? products.default;
  const light = entry.light ?? products.default.light!;
  const dark = entry.dark ?? products.default.dark!;
  return { light, dark, fill: { light: entry.fill?.light ?? light, dark: entry.fill?.dark ?? dark } };
}
