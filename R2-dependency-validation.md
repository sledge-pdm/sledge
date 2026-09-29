# R2 dependency validation

Verified by Codex on 2026-09-29. R0 means the resolved version in the 2026-09-28 audit; R2 means that audit's candidate version. R1 is not used. Versions below are lockfile versions, not manifest lower bounds. Only direct dependencies are listed.

## Updates retained at R0

| Package | Retained R0 | R2 candidate | Reason |
|---|---|---|---|
| `@tauri-apps/api` | 2.11.1 | 2.12.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@tauri-apps/cli` | 2.11.4 | 2.12.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@tauri-apps/plugin-clipboard-manager` | 2.3.2 | 2.4.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@tauri-apps/plugin-dialog` | 2.7.2 | 2.8.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@tauri-apps/plugin-fs` | 2.5.1 | 2.6.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@tauri-apps/plugin-log` | 2.9.0 | 2.10.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@tauri-apps/plugin-opener` | 2.5.4 | 2.6.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@tauri-apps/plugin-os` | 2.3.2 | 2.4.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@tauri-apps/plugin-process` | 2.3.1 | 2.4.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@tauri-apps/plugin-shell` | 2.3.5 | 2.4.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@tauri-apps/plugin-updater` | 2.10.1 | 2.13.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `@vitest/browser` | 4.1.10 | 5.0.2 | Vitest 5 is outside Storybook addon-vitest 10.6.0 peer support; retain the shared Vitest 4 family. |
| `@vitest/browser-playwright` | 4.1.10 | 5.0.2 | Vitest 5 is outside Storybook addon-vitest 10.6.0 peer support; retain the shared Vitest 4 family. |
| `typescript` | 6.0.3 | 7.0.2 | TypeScript 7 removes createLanguageService used by prettier-plugin-organize-imports 4.3.0, silently disabling import organization. |
| `vitest` | 4.1.10 | 5.0.2 | Vitest 5 is outside Storybook addon-vitest 10.6.0 peer support; retain the shared Vitest 4 family. Vitest 5 also removes the bench API used by existing benchmarks. |

### Rust crates

| Crate | Retained R0 | R2 candidate | Reason |
|---|---|---|---|
| `tauri` | 2.11.5 | 2.12.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-build` | 2.6.3 | 2.7.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-plugin-clipboard-manager` | 2.3.2 | 2.4.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-plugin-dialog` | 2.7.0 | 2.8.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-plugin-fs` | 2.5.0 | 2.6.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-plugin-log` | 2.9.1 | 2.10.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-plugin-mcp-bridge` | 0.11.0 | 0.13.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-plugin-opener` | 2.5.3 | 2.6.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-plugin-os` | 2.3.2 | 2.4.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-plugin-process` | 2.3.1 | 2.4.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-plugin-shell` | 2.3.5 | 2.4.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |
| `tauri-plugin-updater` | 2.10.1 | 2.13.0 | Kept with the Tauri family: the R2 Windows debug build fails because MCP bridge screenshot code mixes incompatible WebView2/Windows types (E0277/E0308). |

The coordinated Tauri update was GO in the source audit but failed Windows build validation. Keeping MCP bridge 0.11.0 alone did not resolve the Tauri 2.12 mismatch, so the npm and Rust Tauri family remains at R0 together.

## Unchanged because R0 already equals R2

These entries are not deferred upgrades.

