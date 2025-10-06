# Copilot / AI Agent Project Instructions

Concise project-specific guidance so an AI can contribute productively without re-discovering architecture. Keep responses action‑oriented and follow the conventions below.

## 1. Monorepo Layout
- `apps/sledge`: Desktop app (SolidJS + Tauri) – main product.
- `apps/website`: Marketing / site (SolidJS) – do not mix app-only code here.
- `packages/anvil`: Pixel buffer + diff engine (deterministic, UI-agnostic). Only owns in‑memory layer buffers & patch logic.
- `packages/core`: Core shared types (geom, file formats, etc.).
- `packages/ui`: Reusable UI components (SolidJS) – keep stateless/low side‑effects.
- `packages/theme`: Theming + style tokens (vanilla-extract).
- `packages/wasm`: Rust → WASM helpers (e.g. memory usage, pixel ops). Imported via alias `@sledge/wasm`.
- `assets/`: Public/static assets (images, fonts). Treat font licenses carefully.

## 2. Module Resolution Aliases (see `vitest.config.ts`)
`~` → `apps/sledge/src`
`@sledge/core`, `@sledge/theme`, `@sledge/ui`, `@sledge/wasm`
Use these instead of long relative paths. New shared code: prefer putting types in `packages/core` or feature‑local `types/` first.

## 3. Feature Folder Pattern (`apps/sledge/src/features`)
Each domain = its own folder (e.g. `history/`, `layer/`, `selection/`, `image_pool/`, `tool/`, `effect/`). Inside:
- `index.ts` as public surface (re‑export minimal API).
- Action / controller separation (e.g. history: `actions/*.ts` + `controller.ts`).
- Avoid cross-feature imports; instead use event bus or high‑level store.

## 4. State & Events
- Global reactive state lives in `stores/` (e.g. `ProjectStores`, `GlobalStores`).
- Cross-feature communication: `utils/EventBus.ts` (mitt). Emit descriptive events (`webgl:requestUpdate`, `preview:requestUpdate`). When adding new events: document payload shape in `Events` type.
- History: implement new undoable behaviors via subclass of `BaseHistoryAction` (see `AnvilLayerHistoryAction`). Maintain `type` string consistency.

## 5. Rendering & Pixels
- Per-layer pixel buffers managed by Anvil (`AnvilManager` registers one `Anvil` per layer). Do NOT mutate raw `Uint8ClampedArray` directly in UI – call Anvil APIs so patches & dirty tiles update.
- WebGL integration: `webgl/WebGLRenderer.ts` pulls dirty tiles via helpers (`getDirtyTiles`, `clearDirtyTiles`) and uploads only changed regions when `onlyDirty`.
- When adding buffer mutations: ensure a patch is generated so history + preview update; then emit `webgl:requestUpdate { onlyDirty: true }`.

## 6. WASM / Performance
- WASM utilities imported from `@sledge/wasm` (e.g. `calculate_texture_memory_usage`). Prefer delegating heavy per-pixel loops to WASM or Anvil internals rather than inline JS.
- Keep tile size & dirty logic encapsulated in Anvil; do not leak tile math into UI code.

## 7. Testing
- Run tests: `pnpm test` (root) – uses `configs/test/vitest.config.ts`.
- Test discovery focuses on: `apps/sledge/test/**/*.test.(ts|tsx)` and feature-local `__tests__` inside `features/*`.
- Add new tests colocated under `__tests__` with `.test.ts` or `.unit.test.ts` naming. Avoid broad glob pollution.

## 8. Build / Dev Workflows
- App dev: `pnpm dev` (runs Tauri dev for `apps/sledge`).
- Site dev: `pnpm site:dev`.
- WASM rebuild (Rust changes): `pnpm wasm:build` OR per-package `packages/anvil` script `wasm:build` (for ops under `src/ops_wasm`).
- Formatting: `pnpm format` (Prettier + Rust `cargo fmt`).
- CSS lint: `pnpm lint:css`.

## 9. History System Guidelines
- Limit size via `globalConfig.editor.maxHistoryItemsCount` (auto-shift oldest).
- Avoid pushing redundant actions: aggregate within engine (e.g. stroke diff accumulation) before calling `addAction`.
- On undo/redo of pixel data: ensure WebGL + preview update events are emitted (see `AnvilLayerHistoryAction`). Follow that pattern.

## 10. Adding a New Pixel Tool (Example Flow)
1. Create folder `features/tool/<newTool>/`.
2. Implement interaction logic (pointer events) → translate to pixel ops via Anvil API.
3. Accumulate diffs; on stroke end flush patch → `projectHistoryController.addAction(new AnvilLayerHistoryAction(layerId, patch))`.
4. Emit `webgl:requestUpdate` (onlyDirty) and `preview:requestUpdate`.
5. Add focused test for diff generation + history integration.

## 11. Import / Export
- Project serialization uses msgpack (`msgpackr`). Keep layer pixel buffers as raw RGBA8; avoid embedding renderer-only state.
- When extending project metadata, prefer plain data objects – no class instances.

## 12. Style / Theming
- Use vanilla-extract tokens from `packages/theme`. Avoid hard-coded colors in feature logic.
- UI components that are generic should live in `packages/ui`; app-specific composition stays under `components/`.

## 13. PR / Code Hygiene Expectations
- Prefer small, incremental patches per feature.
- Do not introduce new global singletons; extend existing managers or pass dependencies explicitly.
- Respect existing naming: `*Manager`, `*Controller` for coordination, `*HistoryAction` for undo units.

## 14. When Unsure
Provide: (a) intent, (b) candidate file list, (c) proposed public API change. Keep changes minimal and reversible.

---
This file reflects observable patterns; avoid aspirational redesign here. Ask if adding cross-cutting concerns (selection model, multi-layer diff coordinator, etc.).
