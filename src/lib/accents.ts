import registry from '@sondalab/ui-kit/agent/accent-registry.json';

export type AccentKey = 'default' | 'spexr' | 'introspect' | 'local-agents';

type Entry = { light?: string; dark?: string; inherits?: string };

/**
 * Resolve a registered accent to its light/dark hex. Values come straight from
 * the design system's accent-registry.json, so pages can never drift from the
 * blessed hues. `inherits` (e.g. daos → default) is followed one level.
 */
export function accentVars(key: AccentKey): { light: string; dark: string } {
  const products = registry.products as Record<string, Entry>;
  let entry = products[key] ?? products.default;
  if (entry.inherits) entry = products[entry.inherits] ?? products.default;
  return {
    light: entry.light ?? products.default.light!,
    dark: entry.dark ?? products.default.dark!,
  };
}
