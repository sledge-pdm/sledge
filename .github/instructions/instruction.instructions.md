---
applyTo: '**'
---

This is the monorepo for project called Sledge.
Sledge is pixel-based drawing tool made with Tauri v2, SolidJS and Vite.

Apps

- /apps/sledge ... main app
- /apps/website ... brand website (https://sledge-rules.app)

Packages

- /packages/core ... core package (some basic types and consts)
- /packages/theme ... theme package (reset/global styles, fonts, and color theme)
- /packages/ui ... ui package (common things such as Dropdown)
- /packages/wasm ... Some functions written in WASM (mostly low-level and heavy actions, such as flood fill)

Note that this is monorepo, hence terminal will start in root path.
However, you can use the commands below in root path.

- pnpm dev = start sledge app(equal to "cd apps/sledge; pnpm tauri dev")
- pnpm build = build sledge app(equal to "cd apps/sledge; pnpm tauri build")
- pnpm site:dev = start sledge website(equal to "cd apps/website; pnpm dev")
- pnpm site:build = build sledge website(equal to "cd apps/website; pnpm build")
- pnpm wasm:build = build wasm package(equal to "cd packages/wasm && pnpm --ignore-workspace i && wasm-pack build --target bundler". also note that sledge uses vite and "--target bundler" is a proper argument.)

"pnpm wasm:build" should be called after any change in packages/wasm.

Sledge app imports package(including wasm) via tsconfig and vite alias, not via workspace dependencies.
So you don't need to rebuild or "pnpm install" after building wasm package (or after changing other packages).

Please avoid using "snapshot" for everything that bundles something.
In the concept, the word "snapshot" should means "the state of current editor including canvas image data."
Unless it is unavoidable, stop naming functions, values, and concepts using the word "snapshot" in other meaning.

Don't write the words like "early return" in the comments because it's very subjective word.
Instead, use more direct expressions like "return undefined when values are not ready".

naming "safeXXX" for functions or values. It's also subjective and just increases the number of values to handle.
Instead, consider assignning fallback-ed value for original value(e.g. "XXX").

In case of testing, ALWAYS USE `pnpm test` in project root. that's it. PLEASE don't mess up with commands.
