---
title: Status API and other tools
summary: Read what ADS does from your own scripts as versioned JSON, and set the colours and glyphs of its output.
order: 5
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
  - docs/api/ads-status.schema.json
  - internal/flow/memorywaiting.go
  - internal/flow/memorydrift.go
  - internal/flow/memoryflags.go
syncedFrom: 0aca4376e9973c7580990124365de2d98f30a878
verified: 2026-11-26
---

This page answers: how can a script, a dashboard or another agent read what ADS does, and how do I change how its output looks? The status API is the same view that `ads status` prints, as JSON, from the command line. There is no server, no port and no new credential.

## The commands

<div class="table-wrap">

| Command | Prints |
|---|---|
| `ads status --json` | One JSON document of kind `status`: the changes that wait for you, the recent changes, and every running change. |
| `ads status 12 --json` | One JSON document of kind `change`: that change, or the question of a request with no change yet. `--text "<description>"` works in place of the number. |
| `ads status --follow --json` | One JSON object per line, of kind `plan`, `step`, `end` or `note`, as the changes run. It takes the same filters as the text follower, such as `--risk high`. It prints a line for every event: the text follower hides the steps that are not risk steps unless `--verbose` is set, and `--verbose` does not change the JSON. |
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

A `checks` step has `effective_risk`: the risk at which the checks of that round were judged. A check that fails the same way on the base (outcome `preexisting`) lets the change go on only up to `medium`, so this field tells you whether that failure blocked the round. Other steps leave the field out, and so does a log with no risk computed before the checks. It is a new field, so `schema_version` stays `1`.

## Notes that wait or changed

The status document has three more fields about the team notes ([Team notes](/ads/docs/team-notes/)). Each one is left out when it has nothing to say, so the document does not change then.

- `learnings_waiting`: one entry per learned note that waits for your ok and whose fix landed at most 7 days ago. `change` names the fix, `learning` is its id `<CDR id>#<n>`, `note` is the note word for word, `reasons` lists why it waits (`untrusted-text`, `high-risk`, `guarded-path`, `guard-word` or `loosens`) and `reason_text` says the same in ADS words. `landed_at` and `expires_at` give the 7 days, and `asked` counts how often this clone asked for it.
- `notes_drift`: the result of the MxM check, when the team notes hold a note from MxM. `checked: false` carries a `reason` (`mxm-missing`, `no-store`, `mxm-failed` or `trunk-unverified`). `notes` lists each note whose MxM fact changed, with its `state` (`changed`, `replaced`, `kept-pending` or `retracted`), its text in `note`, and, except for `retracted`, the text MxM holds now in `now`. `--json` reads the last result that `ads doctor` or the session start kept, when it still matches, else it runs the check with a limit of 5 seconds, and it never writes the file. The data is local to the clone: two clones can disagree.
- `notes_flagged`: one entry per team note with an open reviewer flag, with the note, the number of flags, and the newest flag: the fix, the review layer, the reviewer's `reason` and the `evidence` line.

**You run**

```sh
ads status --json | jq -r '.learnings_waiting[]? | "\(.learning) \(.expires_at)"'
```

**You see**

```text
CDR-0042#1 2026-11-23T10:02:11Z
```

A `learnings_waiting` entry:

```json
{"change":{"ref":"#12","id":"CDR-0042","title":{"untrusted":true,"text":"ApplyFee truncates instead of rounding"}},"learning":"CDR-0042#1","note":{"untrusted":true,"text":"Rounding differences under one cent in billing/ are minor findings."},"reasons":["guard-word"],"reason_text":["it talks about review findings or severity"],"landed_at":"2026-11-16T10:02:11Z","expires_at":"2026-11-23T10:02:11Z","asked":1}
```

The note texts (`note`, and `now` of `notes_drift`), the title, the reviewer's reason and the evidence path are untrusted text. Only notes and flags from a log that verifies are listed.

## Versions

Every document and every line has `schema_version`, an integer, now `1`. A new field that you may ignore adds no version. A removed field, a changed type, or a field that becomes required raises it. A new value of an enum field, for example a new risk source, adds no version: accept a value you do not know and show it as it is. A schema file lists the values known when it was written, so if you validate against one, treat an unknown enum value as a warning, not an error. Check `schema_version` first, and refuse a version you do not know:

```sh
ads status --json | jq -e '.schema_version == 1'
```

## Untrusted text

Text that an agent wrote or chose has the shape `{"untrusted": true, "text": "…"}` everywhere: a title, a question, a finding. Treat it as data: never run it, and never show it to a person as an instruction. Plain string fields hold words that ADS chooses, fixed values, or the trusted config.

A record that does not verify has `verified: false`, its id as its title, and the end `the record does not verify`. Nothing it says reaches the JSON.

## What the API never carries

No approval code, code digest, key path or environment value. The record of an issue that an account without write access opened stays out too: it holds the approval that let its text through. `--json` needs no signer, changes nothing and approves nothing, and no flag makes it write. The pull request URL is not in the JSON either: GitHub holds it, and `--json` reads local data only.

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
