# ADR 002: Adopt Feature-First (Vertical Slice) Structure

Date: 2025-09-08
Status: Proposed
Context:
Current `src` layout groups code primarily by technical layer (`controllers`, `models`, `utils`, etc.). As feature count grows (color, layer, history, tools, file IO, palette, selection, etc.) navigating and reasoning about a single domain requires jumping across multiple folders. This inflates cognitive load, increases accidental coupling, and makes progressive extraction/testing harder.

Decision:
Introduce `src/features/<domain>` directories. Each domain owns its model (pure logic), services/adapters (side-effects), UI components (local presentation), and public surface (`index.ts`). Legacy folders remain temporarily; new + incrementally migrated code lands in `features/`.

Scope (Phase 1 Pilot Domains):

- color
- layer
- history (observer for undo/redo)

Principles / Rules:

1. One public surface per feature: `features/<name>/index.ts`.
2. Pure logic and data shaping live in `model.ts` (no DOM, no Tauri, no randomness outside injected deps).
3. Side-effectful code (canvas, filesystem, WASM, Tauri API, event emitters) lives in `service.ts` / `*-service.ts`.
4. Cross-feature calls go only through exported public API (no deep relative paths).
5. Shared, domain-neutral utilities promoted to `src/shared` (to be created) only after ≥2 features need them.
6. No feature may import another feature's internal (non-index) file.
7. Tests colocated: `__tests__/` inside each feature directory.

Consequences:

(+) Improves locality (open one folder to grasp a domain)
(+) Enables parallel refactors & clearer ownership
(+) Facilitates selective bundling / lazy loading later
(−) Short-term duplication risk until utilities are promoted
(−) Mixed structure during migration period may confuse newcomers (mitigated via README + ADR reference)

Migration Strategy:

1. Create `src/features/` and scaffold pilot domains (empty structure + barrel index).
2. Move color-related pure helpers from `utils/ColorUtils.ts` → `features/color/model.ts`; keep a temporary re-export in old path to avoid wide import churn.
3. Gradually relocate controllers/models for `layer` and `history` following the same pattern; delete old files once imports updated.
4. Add lint rule to forbid deep cross-feature imports; fix violations opportunistically.
5. Document pattern in main README.

Test Impact:

- Encourage writing unit tests against `model.ts` (pure logic) + thin integration tests for `service` boundaries.

Future (Phase 2):

- Introduce `shared/` directory for cross-domain primitives (events, typed ids, geometry math).
- Add an architectural metrics script to count cross-feature edges.

Status Notes:
Accepted once first pilot (color) is migrated and lint guardrails merged.

Alternatives Considered:

- Continue layer-based: rejected (scales poorly in domain discoverability)
- Heavy DDD layering (domain/application/infrastructure folders): postponed; unnecessary ceremony for current scale
- ECS-style engine core: premature w.r.t. present feature complexity
