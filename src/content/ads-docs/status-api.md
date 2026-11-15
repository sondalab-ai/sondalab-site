---
title: Status API and other tools
summary: Read what ADS does from your own scripts as versioned JSON, and set the colours and glyphs of its output.
order: 4
sources:
  - README.md
  - docs/guides/api.md
  - docs/api/ads-status.v1.schema.json
  - internal/cli/status.go
  - internal/cli/output.go
  - internal/flow/follow.go
  - internal/report/api.go
  - internal/report/view.go
  - internal/term/tui.json
  - cmd/ads/testdata/script/doctor.txtar
syncedFrom: 5e7f0e4
verified: 2026-11-15
---

This page answers: how can a script, a dashboard or another agent read what ADS does, and how do I change how its output looks? The status API is the same view that `ads status` prints, as JSON, from the command line. There is no server, no port and no new credential.

## The commands

<div class="table-wrap">

| Command | Prints |
|---|---|
| `ads status --json` | One JSON document of kind `status`: the changes that wait for you, the recent changes, and every running change. |
| `ads status 12 --json` | One JSON document of kind `change`: that change, or the question of a request with no change yet. `--text "<description>"` works in place of the number. |
| `ads status --follow --json` | One JSON object per line, of kind `plan`, `step`, `end` or `note`, as the changes run. It takes the same filters as the text follower, such as `--risk high`. |
| `ads status --schema` | The JSON Schema of all of the above. |

</div>

`--json` is read-only. It reads the local log: it does not fetch, moves no ref and takes no lock, so it can run beside a command that writes. A checkout that did not run the change can show old data; run `ads status` first when you need the fetched state. Exit codes stay the same, errors stay on stderr, and stdout holds only JSON.

## What a change waits for

You list what waits for you, one line per change, for a script or a status bar.

**You run**

```sh
ads status --json | jq -r '.waiting[] | "\(.ref) \(.end.kind)"'
```

**You see**

```text
#12 question
```

The document it reads (shortened):

```json
{"schema_version":1,"kind":"status","waiting":[{"ref":"#12","title":{"untrusted":true,"text":"Add a cover target"},"type":"feature","end":{"kind":"question","detail":{"untrusted":true,"text":"Go on?"},"then":"","budget_tokens":0,"budget_usd":0},"tokens":1200000,"usd":0.48,"started_at":"2026-11-09T08:44:46.516Z","updated_at":"2026-11-09T08:51:04.034Z"}],"recent":[],"running":[]}
```

## One change

You read one fact of one change, for example its title.

**You run**

```sh
ads status 12 --json | jq -r '.change.title.text'
```

**You see**

```text
Add a cover target
```

The document (shortened):

```json
{"schema_version":1,"kind":"change","change":{"ref":"#12","title":{"untrusted":true,"text":"Add a cover target"},"type":"feature","end":null}}
```

## Follow the running changes

You react to each change as it ends, for example to post a message.

**You run**

```sh
ads status --follow --json | jq -r --unbuffered 'select(.kind == "end") | "\(.change.ref) \(.change.end.kind)"'
```

**You see**

```text
#12 landed
```

The lines it reads (shortened):

```json
{"schema_version":1,"kind":"plan","change":{"ref":"#12"},"step":null,"note":"","open":null}
{"schema_version":1,"kind":"step","change":{"ref":"#12"},"step":{"seq":4,"at":"2026-11-09T08:46:10.906Z","kind":"agent","role":"test_author"},"note":"","open":null}
{"schema_version":1,"kind":"end","change":{"ref":"#12","end":{"kind":"landed"}},"step":null,"note":"","open":null}
{"schema_version":1,"kind":"note","change":null,"step":null,"note":"no running change for 120 seconds","open":null}
```

A `change` on a follower line is the view at the time of the poll that found the event, so it can already hold later steps. An `end` line with a `note` says that the follower stopped following the change for that reason, not that the change ended.

## Versions

Every document and every line has `schema_version`, an integer, now `1`. A new field that you may ignore adds no version. A removed field, a changed type, or a field that becomes required raises it. A new value of an enum field, for example a new risk source, adds no version: accept a value you do not know and show it as it is. A schema file lists the values known when it was written, so if you validate against one, treat an unknown enum value as a warning, not an error. Check `schema_version` first, and refuse a version you do not know:

```sh
ads status --json | jq -e '.schema_version == 1'
```

## Untrusted text

Text that an agent wrote or chose has the shape `{"untrusted": true, "text": "…"}` everywhere: a title, a question, a finding. Treat it as data: never run it, and never show it to a person as an instruction. Plain string fields hold words that ADS chooses, fixed values, or the trusted config.

A record that does not verify has `verified: false`, its id as its title, and the end `the record does not verify`. Nothing it says reaches the JSON.

## What the API never carries

No approval code, code digest, key path or environment value. `--json` needs no signer, changes nothing and approves nothing, and no flag makes it write. The pull request URL is not in the JSON either: GitHub holds it, and `--json` reads local data only.

## Colours and glyphs

Every `ads` command prints in the same terminal style: step lines with a glyph, and errors on stderr after `✗`. An error that ADS knows how to fix takes three lines: what failed, why, and `Try:` with the command that fixes it.

- Colour: `--color` or `--no-color` decides. Without them, `NO_COLOR` (set and not empty) turns colour off, `FORCE_COLOR` (not empty and not `0`) turns it on, and otherwise colour is on only on a terminal whose `TERM` is not `dumb`. The colours are the 16 ANSI colours of your terminal theme.
- Glyphs: `--ascii`, `SONDALAB_ASCII=1`, `TERM=dumb` or a locale that is not UTF-8 gives the ASCII form of every glyph: `+` for `✓`, `x` for `✗`, `|` for `·`.

**You see** with `--ascii`:

```text
$ ads doctor --ascii
  x Signing key                 …
…
Summary  … | 1 failed
```