| Package or crate | R0 | R2 target | Reason |
|---|---|---|---|
| `@acab/ecsstatic` | 0.9.0 | 0.9.0 | R0 already equals the R2 target; no version update was required. |
| `@interactjs/types` | 1.10.28 | 1.10.28 | R0 already equals the R2 target; no version update was required. |
| `@jaames/iro` | 5.5.2 | 5.5.2 | R0 already equals the R2 target; no version update was required. |
| `@jsquash/webp` | 1.5.0 | 1.5.0 | R0 already equals the R2 target; no version update was required. |
| `@sledge-pdm/core` | 1.2.7 | 1.2.7 | R0 already equals the R2 target; no version update was required. |
| `@sledge-pdm/frasco` | 0.2.9 | 0.2.9 | R0 already equals the R2 target; no version update was required. |
| `@sledge-pdm/ui` | 1.3.4 | 1.3.4 | R0 already equals the R2 target; no version update was required. |
| `@solid-primitives/deep` | 0.3.7 | 0.3.7 | R0 already equals the R2 target; no version update was required. |
| `@solid-primitives/map` | 0.7.4 | 0.7.4 | R0 already equals the R2 target; no version update was required. |
| `@solid-primitives/raf` | 2.3.5 | 2.3.5 | R0 already equals the R2 target; no version update was required. |
| `@solid-primitives/scheduled` | 1.5.3 | 1.5.3 | R0 already equals the R2 target; no version update was required. |
| `@solid-primitives/scroll` | 2.1.6 | 2.1.6 | R0 already equals the R2 target; no version update was required. |
| `@solid-primitives/timer` | 1.4.4 | 1.4.4 | R0 already equals the R2 target; no version update was required. |
| `@solidjs/meta` | 0.29.4 | 0.29.4 | R0 already equals the R2 target; no version update was required. |
| `base64-arraybuffer` | 1.0.2 | 1.0.2 | R0 already equals the R2 target; no version update was required. |
| `interactjs` | 1.10.28 | 1.10.28 | R0 already equals the R2 target; no version update was required. |
| `mitt` | 3.0.1 | 3.0.1 | R0 already equals the R2 target; no version update was required. |
| `prettier-plugin-organize-imports` | 4.3.0 | 4.3.0 | Already at the R2 target; this version is the TypeScript 7 compatibility blocker. |
| `vite-plugin-glsl` | 1.6.1 | 1.6.1 | R0 already equals the R2 target; no version update was required. |
| `vite-plugin-solid` | 2.11.14 | 2.11.14 | R0 already equals the R2 target; no version update was required. |
| `vite-plugin-wasm` | 3.6.0 | 3.6.0 | R0 already equals the R2 target; no version update was required. |
| `semver (Cargo)` | 1.0.28 | 1.0.28 | R0 already equals the R2 target; no version update was required. |
| `url (Cargo)` | 2.5.8 | 2.5.8 | R0 already equals the R2 target; no version update was required. |
| `windows (Cargo)` | 0.62.2 | 0.62.2 | R0 already equals the R2 target; no version update was required. |

## Validation

- Linked local Core, Frasco, and UI and verified that the installed packages resolve to those sibling repositories. Core and Frasco library outputs were built before consumer checks.
- Type checking, Vite build, and Vitest passed: 109 files, 610 tests. ESLint passed with four unused-disable warnings in generated declarations under existing `.claude/worktrees` directories.
- Chromium development-page checks passed: drawing changed visible pixels; undo restored the original pixels; redo restored the stroke; adding and dragging layers changed their order; editor, settings, about, and start routes rendered. No browser exceptions or console errors occurred in these scenarios.
- Sledge's own wasm-bindgen was updated to 0.2.129 and its JS/WASM pair regenerated with wasm-pack. Fourteen real WASM export probes matched the pre-update results, covering pixel flipping, opacity masks, mask combination, offsetting, fill, connected selection, rectangle/lasso selection, trimming, and path conversion.
- Windows `cargo test --locked` and `cargo clippy --locked --all-targets -- -D warnings` passed. Both the native crate and the WASM crate register zero Rust tests; these command results establish compilation, not functional coverage.
- The Windows Tauri debug build completed. Runtime checks passed for drawing/undo/redo, creation of another editor window through Rust IPC, and `get_process_memory`: native and child process bytes were positive and their sum equaled the reported total.
- Native startup initially exposed duplicate Solid runtimes from the app and linked UI. `SparkLine` failed with `Cannot access 'updateLine' before initialization`. Adding `resolve.dedupe: ['solid-js']` to the app and test configurations removed the duplicate runtime; the rebuilt native app passed the runtime checks above. Equal package versions alone did not prevent this linked-package failure.
- Validation used Windows, pnpm 11.5.2, Node 26.10.0 for build/test commands, Chromium, and WebView2. The default shell Node remains 22.14.0, below lint-staged 17.6.0's required version. macOS/cocoa execution, Linux packaging, native file dialogs, and updater installation were not validated.
