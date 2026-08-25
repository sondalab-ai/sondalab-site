/**
 * Interstitial prose: the "transmission" bands between sections. Each block has
 * a mono marker, a colour variant, and a POOL of lines; the client picks one at
 * random per page load (SSR renders a default for no-JS). Copy lives here so it
 * stays editable without touching markup. `lead` sets the scene; `punch` lands
 * the point. Honest throughline: see it · steer it · own it; never "all local".
 */
export type Line = { lead: string; punch: string };

export type InterludeBlock = {
  id: string;
  variant: 'canvas' | 'invert';
  marker: string;
  lines: Line[];
};

const signal: Line[] = [
  {
    lead: 'Somewhere a datacenter is quietly deciding things about you.',
    punch:
      'Here, whatever does the deciding runs on your terms, in the open, where you can watch it work and pull the plug.',
  },
  {
    lead: 'The machines are already making calls on your behalf.',
    punch: "The only question that ever mattered is whose hand is on the switch.",
  },
  {
    lead: 'Most software asks you to trust a black box across the wire.',
    punch: "We'd rather hand you the lid and a flashlight.",
  },
  {
    lead: 'An agent is running right now, somewhere, for someone.',
    punch: 'The difference is whether you can see what it is doing.',
  },
  {
    lead: 'Autonomy sounds great until nobody is holding the reins.',
    punch: "Assistance, never autopilot: you stay in the loop, or it doesn't run.",
  },
  {
    lead: "They call it magic when they don't want you to look inside.",
    punch: 'We call it a system, and we leave the panel open.',
  },
  {
    lead: 'Every model has an off-switch. Few of them are within your reach.',
    punch: 'Ours are always where you left them.',
  },
  {
    lead: 'The future ships agents by the thousand.',
    punch: "It will still come down to who they answer to.",
  },
  {
    lead: 'You can hand a machine the work without handing it the wheel.',
    punch: 'Direct it, correct it, take the controls back, any moment you like.',
  },
  {
    lead: 'Somewhere your words are quietly becoming someone else training set.',
    punch: 'Here, your data answers to you: kept where you keep it, used how you say.',
  },
  {
    lead: 'A good tool is legible: you can tell what it is doing, and why.',
    punch: "A black box is just someone else's decision, wearing your login.",
  },
  {
    lead: 'The agent does not need to be trusted. It needs to be watched.',
    punch: 'So we built the window before we built the wall.',
  },
  {
    lead: 'Command is not a feature you toggle on.',
    punch: 'It is the whole point: see it, steer it, own it.',
  },
  {
    lead: "Soon the agents won't just write code. They'll move things in the world.",
    punch: 'Whatever they touch, the operator stays in charge.',
  },
  {
    lead: "There's a version of this where you're a passenger.",
    punch: 'This is not it.',
  },
  {
    lead: 'The cloud is convenient right up until you want to say no.',
    punch: "Run it where you are, and 'no' is always an option.",
  },
  {
    lead: 'Every session spins up more capability than you asked for.',
    punch: 'We hand you the loadout: only the tools the job needs, nothing else armed.',
  },
  {
    lead: 'The interesting question is not what the machine can do.',
    punch: 'It is whether you can still tell it to stop.',
  },
  {
    lead: 'Most dashboards show you the output. Few show you the reasoning.',
    punch: 'We tail the whole thing, live: spawns, tool calls, the current thought.',
  },
  {
    lead: 'Capability is cheap now. Legibility is the hard part.',
    punch: 'So we spend our effort keeping the machine readable to you.',
  },
];

const afterHours: Line[] = [
  {
    lead: 'Tonight the agents keep working while you sleep.',
    punch:
      'Come morning, every log is still yours to read, and the switch is still where you left it.',
  },
  {
    lead: 'The night shift never clocks out anymore.',
    punch: 'But it still files its work under your name, traceable line by line.',
  },
  {
    lead: 'While the office is dark, the sessions run on.',
    punch: "You'll wake to a diff you can read, not a decision you have to trust.",
  },
  {
    lead: 'Somewhere an agent is three steps into a task you set hours ago.',
    punch: 'Every step of it recorded, replayable, yours.',
  },
  {
    lead: 'Work happens now whether you are at the keyboard or not.',
    punch: 'What does not change is who it answers to in the morning.',
  },
  {
    lead: "By dawn there'll be commits you didn't type.",
    punch: 'Each one tracing back to a spec you did write.',
  },
  {
    lead: 'The machine does not sleep. That is the point, and the risk.',
    punch: 'So it leaves a trail you can walk back, start to finish.',
  },
  {
    lead: 'Leave it running overnight if you like.',
    punch: 'Nothing it does is hidden from you when you return.',
  },
  {
    lead: 'Tomorrow you will review work that ran without you.',
    punch: 'Not blind trust, but a replay you can scrub through, step by step.',
  },
  {
    lead: 'The agents work the graveyard shift.',
    punch: 'Every spawn, every tool call, every file touched: on the record.',
  },
  {
    lead: 'You handed off the task, not the accountability.',
    punch: 'Come back and the whole run is laid out, legible, undoable.',
  },
  {
    lead: 'Somewhere your session is still thinking.',
    punch: 'You can watch it live, or read it later; either way it is an open book.',
  },
  {
    lead: 'The lights are off and the work continues.',
    punch: 'But the off-switch stayed on your side of the wire.',
  },
  {
    lead: 'Sleep is not downtime anymore.',
    punch: 'It is just the hours your agents log for you to audit at breakfast.',
  },
  {
    lead: 'When you are away, the machine holds the pace.',
    punch: 'When you are back, it hands the pace to you.',
  },
  {
    lead: 'It will run all night if you let it.',
    punch: 'And it will show you exactly what it did: no gaps, no black boxes.',
  },
  {
    lead: 'The work carried on without supervision.',
    punch: 'It did not carry on without a record.',
  },
  {
    lead: 'Overnight, the agent made a hundred small decisions.',
    punch: 'You can inspect every one of them before you accept a single line.',
  },
  {
    lead: 'Morning: the branch is ahead of where you left it.',
    punch: 'And each step is traceable to the plan you approved.',
  },
  {
    lead: 'The machine kept your seat warm and your work moving.',
    punch: 'You can still take the seat back, exactly as it was.',
  },
];

export const INTERLUDES: Record<string, InterludeBlock> = {
  signal: { id: 'signal', variant: 'canvas', marker: '// signal', lines: signal },
  'after-hours': {
    id: 'after-hours',
    variant: 'invert',
    marker: '// after hours',
    lines: afterHours,
  },
};
