/**
 * The /ads/ page's content: the copy, the transcripts and the tables. Facts
 * come from the ADS repo, branch epic/ads-v1 at commit d7e7189: budgets and
 * size limits from internal/config/config.go, the approval window from
 * internal/approve/approve.go, landing rules and the "You say" table from
 * README.md. The live lines copy the formats of internal/report/view.go
 * (FollowPlan, FollowStep, FollowEnd) and the cases of view_test.go; the
 * approval block copies internal/flow/ask.go (approvalBlock) and
 * internal/flow/signoff.go, as cmd/ads/testdata/script/signoff_flow.txtar
 * prints it. The docs-only exception of the first step comes from ADS
 * 8942f68 (internal/flow/attempt.go, README.md). The agents that ads init
 * sets (internal/cli/agents.go, internal/config/config.go) and the
 * "be stricter on payment/" row of the README table come from ADS 29fbba3.
 * The "sweep the codebase" row and the sweep rule of the medium row come
 * from ADS 6846133 (README.md, internal/flow/landing.go).
 * Text in backticks is shown in code font.
 */

export const ADS_REPO = 'https://github.com/sondalab-ai/agentic-dev-system';
export const ADS_NOTICE = 'ADS is in beta. The repository opens soon.';

/**
 * What the page shows for the repository: the beta notice while it is
 * private, the link once it is public. Driven by the product file's
 * repoPublic, so flipping that one flag updates every place.
 */
export function repoState(repoPublic: boolean): { notice: string | null; repoHref: string | null } {
  return repoPublic ? { notice: null, repoHref: ADS_REPO } : { notice: ADS_NOTICE, repoHref: null };
}

/** One line of a transcript, painted with a terminal role (tui-patterns.md). */
export interface TranscriptLine {
  readonly text: string;
  readonly role?: 'prompt' | 'ok' | 'warn' | 'err' | 'dim' | 'accent';
}

export interface AdsTable {
  readonly head: readonly string[];
  readonly rows: readonly (readonly string[])[];
}

export interface AdsBenefit {
  readonly id: string;
  readonly kicker: string;
  readonly h2: string;
  readonly body: readonly string[];
  readonly table?: AdsTable;
}

export const ADS_HERO = {
  eyebrow: 'ADS · beta',
  h1: 'Say `fix #13`. An agent team tests, changes and reviews it. You keep the last word.',
  lede: 'You ask Claude Code for a change, and `ads` runs an agent team for it: tests first, then the change, then a review in layers. A small change of trivial, low or medium risk that passes every check can land by itself, signed in git; high and critical changes wait for your `ok <code>`.',
};

export const ADS_SESSION: readonly TranscriptLine[] = [
  { text: '> fix #13', role: 'prompt' },
  { text: '#13  Plan   feature: Add a cover target to the Makefile', role: 'dim' },
  { text: '#13  Plan   risk high (forecast): Makefile matches a path rule, declared trivial', role: 'dim' },
  { text: '#13  Plan   test author, implementer, 6 review layers · at most 3 rounds · 8M tokens · 3600 s', role: 'dim' },
  { text: '#13  Step   test author done · 1 frozen test · 74 s' },
  { text: '#13  Step   round 1 · implementer done · 32 s' },
  { text: '#13  Step   checks: test pass · frozen pass' },
  { text: '#13  Step   review round 1: correctness ✓ · scope ✓ · acceptance ✓ · security ✓ · concurrency ✓ · api ✓', role: 'ok' },
  { text: '#13  End    ready for sign-off · 123k tokens', role: 'accent' },
];

export const ADS_APPROVAL: readonly TranscriptLine[] = [
  { text: 'ads needs your approval: sign off and land #13 "Add a cover target to the Makefile"', role: 'accent' },
  { text: '' },
  { text: '  Risk: high' },
  { text: '  Tests: 1 frozen test failed before the change and passes now, checks pass' },
  { text: '  Spent: 123k tokens' },
  { text: '  Changed files:' },
  { text: '    - cover_cdr0013_test.go (+18 −0)' },
  { text: '    - Makefile (+4 −0)' },
  { text: '  Head: 3f9c0a7b12de' },
  { text: '' },
  { text: 'To approve, reply:   ok 4f2a', role: 'prompt' },
];

