# Corrections become code

The instruction file grew one sentence per bug and the bugs kept coming. The fix is a different loop: corrections get logged automatically, reviewed in batches, and turned into checks and tokens. Prose is the last resort, for things a script cannot measure.

## Capture

`.codex/hooks.json` registers `scripts/correction.mjs` on `UserPromptSubmit`. Every prompt that reads like a correction ("no, ...", "don't ...", "that's wrong", "use X not Y", "too tight", "missing padding", "again") is appended to `.agents/corrections.jsonl` with a timestamp and a theme (padding, spacing, contrast, size, mobile, menu, copy, colour, images, motion, facts, process). Questions and build requests are not logged. The hook never blocks and never prints.

Codex reads repository hooks after a one-time trust prompt; if the file format differs in your Codex version, `codex --help` shows the current hook schema and the script takes the prompt JSON on stdin either way. For Claude Code, the same command goes under `hooks.UserPromptSubmit` in `.claude/settings.json`. To log by hand: `node scripts/correction.mjs --add "the carousel arrows overlap the text"`.

The log is per repository and ignored by git by default. Copy it into the starter when a prospect is done, or keep one in the starter and point `--add` at it; the review step works on whatever file is there.

## Review

`npm run corrections` groups the log by theme and marks anything that has come up three times. Do this at the end of every build, not when the file feels long.

## Distil

For each recurring theme, in order of preference:

1. A check in `scripts/audit/checks.js` (visual, measurable: padding, size, contrast, overlap, clipping, tells) or `scripts/audit/copy.mjs` (text). Add the rule with a threshold, add a case to `test/fixtures/defects.html` so `npm test` proves it fires, and it is fixed for every future build.
2. A token or base rule in `src/index.css`, or a preset value in `src/directions.css`, when the fix is "this should always be X": menu item padding, touch targets, heading weight, radius. The audit then has something to assert.
3. A sentence in AGENTS.md, only for what code cannot check: facts, approvals, scope, what to ask for. Write the general rule, not the incident. "Never invent reviews" is a rule; "the testimonial slider on the landscaping site had floating controls" is a log entry.

Signs a sentence should have been code: it names a component, it names a pixel value, it describes one site, it starts with ALWAYS or NEVER in capitals, or it is the third sentence about the same thing.

## Why this beats editing the markdown

The agent's instruction budget is finite: Codex truncates AGENTS.md past 32 KiB and attention thins long before that. A check runs every time, costs nothing to read, and fails loudly with a selector and a measurement. A sentence is read once, competes with two hundred others, and fails silently.
