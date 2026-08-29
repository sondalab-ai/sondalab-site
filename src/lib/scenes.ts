/**
 * The CRT scenes and their depth planes.
 *
 * A scene is a stack of grayscale-on-black plates, one per distance from the
 * viewer. Nothing here carries a colour: `tone` names a design-system token and
 * the compositor resolves it at runtime, so a scene can never drift off palette
 * and a theme change re-tints without new artwork.
 *
 * `depth` drives the parallax — 0 is infinitely far and never moves, 1 sits on
 * the glass and moves most.
 *
 * The data itself lives in `scenes.json` rather than in this file because the
 * build scripts need it too: `scripts/make-scene-flats.mjs` has to know which
 * plane is an occluder to compose the fallback picture the same way the runtime
 * does, and a second copy of that list would drift. See
 * docs/scene-art-prompts.md for what the artwork has to satisfy.
 */
import data from './scenes.json';

/**
 * Which token a plane is painted with. Structure recedes, accents carry hue —
 * and `occluder` is not painted at all: it is the shape that stands *in front*
 * of the light. A lit screen accumulates emission, so a foreground silhouette
 * cannot be added, only subtracted; on paper the same plane is solid ink.
 */
export type Tone = 'structure' | 'depth' | 'accent' | 'occluder';

export interface SceneLayer {
  /** Path under `public/`, so the file is fetched at runtime rather than inlined. */
  src: string;
  depth: number;
  tone: Tone;
  /** Multiplier on the plane's brightness, after tinting. */
  gain: number;
}

export interface Scene {
  id: string;
  /** Read by a screen reader in place of the canvas. */
  alt: string;
  layers: SceneLayer[];
}

export const SCENES: Record<string, Scene> = data as Record<string, Scene>;
