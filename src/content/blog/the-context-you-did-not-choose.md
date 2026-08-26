---
title: The context you didn't choose
date: 2026-08-12
summary: Most bad agent output is not a model failure. It is a context failure, and context is the one part of the stack you fully control.
---

When a run goes wrong the instinct is to blame the model, then the prompt, then
the temperature. The actual culprit is usually further upstream: the model was
answering honestly about a context nobody deliberately assembled.

Context arrives from everywhere. A project file loaded because it matched a
glob. Six skills injected because their descriptions were vaguely on-topic. A
prior turn that survived compaction while the turn that explained it did not.
Tool definitions for capabilities this task will never use. None of it was
chosen. All of it is being reasoned over.

## Budget it like memory

Treat the window as an allocation, not a bucket. Three habits do most of the
work:

- **Load late.** Anything the task might not need should arrive when it is
  needed, not at session start. A description in an index is cheap; the file
  behind it is not.
- **Name the residents.** If you cannot list what is currently in the window and
  say why each piece is there, you are not scoping — you are hoping.
- **Prefer the smaller true thing.** A twenty-line excerpt with a path beats the
  whole file, because the excerpt is checkable and the file is skimmed.

## The compaction trap

Long sessions summarise themselves to survive. That summary is written by the
model, about its own reasoning, with no obligation to preserve the constraint
you stated forty turns ago. Anything that must hold for the whole session
belongs somewhere durable — a file on disk, re-read — not in conversational
scrollback that a compaction pass is free to discard.

Context is the cheapest lever in the stack and the least examined. Pull it
before you touch anything else.
