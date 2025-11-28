Test layout and conventions
===========================

- tests live under `apps/sledge/test/<feature>/...`. Keep feature-specific cases next to their domain (e.g. history, layer, utils). Cross-cutting integration (project roundtrip) can stay at the root.
- prefer headless fakes over DOM: use small Anvil buffers (`8x8`, `16x16`) and stub `document`/`eventBus` only with the methods a test actually needs.
- reuse shared helpers: history tests already use `features/history/utils.ts`. Add new helpers per feature instead of inlining large setups in each spec.
- follow naming hints in `features/history/history_test_instruction.md` (IDs `A/B/C`, entries `entry-A/B/C`) for readability; extend the same pattern to new suites.
- when adding new suites, colocate them (e.g. `features/layer/*.test.ts`) rather than the test root, so the directory hints what is covered.

Helpers you can use
- `support/projectFixture.ts`: chainable fixture (`withCanvas`, `withLayers`, `withActiveLayer`, `withImagePool`, `withPalette`, `useLayerAnvils`, `clearHistory`) that resets stores, anvils, palette, and history in one call.
- Domain matchers in `test/setupMatchers.ts`: `toHaveLayerOrder`, `toHaveCanvasSize`, `toMatchHistoryState` for readable expectations (`expect(layerListStore.layers).toHaveLayerOrder(['A','B'])`).
- `support/HistoryActionTester.ts`: 汎用の「before/apply/undo/redo」シーケンス実行ヘルパー。apply は必須（暗黙の redo は禁止）。`registerBefore`/`registerAfter`や任意の副作用を apply にまとめ、必要なら undo/redo を差し替えて使う。
- History utilities remain available; 共有フィクスチャを各テストで明示的に呼び出し、何を初期化したかがテスト本文から読み取れるようにする。

Quick structure (current):
- `features/history`: history actions and randomised history checks.
- `features/layer`: Anvil manager integration (light smoke).
- `utils`: pure utility tests (e.g. `FileUtils`).
- root: cross-feature integration such as project dump/load roundtrip.
