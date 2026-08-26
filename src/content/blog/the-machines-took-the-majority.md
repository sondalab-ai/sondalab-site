---
title: The machines took the majority
date: 2026-08-21
summary: Cloudflare's June figures put bots at 57.5% of HTML traffic. For the first time the web is majority machine, and most of those machines are reading, not indexing.
---

There was a threshold nobody scheduled a press release for. According to
Cloudflare data from June 2026, **bots now account for 57.5% of HTML traffic**
against 42.5% from humans — [the first time machines have held the
majority](https://www.theregister.com/2026/02/04/ai_bot_traffic_web_browsers/).

The composition matters more than the headline. Googlebot still leads at
around 38.7% of that bot traffic, but the next four names are the interesting
ones: GPTBot, Meta-ExternalAgent, ClaudeBot, Bingbot. The web's largest
readership is now software that does not render a page, does not see an ad,
and does not come back.

## Two kinds of crawler, two kinds of deal

The old bargain was legible: a crawler took your text and sent you visitors.
It was never a *fair* bargain, but it was a bargain — you could measure both
sides of it.

What replaced it splits in two. **Training crawls** take the text once and
return nothing, ever; Cloudflare attributed 51.8% of AI crawler requests to
training in May 2026. **Retrieval crawls** take the text at query time and
return an answer that quotes you to someone who will never arrive. Both are
extraction. Only one of them used to be called that.

Meanwhile human visits have been sliding — down around 5% between Q3 and Q4
2025 on Cloudflare's numbers.

## What an operator does about it

Nothing clever, mostly. The technical options are all blunt:

- **`robots.txt`** works exactly as well as the crawler's operator wants it to.
- **Blocking by user agent** works until the agent stops declaring itself.
- **Paywalls and per-crawl pricing** work, and cost you the readers you have.

The honest framing is not "how do I stop this" but "what is my content *for*."
If the answer was always traffic, the machine majority has already repriced
you. If the answer is that the writing is the artefact and being read by a
model is simply another way of being read, then the number is just weather.

The uncomfortable part is that nobody gets to choose which of those they are.
The crawlers decided.
