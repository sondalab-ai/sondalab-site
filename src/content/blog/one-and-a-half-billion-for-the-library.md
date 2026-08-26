---
title: One and a half billion for the library
date: 2026-05-29
summary: The largest copyright settlement in US history, a German court ruling against a music generator, and a Supreme Court that will not budge on human authorship.
---

The copyright question is not being settled by one landmark case. It is being
settled by a dozen partial ones, and the shape is now visible.

**Anthropic settled with the Authors Guild and named authors for $1.5 billion**
— the largest copyright-related settlement in US history — covering past use of
unauthorised text in training. Whatever the legal theory, the commercial
message is unambiguous: *acquiring the corpus is a line item now, not an
externality.*

## Three separate questions, three different answers

The discourse collapses these constantly. The courts do not.

**Is training on protected work fair use?** Unresolved, and trending against
the labs where the use substitutes for the original. In *Thomson Reuters v.
Ross*, the court granted summary judgment for Thomson Reuters, finding the
headnotes protected and their use to train a legal research tool **not fair
use**. It is on appeal to the Third Circuit.

**Can the output infringe?** Yes, and this is the more dangerous one for
anybody deploying. In March a court held that generated outputs may infringe
where they are **substantially similar** to protected works — which puts
liability on the generation, not just the training, and therefore potentially
on the user.

**Can machine output be owned?** No. The Supreme Court **denied certiorari on 2
March 2026**, leaving human authorship intact as a requirement of US copyright.
Your prompt does not make you an author of what came back.

## Europe is moving faster and harder

On **31 July 2026** the Munich Regional Court I ruled for GEMA against Suno:
prohibiting use of six compositions in both training and outputs, ordering
disclosure of the scale of use, and finding Suno liable for damages. European
courts have no fair-use doctrine to weigh, and it shows.

## What this means if you ship things

- **Output you generate is not yours** in the copyright sense. If ownership
  matters — a logo, a product name, a character — a human has to make it.
- **Substantial similarity is your problem**, not your vendor's. Check outputs
  against the obvious originals in your domain.
- **Indemnities are worth exactly what they say.** Read the cap and the
  carve-outs before you rely on one.

The training question will take years. The output question is live now, and it
lands on whoever pressed generate.
