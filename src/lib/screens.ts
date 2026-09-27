import type { ImageMetadata } from 'astro';
import welcome from '../assets/products/spexr/welcome.png';
import specsAgent from '../assets/products/spexr/specs-agent.png';
import experts from '../assets/products/spexr/experts.png';
import memory from '../assets/products/spexr/memory.png';
import smartSearch from '../assets/products/spexr/smart-search.png';

/**
 * Real product screenshots, by product id. Only spexr has curated captures
 * (copied from spexr/docs/screenshots at cb89aec81aee); a product absent here
 * renders no strip.
 */
export const SCREENS: Record<string, { src: ImageMetadata; alt: string; caption: string }[]> = {
  spexr: [
    { src: welcome, alt: 'SPEXR welcome screen: the agent session on the left, and the seven-phase workflow from Initialize to Ship', caption: 'Welcome' },
    { src: specsAgent, alt: 'SPEXR specs view listing eight specs, each with its seven workflow steps and a Send to agent button', caption: 'Specs, each on its seven-step workflow' },
    { src: experts, alt: 'SPEXR specs view beside the Experts panel, with Brainstorming, Design and Review personas in the project', caption: 'Expert agents' },
    { src: memory, alt: 'SPEXR memory panel listing the project and feedback notes the agent loads every session, with baseline, user and project scopes', caption: 'Memory the agent loads' },
    { src: smartSearch, alt: 'SPEXR explorer search results ranked by relevance, each file summarised on-device, beside the welcome screen and the Experts panel', caption: 'On-device smart search' },
  ],
};
