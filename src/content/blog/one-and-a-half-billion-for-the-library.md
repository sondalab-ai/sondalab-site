---
title: One and a half billion for the library
date: 2026-05-29
summary: A court called AI training fair use and Anthropic still paid a record settlement. The distinction it turned on is the one every lab should have been watching.
---

The copyright question is not being settled by one landmark case. It is being
settled by a dozen partial ones, and the shape is finally visible.

Start with the number everyone quotes and almost nobody reads correctly.
Anthropic settled *Bartz v. Anthropic* for **$1.5 billion** — the largest
copyright settlement on record, approved by the Northern District of
California, working out to roughly **$3,000 per book across more than 400,000
titles**.

## The split that actually happened

Judge William Alsup did not rule that training was infringement. [He ruled the
opposite](https://authorsguild.org/advocacy/artificial-intelligence/what-authors-need-to-know-about-the-anthropic-settlement/):
training on books that were **lawfully acquired** was fair use, and
"quintessentially transformative" at that.

What was not fair use was how the corpus was obtained and kept. Anthropic had
downloaded millions of copyrighted books from pirate sites to assemble a
permanent general-purpose library. In Alsup's words, it "had no entitlement to
use pirated copies for a central library. Creating a permanent, general-purpose
library was not itself a fair use."

So the billion and a half was not the price of training. **It was the price of
the shelf.** Acquisition and retention are the exposed surface; the gradient
update was fine.

## Three separate questions, three different answers

The discourse collapses these constantly. The courts do not.

**Is training on protected work fair use?** Increasingly yes, where the copies
were legitimately obtained — and unresolved where the use substitutes for the
original. In *Thomson Reuters v. Ross Intelligence* the court granted partial
summary judgment for Thomson Reuters in **February 2025** on the question of
copying; the appeal, still pending, covers both whether the headnotes are
copyrightable at all and whether the use was fair.

**Can the output infringe?** Yes, and this is the dangerous one for anybody
deploying. Courts have held that generated outputs may infringe where they are
**substantially similar** to protected works — putting liability on generation,
not just training, and therefore potentially on the user.

**Can machine output be owned?** No. The Supreme Court **denied certiorari in
*Thaler v. Perlmutter* on 2 March 2026**, leaving human authorship intact as a
requirement of US copyright. Your prompt does not make you an author.

## Europe has no fair use to weigh

On **31 July 2026** the Munich Regional Court I decided [*GEMA v.
Suno*](https://www.twobirds.com/en/insights/2026/germany/munich-district-court-rules-on-ai-generated-music-gema-v-suno)
(42 O 763/25), the first European ruling on a generative music tool. It
prohibited four separate acts across six compositions: reproduction for
training in the US, reproduction through **memorisation in the model** on
German servers, communication to the public by offering the model, and
reproduction through the outputs.

Read that second one twice. The court held that a work memorised in weights
sitting on a German server is an infringing reproduction — the model itself as
a copy. It took jurisdiction over the US training acts through a venue rule for
collecting societies, applied US law to them, and **rejected fair use**.

## What this means if you ship things

- **Provenance of the corpus is the liability**, not the training run. Where
  your data came from is a discoverable fact.
- **Output you generate is not yours** in the copyright sense. If ownership
  matters, a human has to make it.
- **Substantial similarity is your problem**, not your vendor's.
- **Indemnities are worth what the cap says.** Read the carve-outs first.

The training question is closer to settled than the headlines suggest. The
provenance question just got very expensive.