/** One step of the four-step flow; `who` is the role that acts in it. */
export interface AdsStep {
  readonly who: string;
  readonly title: string;
  readonly body: string;
}

/** The two ways step 4 ends, shown as the fork after the last step. */
export const ADS_EXITS: readonly { readonly when: string; readonly then: string }[] = [
  { when: 'trivial, low, medium', then: 'lands by itself, signed with the team key' },
  { when: 'high, critical', then: 'waits for your `ok <code>`, signed with your key' },
];

export const ADS_STEPS: readonly AdsStep[] = [
  {
    who: 'test author',
    title: 'Tests first',
    body: 'A test author writes tests for the request, and they are frozen. For a bug or a feature, they must fail before the change. A docs-only change has none: a test would pass before and after it.',
  },
  {
    who: 'implementer',
    title: 'The change',
    body: 'An implementer makes the change until the frozen tests and the checks pass, in at most 3 rounds by default.',
  },
  {
    who: 'reviewers',
    title: 'A review in layers',
    body: 'Each layer is a separate reviewer: one for a trivial change, six for high and critical. A finding blocks only from severity major, and only with a test that fails on the change.',
  },
  {
    who: 'risk decides',
    title: 'It lands, or it waits for you',
    body: 'The risk picks one of the two exits below. To land by itself, a change must stay within its size limit and pass every check; a medium one only when the run had no dispute and no stall. Every landed change can be undone, after your approval, with a signed revert.',
  },
];

export const ADS_BENEFITS: readonly AdsBenefit[] = [
  {
    id: 'talk',
    kicker: 'You talk, it works',
    h2: 'No new tool to learn: you speak to Claude Code.',
    body: [
      'After setup you work by talking to Claude Code, and it runs `ads` for you. Only the install, the setup and its check run in a terminal.',
    ],
    table: {
      head: ['You say', 'What happens'],
      rows: [
        ['“fix #12”', 'The team works on issue 12 in the background. You get a short report, or one question.'],
        ['“work the queue”', 'The team works the open issues labeled `ads`, one at a time, and ends with what waits for you.'],
        ['“sweep the codebase”', 'Sweeper agents read part of the trunk and file what they find as issues labeled `ads`. “what would a sweep find?” shows the findings and files nothing.'],
        ['“what is waiting for me?”', 'A list of the changes that need you: a sign-off, a question, a budget, or a paused change.'],
        ['“change X”', 'After a report: the team makes one more round with your words.'],
        ['“be stricter on payment/”', 'The session proposes a change of the team rules and shows it in plain words, with the files that gain or lose protection. After your approval, it lands signed with your key.'],
        ['`ok 4f2a`', 'Approves the one pending question with the code `4f2a`.'],
      ],
    },
  },
  {
    id: 'risk',
    kicker: 'Risk decides who signs',
    h2: 'The risk of a change decides who signs it.',
    body: [
      'The risk is the highest of three: the risk the team declares, the path rules in `.ads/config.yaml`, and the risk a reviewer raises. Agents cannot lower it below the path rules.',
      'A change lands by itself only within a size limit: 20 changed lines for trivial, 200 for low, 400 for medium. A binary file, or a file outside the request, makes it wait for your sign-off.',
    ],
    table: {
      head: ['Risk', 'Lands', 'Signed by'],
      rows: [
        ['trivial, low', 'by itself, when every check passes', 'team key'],
        ['medium', 'by itself, when every check passes, the run had no dispute and no stall; otherwise it waits for your sign-off. A fix of a sweep issue always waits.', 'team key, or you'],
        ['high, critical', 'waits for your sign-off', 'your key'],
      ],
    },
  },
  {
    id: 'signed',
    kicker: 'Signed in git',
    h2: 'Every step is signed in git.',
    body: [
      'Each change keeps its history as signed events on its own git ref. The team key signs what the agents do. `ads work` starts only once `ads init` has set up the team key and listed it as trusted. Your key signs your answers, approvals, sign-offs and team-rule changes.',
      'The keys that may sign are listed in `.ads/allowed_signers` on the trunk. `ads audit verify` checks every signature, and `ads audit show` prints each event with its signer.',
    ],
    table: {
      head: ['Who acts', 'Signed with'],
      rows: [
        ['the agent team: tests, change, review, a landing by itself', 'team key'],
        ['you: an approval, a sign-off, a team-rule change', 'your key'],
      ],
    },
  },
  {
    id: 'control',
    kicker: 'Stop, pause, undo',
    h2: 'Stop, pause or undo at any time.',
    body: [
      '`pause #12` stops the team after its current step and keeps everything: the pull request, the branch, the tests and the budget used. It needs no approval, and the current step can still land the change.',
      '`stop #12` ends the work and closes the pull request, after your approval. Only a stop keeps a change from landing.',
      '`undo #12` reverts a landed change with a signed commit, after your approval.',
      'An approval is your `ok <code>` in the session, within 10 minutes. A plain “ok” with no code approves nothing.',
    ],
  },
  {
    id: 'budget',
    kicker: 'A budget per change',
    h2: 'Each change has a budget, and asks before it spends more.',
    body: [
      'By default a change gets at most 3 rounds and 3600 seconds, and a token budget for its risk. Tokens count every kind, cache reads included. The seconds count only the time while a stage runs, not a wait for your answer or a pause. There is no dollar limit by default.',
      'Going over asks you for one more budget, with an approval. You can set your own budgets per risk in `.ads/config.yaml`.',
    ],
    table: {
      head: ['Risk', 'Rounds', 'Seconds', 'Tokens'],
      rows: [
        ['trivial', '3', '3600', '1M'],
        ['low', '3', '3600', '1.5M'],
        ['medium', '3', '3600', '3M'],
        ['high', '3', '3600', '8M'],
        ['critical', '3', '3600', '8M'],
      ],
    },
  },
];

