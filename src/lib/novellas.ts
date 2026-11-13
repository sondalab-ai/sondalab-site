/**
 * Per-product "operator's log": a serial cyberpunk novella, one chapter per
 * tool, tied by a fil rouge. One operator, one long night (≈2am → dawn along product
 * order), a recurring antagonist ("the service", the remote cloud that wants
 * the work back) and a recurring refrain ("the switch is yours"). Keyed by
 * product id; each value is the chapter's paragraphs. The chapter number comes
 * from the product's `order` at render time.
 */
export const NOVELLAS: Record<string, string[]> = {
  spexr: [
    "It's 2 a.m. and you open the spec before you open the editor. That's the ritual: name what you want in plain words, let the session read it back, watch the plan appear. The agents take the work from there (plan, tasks, a diff, a pull request) while you keep one hand near the wheel and the drift detector keeps the other honest.",
    "Somewhere across the wire, the service would love to do all of this for you, out of sight, and hand you a result to sign off on faith. Not tonight. Tonight every change traces back to a line you wrote, and the whole floor, every session, every profile, glows on one dark wall where you can see it breathe.",
    "The night is young. The switch is yours.",
  ],
  introspect: [
    "3 a.m. The work is moving without you now, and that's exactly when you want to look closest. So you open the window, not to touch anything, just to watch: the graph of spawns and tool calls unspooling live, the reasoning ticking past, every file the machine reads and writes named on the record.",
    "The service prefers you blind. A black box is easier to trust and impossible to argue with. You've never trusted a thing you couldn't read. Here nothing is hidden and nothing is altered; the observatory only observes, and when you leave, you leave with an export, secrets already redacted.",
    "You close the lid. It kept breathing. So did you.",
  ],
  'claude-loadout': [
    "4 a.m., and the next job is small, surgical. It doesn't need the whole armoury: the twenty servers, the plugins, the skills you've hoarded for a year. So before you spawn the session you strip it down: a local model reads the room, ranks what the task actually wants, and arms only that. Everything else stays installed, just holstered.",
    "The service would have you run hot and heavy, every capability lit, the better to reach for something you never asked for. You'd rather the machine hold exactly what the job needs and nothing it might misfire. Lean session, clear head.",
    "Dawn's still hours off. The switch is where you left it.",
  ],
  daos: [
    "5 a.m., and the question that won't let you sleep: did it do the same thing twice? Not ‘probably’. Proven. You run it through the bench (the same input, the cache, the signature) and the answer comes back identical and signed, the key in your keeping the only thing that makes it true. Anything unsigned, the runtime simply refuses.",
    "The service asks for trust. You've learned to ask for a receipt. Determinism you can measure beats a promise you can't, every hour of every shift.",
    "The sky isn't grey yet. Close. The switch, still yours.",
  ],
  'local-agents': [
    "6 a.m. Back home, the house has been working while the city slept. On the silicon under your desk a small crew has kept its posts (a coder, a writer, a hand for the household), the router sending each request to the right one, none of them reaching past the front door.",
    "The service wanted them in its datacenter, learning from everything they touched. Instead they answer to you, on your GPU, on your network, and what they learn stays in the house. It's the quietest kind of ownership: the machine that never leaves.",
    "The window's going pale. Almost.",
  ],
  skillkit: [
    "7 a.m., and it's the small things that carry a shift: the skills you keep on the shelf, each a plain capability the agent can run on command. You pick the ones tonight needs, install them clean, and when they've served their turn they come off just as cleanly, your recorded work untouched.",
    "The service would rather sell you a suite you can't take apart. You'd rather own a toolbox: add, remove, know exactly what's in your hand.",
    "The sun's up. The machines worked all night, and every log is still yours to read. One thing left before you go.",
  ],
  mxm: [
    "8 a.m. The shift is over, and the worst thing the night could do now is vanish. Tomorrow's session would wake up blank, walk into tonight's dead ends, ask tonight's questions. So before you log off, the night gets written down: every exchange kept in one file on your own disk, distilled into a handful of facts, each checked against what was actually said.",
    "The service would gladly remember for you, in a vault you'll never open, and decide what you're allowed to recall. Here the memory speaks only when it has something that stands out, and you can open it, read it, move it, delete it. Nothing it knows is out of your sight.",
    "Tomorrow night starts where this one ended. The switch is yours. End of shift.",
  ],
};

/** The night in chapter order: one tool per hour, 2am to the end of the shift. */
export const NIGHT: { id: string; hour: string }[] = [
  { id: 'spexr', hour: '02:00' },
  { id: 'introspect', hour: '03:00' },
  { id: 'claude-loadout', hour: '04:00' },
  { id: 'daos', hour: '05:00' },
  { id: 'local-agents', hour: '06:00' },
  { id: 'skillkit', hour: '07:00' },
  { id: 'mxm', hour: '08:00' },
];
