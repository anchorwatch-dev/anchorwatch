---
title: "Ship"
description: Conventional commits from the real diff, pull requests with a test plan, and semver releases with CHANGELOG, tag and GitHub release behind confirmation gates.
---
# Ship

Ship is four skills that make Claude's git hygiene match a careful engineer's. They use `git` and `gh`; nothing else.

## `/ship:commit [hint]`
Reads the full diff (not just the stat), splits unrelated changes into separate commits, stages files precisely, and writes Conventional Commits (`feat:`, `fix:`, `refactor:`, …) matching the repository's existing style. Refuses to commit secrets, `.env` files, large binaries or debug leftovers, and never uses `--no-verify`, `--amend` on pushed commits, or blind `git add -A`.

## `/ship:pr [base] [--draft]`
Pushes the branch (never force), reads the full diff against the base, fills your `.github/pull_request_template.md` if you have one or a good default (Summary, Changes, Test plan, Risks/rollout, linked issues), and creates the PR with `gh`. Stops if you're on the default branch. Doesn't merge, approve or request reviewers unless asked.

## `/ship:release [major|minor|patch|X.Y.Z] [--dry-run]`
Gates first: clean tree, on the default branch, up to date with origin, tests pass (it runs them). Infers the bump from commits since the last tag (breaking → major, `feat` → minor, else patch), writes a Keep‑a‑Changelog section, bumps every version file it finds (`package.json` via the package manager, `pyproject.toml`, `Cargo.toml`, `plugin.json`, `VERSION`), then shows you the exact commands and waits for a yes before commit → tag → push → `gh release create`. `--dry-run` stops before anything is written.

## `/ship:changelog [since-ref]`
Regenerates the `## [Unreleased]` section in user‑facing language from conventional commits, skipping chores and CI noise.

## Notes
The free Anchorwatch plugin warns before `gh release create`; that's expected and the release skill already asks for confirmation.
