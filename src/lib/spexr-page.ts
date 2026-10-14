/**
 * The /spexr/ page's content: its sections and the screenshot each one shows.
 * The pictures are dark-theme, 2x captures of spexr on a showcase project
 * (spexr-ide tests/visual, marketing-shots.yml); the AI text in them was
 * written by spexr's local models. Every claim here was checked against the
 * spexr source when written: seven workflow steps (packages/spec), seven
 * built-in experts (packages/agent/src/experts/catalog.ts).
 */

export const SPEXR_RELEASES = 'https://github.com/sondalab-ai/spexr-ide/releases';
export const SPEXR_REPO = 'https://github.com/sondalab-ai/spexr-ide';

export interface SpexrShot {
  /** File name in src/assets/spexr/. */
  readonly file: string;
  readonly alt: string;
  readonly caption?: string;
}

export interface SpexrSection {
  readonly id: string;
  readonly kicker: string;
  readonly h2: string;
  readonly body: readonly string[];
  readonly shots: readonly SpexrShot[];
  /** A short point with no picture of its own, shown beside the shots. */
  readonly aside?: { readonly h3: string; readonly p: string };
}

export const SPEXR_HERO: SpexrShot = {
  file: 'hero.png',
  alt: 'The SPEXR welcome page: “Spec-based development, agent-first.”, with New project, Open folder and Talk to the agent',
};

export const SPEXR_SECTIONS: readonly SpexrSection[] = [
  {
    id: 'specs',
    kicker: 'Specs',
    h2: 'Every change starts as a spec.',
    body: [
      'A spec is a Markdown file with a goal and acceptance criteria. It moves through seven steps, from Specify to Ship, and SPEXR shows where each one stands.',
      'Hand a spec to the agent and its context goes with it. The plan comes back as tasks you can tick off, and a drift check flags code that no longer matches what the spec asks.',
    ],
    shots: [
      { file: 'specs.png', alt: 'The Specs view: workspace progress and each spec with its workflow steps', caption: 'Every spec in the workspace, and the step it is at.' },
      { file: 'spec-detail.png', alt: 'A spec at the Implement step with its plan as a task checklist, two of five done', caption: 'A spec mid-implementation, its plan ticked off task by task.' },
    ],
  },
  {
    id: 'darkfactory',
    kicker: 'Darkfactory',
    h2: 'Every agent session on one wall.',
    body: [
      'Darkfactory lists every local agent session, grouped by project. Each card shows whether the agent is working, idle or waiting for you, with a summary written on your machine.',
      'Click a card to pick the session up. Find an old one by describing it, open the pull request or local page it produced, and chain sessions into a schedule that runs them in order.',
    ],
    shots: [
      { file: 'darkfactory.png', alt: 'The Darkfactory wall: session cards for the ledgerline project, one flagged as needing you, each with an on-device summary', caption: 'Live state and an on-device summary on every card.' },
      { file: 'df-search.png', alt: 'Darkfactory search for “the one about month-end dates” with three matching sessions, and a plant schedule of three tasks', caption: 'Find a session by describing it. The schedule runs tasks in order.' },
      { file: 'df-card.png', alt: 'A pinned session card with its summary, a terminal, and a browser showing the reconcile report the session served', caption: 'A card opens its session, with a browser on what it produced.' },
    ],
  },
  {
    id: 'experts',
    kicker: 'Experts',
    h2: 'The right expert for each step.',
    body: [
      'SPEXR ships seven built-in expert personas, such as Design, Review and Software Engineering. Add the ones a project needs, and the matching expert switches on when a spec moves to a new step.',
    ],
    shots: [
      { file: 'experts.png', alt: 'The Experts panel: Design, Review and Software Engineering added to the project, Software Engineering active, more in the marketplace', caption: 'One expert is active at a time.' },
    ],
  },
  {
    id: 'memory',
    kicker: 'Memory',
    h2: 'What the agent learns, it keeps.',
    body: [
      'Memory is plain Markdown notes, kept for you and for the project, and loaded into every session. Move a note between the two as it proves useful beyond one project.',
    ],
    shots: [
      { file: 'memory.png', alt: 'The Memory panel listing project, reference and user notes, each with a short description', caption: 'Notes the agent loads in every session.' },
    ],
  },
  {
    id: 'search',
    kicker: 'Smart search',
    h2: 'Search by meaning, on your machine.',
    body: [
      'Ask in plain words and SPEXR ranks files by meaning and by keyword together. A local model writes a one-line description of each file. Nothing leaves your machine.',
    ],
    shots: [
      { file: 'search.png', alt: 'Smart search for “where do bank dates get parsed” with ranked files and one-line descriptions', caption: 'Ranked by meaning, described on-device.' },
    ],
  },
  {
    id: 'also',
    kicker: 'Also in the box',
    h2: 'Git, and more than one agent.',
    body: [
      'Git is built in: stage, commit, push and branch without leaving the IDE. The local model writes the commit message from the staged diff.',
    ],
    shots: [
      { file: 'commit-message.png', alt: 'Source Control with one staged file and a commit message the local model wrote from the diff', caption: 'A commit message written from the diff.' },
    ],
    aside: {
      h3: 'opencode next to Claude',
      p: 'SPEXR runs opencode sessions alongside Claude’s, and Darkfactory shows both on the same wall.',
    },
  },
];
