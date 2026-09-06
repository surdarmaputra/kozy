---
name: build-loop
description: Run the kozy guardrail ladder to green. Use when finishing a change, before committing, before pushing to a PR, or when asked to verify, check, or make sure it passes. Runs G1 harness compliance then npm run verify, retrying each gate up to 3x.
---

# Build Loop

Gates run in sequence. Each retries max 3x. Hard stop on new user input mid-loop.

## G1 — Harness compliance (read, no command)

1. `git diff --name-only` (staged + unstaged, plus untracked)
2. Map each path via the table in `AGENTS.md` § Harness refs
3. Load **only** those sections of `docs/harness/*.md`
4. Check every changed file against them

Auto-fail: `any` · relative import past one level · new `src/lib/*.ts` with no
test · a colour outside `src/styles.css` · hand-edited `src/routeTree.gen.ts` ·
a renamed Sheet column or status value · a catalogue route missing
`sheetCacheHeaders` · `sheet.ts` imported from a component.

On fail: list violations with file+line → fix all → re-run G1 from scratch.
Doubt = fail.

## G2..G7 — one command

```bash
npm run verify
```

check → lint → typecheck → test → build → route-tree drift, in that order,
stopping at the first failure. Same steps as CI.

| Gate | Fix rule |
|---|---|
| check | format the file; never widen `.prettierignore` to pass |
| lint | fix the code; never add a blanket disable |
| typecheck | fix types; `any` is never the escape |
| test | fix code, not tests, unless the test encodes the wrong rule |
| build | imports / exports / config only, no logic changes |
| route tree | commit what the build regenerated; never hand-edit |

Never disable, skip, or narrow a gate to get green.

## After green

Manual checks when the change touched them (see `docs/harness/testing.md`
§ #manual): snapshot fallback, `/purge` output, cache headers, no snapshot
strings in the client bundle, both themes at 390px and 1440px.

Then hand off to `conventional-commit` for the commit and PR sync.
