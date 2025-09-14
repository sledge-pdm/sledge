# ADR 001: Monorepo Scope and Rationale

Date: 2025-09-08
Status: Proposed
Deciders: Core maintainers
Context:
Sledge currently houses the desktop app (`apps/sledge`), marketing/brand website (`apps/website`), and shared packages (`packages/*`) in a single monorepo. We need clarity on why this is kept together and the conditions under which we might split the website.

Forces:

- (+) Shared type safety & design system (`core`, `theme`, `ui`), avoiding version drift.
- (+) Single PR can evolve feature + docs/website examples synchronously.
- (+) Simplified local onboarding (one clone, one install).
- (−) Commit / PR noise: unrelated marketing edits surface in product history.
- (−) Potentially longer CI times as codebase grows.
- (−) Different release cadences (app vs website) may later justify separation.

Decision:
Keep monorepo for now. Treat `apps/website` as a _consumer_ boundary of internal packages. Introduce metrics & structural guardrails so a later decision to split can be evidence-based.

Consequences:

- Must establish and enforce allowed dependency directions (apps → packages only).
- Need tooling to measure friction (CI duration, cross-app PR ratio, release frequency).
- Avoid leaking application-internal modules directly into the website (only consume published/public surfaces).

Guardrails / Rules:

1. Dependency direction: `apps/*` may import from `packages/*` and local app code; never inverse.
2. No deep import into another app's internals.
3. Shared logic promoted only if used (or planned) by >=2 contexts (desktop app, website, future cli, etc.).
4. Architectural changes recorded as new ADRs to keep rationale explicit.

Metrics To Track (baseline now, then quarterly):

- CI total time & affected workspace ratio.
- % of PRs touching both `apps/sledge` and `apps/website`.
- Release cadence difference (#app releases : #website deployments).
- Accidental cross-boundary dependency violations (lint count).

Exit Criteria (Triggers to Reconsider Split):

- Cross-app PR ratio < 10% for 2 consecutive quarters.
- Divergent governance needs (e.g., external contributors limited to website).
- CI slowdowns attributable to unrelated app build steps.

Actions (Initial):

- Add dependency boundary lint.
- Introduce changesets for internal package version surfaces.
- Document public entrypoints for each package.

Status Notes:
Will be updated to Accepted once tooling & metrics scripts land.

---

Alternatives Considered:

- Immediate split: rejected (would increase maintenance overhead prematurely).
- Git submodules: rejected (DX complexity outweighs current benefits).