export const ADS_LIMITS: readonly string[] = [
  'The approval guard is a text filter that runs as your own user. It stops mistakes and casual prompt injection; it does not stop a model that sets out to get around it. A real boundary needs an OS sandbox, which `ads` does not ship yet.',
  'Claude Code’s transcript of the session holds each approval code in plain text.',
  '`ads` needs Claude Code: you work through it, and its hooks make approvals in the session work.',
  'GitHub is optional: `ads init --no-github` skips the GitHub steps.',
  '`ads` is in beta. Its commands and its output still change.',
];

/** The install band's line after the commands: ads init sets the claude agents when the claude CLI is on PATH, else the fake adapter (ADS internal/cli/agents.go, docs/guides/setup.md). */
export const ADS_FIRST_RUN = 'With Claude Code installed, `ads init` sets the claude agents for every role, so your first change runs with real agents. Without it, every role gets the `fake` adapter, which does no work: install Claude Code, then ask it to “use the claude agents for every role”.';

export const ADS_PREREQS = 'You need Go, git 2.38 or newer, OpenSSH and Claude Code. The GitHub CLI is optional.';

export const ADS_INSTALL: readonly TranscriptLine[] = [
  { text: `$ git clone ${ADS_REPO}.git`, role: 'prompt' },
  { text: '$ cd agentic-dev-system', role: 'prompt' },
  { text: '$ make install', role: 'prompt' },
  { text: '# then, in the repository you work on', role: 'dim' },
  { text: '$ ads init', role: 'prompt' },
  { text: '$ ads doctor', role: 'prompt' },
];

export const ADS_RECIPES: readonly { title: string; href: string }[] = [
  { title: 'Fix an issue', href: '/ads/docs/everyday-use/#fix-an-issue' },
  { title: 'Work the queue', href: '/ads/docs/everyday-use/#work-the-queue' },
  { title: 'See what waits for you', href: '/ads/docs/everyday-use/#whats-waiting' },
  { title: 'Make the rules stricter', href: '/ads/docs/everyday-use/#stricter-rules' },
];
